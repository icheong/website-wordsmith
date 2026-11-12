import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import WebcamCapture from './WebcamCapture'
import AnnotationLayer from './AnnotationLayer'

/**
 * Left pane of the workspace: renders the scanned page on a bright digital
 * lightbox with zoom controls and the parent annotation overlay.
 */
export default function Lightbox({ submission, editable, canPin, onImageChange }) {
  const { notify } = useToast()
  const [zoom, setZoom] = useState(100)
  const [capturing, setCapturing] = useState(false)

  const image = submission?.image_url
  const showCapture = !image || (capturing && editable)

  async function handleRemove() {
    // Best-effort cleanup of the stored object, then clear the reference.
    try {
      const pathname = new URL(image).pathname
      const marker = '/notebook-scans/'
      const path = pathname.includes(marker)
        ? pathname.slice(pathname.indexOf(marker) + marker.length)
        : null
      if (path) await supabase.storage.from('notebook-scans').remove([path])
    } catch {
      // Orphaned files are harmless; the reference is what matters.
    }
    setCapturing(false)
    setZoom(100)
    onImageChange(null)
    notify('Page removed from the lightbox.')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Lightbox toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <p className="eyebrow">Lightbox</p>

        <div className="flex items-center gap-1.5">
          {image && !showCapture && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                className="btn btn-ghost px-2 py-1 text-xs"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="w-10 text-center text-xs text-ink-soft">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(250, z + 25))}
                className="btn btn-ghost px-2 py-1 text-xs"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="btn btn-ghost px-2 py-1 text-xs"
              >
                Reset
              </button>
            </>
          )}

          {editable && image && !showCapture && (
            <>
              <span className="mx-1 h-4 w-px bg-rule" />
              <button
                type="button"
                onClick={() => setCapturing(true)}
                className="btn btn-quiet px-2.5 py-1 text-xs"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-ghost px-2 py-1 text-xs text-danger"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox bed */}
      <div className="relative min-h-[45vh] flex-1 overflow-auto bg-paper-deep p-4 sm:p-6 lg:min-h-0">
        {showCapture ? (
          <WebcamCapture
            onImageSaved={(url) => {
              setCapturing(false)
              setZoom(100)
              onImageChange(url)
            }}
            onCancel={image ? () => setCapturing(false) : undefined}
          />
        ) : image ? (
          <div className="mx-auto" style={{ width: `${zoom}%` }}>
            <div className="relative">
              <img
                src={image}
                alt="Scanned notebook page"
                draggable={false}
                className="block w-full select-none"
              />
              <AnnotationLayer
                submissionId={submission.id}
                canPin={canPin && !capturing}
              />
              {canPin && !capturing && (
                <div className="pointer-events-none absolute left-2 top-2 rounded bg-ink/70 px-2 py-1 text-[11px] tracking-wide text-paper">
                  Click the page to pin a note
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-sm text-ink-soft">
            No page scanned yet — this piece has only typed text.
          </div>
        )}
      </div>
    </div>
  )
}
