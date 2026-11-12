import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatTime } from '../../lib/format'

const clamp = (n) => Math.min(100, Math.max(0, n))

/**
 * Click-to-pin sticky-note overlay for the scanned image.
 * Coordinates are stored as percentages of the image (x_coord / y_coord).
 * Only the parent can create pins; children can read them.
 */
export default function AnnotationLayer({ submissionId, canPin }) {
  const { user } = useAuth()
  const { notify } = useToast()

  const overlayRef = useRef(null)
  const [items, setItems] = useState([])
  const [composer, setComposer] = useState(null) // { x, y, text }
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!submissionId || !supabase) return
    const { data } = await supabase
      .from('annotations')
      .select('*, profiles:author_id ( display_name )')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true })
    setItems(data ?? [])
  }, [submissionId])

  useEffect(() => {
    setItems([])
    setOpenId(null)
    setComposer(null)
    load()
  }, [load])

  function handleOverlayClick(event) {
    if (!canPin) return
    const rect = overlayRef.current.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100)
    setOpenId(null)
    setComposer({ x, y, text: '' })
  }

  async function saveNote() {
    const text = composer.text.trim()
    if (!text || busy) return
    setBusy(true)
    const { error } = await supabase.from('annotations').insert({
      submission_id: submissionId,
      x_coord: composer.x,
      y_coord: composer.y,
      comment_text: text,
      author_id: user.id,
    })
    setBusy(false)
    if (error) {
      console.error(error)
      notify('Could not save that note.', 'error')
      return
    }
    setComposer(null)
    notify('Note pinned to the page.')
    load()
  }

  async function deleteNote(id) {
    const { error } = await supabase.from('annotations').delete().eq('id', id)
    if (error) {
      notify('Could not delete that note.', 'error')
      return
    }
    setOpenId(null)
    notify('Note removed.')
    load()
  }

  /** Keep popovers inside the image frame. */
  function popStyle(x, y) {
    const alignRight = x > 55
    const alignBottom = y > 60
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(${alignRight ? '-100%' : '0'}, ${alignBottom ? '-100%' : '0'})`,
      marginLeft: alignRight ? '-10px' : '10px',
      marginTop: alignBottom ? '-10px' : '10px',
    }
  }

  return (
    <>
      {/* Click-catcher for pin placement (parent only). */}
      {canPin && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="absolute inset-0 z-10 cursor-crosshair"
          aria-label="Click to pin a note"
        />
      )}

      {/* Existing pins */}
      {items.map((note, index) => {
        const isOpen = openId === note.id
        return (
          <div key={note.id} className="contents">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setComposer(null)
                setOpenId(isOpen ? null : note.id)
              }}
              style={{ left: `${note.x_coord}%`, top: `${note.y_coord}%` }}
              className="absolute z-20 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-accent text-[11px] font-bold text-white shadow-md transition-transform hover:scale-110"
              aria-label={`Feedback note ${index + 1}`}
            >
              {index + 1}
            </button>

            {isOpen && (
              <div
                style={popStyle(note.x_coord, note.y_coord)}
                className="absolute z-30 w-56 rounded-lg border border-rule bg-paper-raised p-3 text-left shadow-lg"
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="eyebrow">
                    {note.profiles?.display_name ?? 'Parent'}
                  </span>
                  <span className="text-[10px] text-ink-faint">
                    {formatDate(note.created_at)} · {formatTime(note.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed">
                  {note.comment_text}
                </p>
                {canPin && (
                  <div className="mt-2 flex justify-end border-t border-rule pt-2">
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="btn btn-ghost px-2 py-1 text-xs text-danger"
                    >
                      Delete note
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* New-note composer */}
      {composer && (
        <div
          style={popStyle(composer.x, composer.y)}
          className="absolute z-30 w-60 rounded-lg border border-accent bg-paper-raised p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="eyebrow mb-1.5">New note</p>
          <textarea
            autoFocus
            value={composer.text}
            onChange={(e) => setComposer({ ...composer, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote()
              if (e.key === 'Escape') setComposer(null)
            }}
            rows={3}
            placeholder="Try: 'Show us the puddle here — what did it look like?'"
            className="w-full resize-none rounded-md border border-rule bg-white px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setComposer(null)}
              className="btn btn-ghost px-2 py-1 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNote}
              disabled={busy || !composer.text.trim()}
              className="btn btn-primary px-3 py-1 text-xs"
            >
              {busy ? 'Saving…' : 'Pin note'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
