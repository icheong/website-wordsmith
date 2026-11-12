import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import Lightbox from '../components/workspace/Lightbox'
import Editor from '../components/workspace/Editor'
import {
  MODULE_LABELS,
  STATUS_META,
  formatDate,
} from '../lib/format'

/** Split-screen lightbox + editor workspace (Module C). */
export default function WorkspacePage() {
  const { user } = useAuth()
  const {
    current,
    list,
    patch,
    flush,
    newDraft,
    openSubmission,
    setStatus,
    activePrompt,
    clearPrompt,
    isParent,
    saveState,
  } = useStudio()
  const { notify } = useToast()

  const [openList, setOpenList] = useState(false)
  const [starting, setStarting] = useState(false)

  const isOwner = Boolean(current && user && current.user_id === user.id)
  const canEdit = isOwner && current?.status === 'draft'
  const canPin = isParent
  const hasContent = Boolean(
    current?.typed_text?.trim() || current?.image_url,
  )

  const statusNotice = useMemo(() => {
    if (!current) return null
    if (!isOwner) return `Reviewing ${current.profiles?.display_name ?? 'submission'}`
    if (current.status === 'submitted') return 'Waiting for review'
    if (current.status === 'reviewed')
      return 'Reviewed — the notes are pinned on your page'
    return null
  }, [current, isOwner])

  async function handleNew() {
    setStarting(true)
    try {
      await newDraft()
      notify('New piece started.')
    } finally {
      setStarting(false)
    }
  }

  async function handleOpen(id) {
    setOpenList(false)
    await openSubmission(id)
  }

  async function handleSubmit() {
    if (!hasContent) return
    await flush()
    await setStatus('submitted')
    notify('Submitted — it will appear in Reviews.')
  }

  async function handleMarkReviewed() {
    await setStatus('reviewed')
    notify('Marked as reviewed.')
  }

  async function handleReopen() {
    await setStatus('draft')
    notify('Reopened as a draft.')
  }

  // -------------------------------------------------------------- empty state
  if (!current) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
        <p className="eyebrow mb-2">Module C</p>
        <h1 className="font-serif text-3xl tracking-tight">The Workspace</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          A split-screen studio: scan your notebook page on the left, type your
          finished piece on the right.
        </p>

        {activePrompt && (
          <div className="mx-auto mt-7 max-w-lg rounded-xl border border-accent/40 bg-accent-wash p-4 text-left">
            <p className="eyebrow mb-1.5 text-accent-deep">
              Today’s prompt · {activePrompt.category}
            </p>
            <p className="font-serif text-[17px] leading-relaxed text-accent-deep">
              {activePrompt.text}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleNew}
          disabled={starting}
          className="btn btn-primary mx-auto mt-7"
        >
          {starting ? 'Starting…' : 'Start a new piece'}
        </button>

        {list.length > 0 && (
          <div className="mt-10 text-left">
            <p className="eyebrow mb-3">Continue a piece</p>
            <div className="space-y-2">
              {list.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpen(item.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-rule bg-paper-raised px-4 py-3 text-left transition-colors hover:border-ink-faint"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {item.title || 'Untitled piece'}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {MODULE_LABELS[item.module_type]} · {formatDate(item.created_at)}
                    </span>
                  </span>
                  <StatusChip status={item.status} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------- open piece
  const statusMeta = STATUS_META[current.status]

  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-2.5">
        <input
          value={current.title ?? ''}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Untitled piece"
          disabled={!canEdit && !isParent}
          className="min-w-40 flex-1 bg-transparent font-serif text-lg outline-none placeholder:text-ink-faint disabled:opacity-70"
          aria-label="Piece title"
        />

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
        <span className="hidden rounded-full bg-paper-deep px-2.5 py-1 text-[11px] font-semibold text-ink-soft sm:inline">
          {MODULE_LABELS[current.module_type]}
        </span>

        {/* Open a recent piece */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenList((v) => !v)}
            className="btn btn-quiet"
          >
            Open ▾
          </button>
          {openList && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenList(false)}
              />
              <div className="absolute right-0 z-50 mt-2 max-h-80 w-72 overflow-auto rounded-xl border border-rule bg-paper-raised p-1.5 shadow-lg">
                {list.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-ink-faint">
                    No saved pieces yet.
                  </p>
                )}
                {list.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpen(item.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-paper-deep ${
                      item.id === current.id ? 'bg-accent-wash' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {item.title || 'Untitled piece'}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {MODULE_LABELS[item.module_type]} ·{' '}
                        {formatDate(item.created_at)}
                      </span>
                    </span>
                    <StatusChip status={item.status} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleNew}
          disabled={starting}
          className="btn btn-quiet"
        >
          New
        </button>

        {/* Actions: owner submits, parent reviews / reopens. */}
        {isOwner && current.status === 'draft' && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent}
            title={hasContent ? undefined : 'Write something or scan a page first'}
            className="btn btn-primary"
          >
            Submit
          </button>
        )}
        {!isOwner && isParent && current.status === 'submitted' && (
          <button type="button" onClick={handleMarkReviewed} className="btn btn-primary">
            Mark as reviewed
          </button>
        )}
        {!isOwner && isParent && current.status === 'reviewed' && (
          <button type="button" onClick={handleReopen} className="btn btn-quiet">
            Reopen as draft
          </button>
        )}
      </div>

      {/* Split screen */}
      <div className="grid grid-cols-1 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <section className="border-b border-rule lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
          <Lightbox
            submission={current}
            editable={canEdit}
            canPin={canPin}
            onImageChange={(url) => patch({ image_url: url })}
          />
        </section>

        <section className="flex flex-col lg:min-h-0 lg:overflow-hidden">
          <Editor
            value={current.typed_text}
            onChange={(value) => patch({ typed_text: value })}
            promptText={
              current.prompt_text ??
              (isOwner && current.status === 'draft' ? activePrompt?.text : null)
            }
            onClearPrompt={clearPrompt}
            readOnly={!canEdit}
            saveState={saveState}
            statusNotice={statusNotice}
          />
          {!canEdit && (
            <p className="border-t border-rule bg-paper-raised px-5 py-2 text-xs text-ink-soft">
              {!isOwner
                ? 'Read-only view — pin your feedback on the lightbox on the left.'
                : `This piece is ${statusMeta.label.toLowerCase()} — your parent can reopen it as a draft if it needs more work.`}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function StatusChip({ status }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}
