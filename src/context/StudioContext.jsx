import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const StudioContext = createContext(null)

const AUTOSAVE_DELAY = 800
const PROMPT_STORAGE_KEY = 'ws.activePrompt'

/**
 * Central studio state:
 *  - `tab` for the single-app-shell navigation (Prompts / Workshop / Workspace / Reviews)
 *  - `current` — the submission open in the Workspace (drills and the prompt
 *    library hand off to it), plus a debounced autosave queue.
 *  - `list` — recent submissions (own for kids, all for the parent).
 */
export function StudioProvider({ children }) {
  const { user, isParent } = useAuth()

  const [tab, setTab] = useState('prompts')
  const [current, setCurrent] = useState(null)
  const [list, setList] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [activePrompt, setActivePrompt] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY)) ?? null
    } catch {
      return null
    }
  })

  const currentRef = useRef(null)
  const pendingRef = useRef({})
  const timerRef = useRef(null)
  // In-flight ensure promises, keyed by module type (never shared across types).
  const ensureRef = useRef(new Map())

  // Keep a synchronous mirror of `current` so timers always see fresh state.
  const applyCurrent = useCallback((next) => {
    currentRef.current = next
    setCurrent(next)
  }, [])

  /** Flush queued autosave fields immediately. */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const fields = pendingRef.current
    const base = currentRef.current
    if (!Object.keys(fields).length || !base?.id || !supabase) return
    pendingRef.current = {}
    setSaveState('saving')
    const { error } = await supabase
      .from('submissions')
      .update(fields)
      .eq('id', base.id)
    if (error) {
      // Re-queue failed fields so nothing is lost.
      pendingRef.current = { ...fields, ...pendingRef.current }
      setSaveState('error')
      console.error('Autosave failed:', error)
    } else {
      setSaveState('saved')
    }
  }, [])

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, AUTOSAVE_DELAY)
  }, [flush])

  /** Merge fields into the open submission and autosave them. */
  const patch = useCallback(
    (fields) => {
      const base = currentRef.current
      if (!base?.id) return false
      applyCurrent({ ...base, ...fields })
      pendingRef.current = { ...pendingRef.current, ...fields }
      scheduleFlush()
      return true
    },
    [applyCurrent, scheduleFlush],
  )

  const refreshList = useCallback(async () => {
    if (!user || !supabase) return
    setListLoading(true)
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles:user_id ( display_name, role )')
      .order('created_at', { ascending: false })
      .limit(100)
    setList(data ?? [])
    setListLoading(false)
  }, [user])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  /** Create a fresh draft row and make it the open submission. */
  const createDraft = useCallback(
    async ({
      moduleType = 'free_write',
      title = '',
      typedText = '',
      moduleData = null,
      imageUrl = null,
      promptText,
    } = {}) => {
      await flush()
      if (!user || !supabase) return null
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          module_type: moduleType,
          title,
          typed_text: typedText,
          module_data: moduleData,
          image_url: imageUrl,
          prompt_text:
            promptText !== undefined
              ? promptText
              : (activePrompt?.text ?? null),
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      applyCurrent(data)
      refreshList()
      return data
    },
    [user, activePrompt, applyCurrent, flush, refreshList],
  )

  /**
   * Guarantee an open draft of `moduleType`: reuse the current one, resume the
   * most recent draft of that type, or create a new one. Serialized per type so
   * rapid keystrokes can never create duplicate rows.
   */
  const ensureDraft = useCallback(
    (moduleType) => {
      const existing = currentRef.current
      if (existing?.id && existing.module_type === moduleType) {
        return Promise.resolve(existing)
      }
      const inFlight = ensureRef.current.get(moduleType)
      if (inFlight) return inFlight

      const promise = (async () => {
        await flush()
        const { data } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('module_type', moduleType)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) {
          applyCurrent(data)
          return data
        }
        return createDraft({ moduleType })
      })()

      ensureRef.current.set(moduleType, promise)
      promise
        .catch(() => {})
        .finally(() => ensureRef.current.delete(moduleType))

      return promise
    },
    [applyCurrent, createDraft, flush, user],
  )

  /** Ensure a draft of `moduleType` exists, then merge `fields` into it. */
  const ensureAndPatch = useCallback(
    async (moduleType, fields) => {
      const draft = await ensureDraft(moduleType)
      if (!draft) return null
      // Another module's draft may have become current while we waited.
      if (currentRef.current?.id !== draft.id) applyCurrent(draft)
      patch(fields)
      return draft
    },
    [applyCurrent, ensureDraft, patch],
  )

  /**
   * Load the most recent draft of a module type into the workspace
   * (used by the Workshop tabs so drills resume where the child left off).
   */
  const loadForModule = useCallback(
    async (moduleType) => {
      await flush()
      const existing = currentRef.current
      if (existing?.id && existing.module_type === moduleType) return existing
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_type', moduleType)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) applyCurrent(data)
      return data ?? null
    },
    [applyCurrent, flush, user],
  )

  /** Open an existing submission in the workspace. */
  const openSubmission = useCallback(
    async (id) => {
      await flush()
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      applyCurrent(data)
      return data
    },
    [applyCurrent, flush],
  )

  /** "New piece" in the workspace toolbar. */
  const newDraft = useCallback(
    () => createDraft({ moduleType: 'free_write', title: '' }),
    [createDraft],
  )

  /** Persist a status change immediately (submit / reviewed / reopen). */
  const setStatus = useCallback(
    async (status) => {
      patch({ status })
      await flush()
      refreshList()
    },
    [patch, flush, refreshList],
  )

  /** Prompt library: set the active prompt and jump to the workspace. */
  const applyPrompt = useCallback(
    (prompt) => {
      setActivePrompt(prompt)
      localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompt))
      if (currentRef.current?.id) patch({ prompt_text: prompt.text })
      setTab('workspace')
    },
    [patch],
  )

  const clearPrompt = useCallback(() => {
    setActivePrompt(null)
    localStorage.removeItem(PROMPT_STORAGE_KEY)
    patch({ prompt_text: null })
  }, [patch])

  const value = useMemo(
    () => ({
      tab,
      setTab,
      current,
      list,
      listLoading,
      saveState,
      activePrompt,
      patch,
      flush,
      createDraft,
      ensureDraft,
      ensureAndPatch,
      loadForModule,
      openSubmission,
      newDraft,
      setStatus,
      refreshList,
      applyPrompt,
      clearPrompt,
      isParent,
    }),
    [
      tab,
      current,
      list,
      listLoading,
      saveState,
      activePrompt,
      patch,
      flush,
      createDraft,
      ensureDraft,
      ensureAndPatch,
      loadForModule,
      openSubmission,
      newDraft,
      setStatus,
      refreshList,
      applyPrompt,
      clearPrompt,
      isParent,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>')
  return ctx
}
