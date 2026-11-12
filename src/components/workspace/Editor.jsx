import { countWords } from '../../lib/format'

/**
 * Right pane of the split-screen workspace: the distraction-free craft editor.
 * Read-only for children once a piece is submitted (feedback lives on the pins).
 */
export default function Editor({
  value,
  onChange,
  promptText,
  onClearPrompt,
  readOnly,
  saveState,
  statusNotice,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Active prompt banner */}
      {promptText && (
        <div className="flex items-start gap-3 border-b border-rule bg-accent-wash px-5 py-3">
          <span className="eyebrow mt-0.5 shrink-0 text-accent-deep">Prompt</span>
          <p className="flex-1 font-serif text-[15px] italic leading-relaxed text-accent-deep">
            {promptText}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={onClearPrompt}
              aria-label="Clear prompt"
              className="btn btn-ghost shrink-0 px-2 py-1 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Writing surface */}
      <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck
          placeholder="Begin here. One sentence is enough to start…"
          className="ruled min-h-72 w-full flex-1 resize-none bg-transparent px-1 font-serif text-[19px] text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      {/* Footer: counts + autosave state */}
      <div className="flex items-center justify-between border-t border-rule px-5 py-2.5 text-xs text-ink-faint">
        <span>
          {countWords(value)} word{countWords(value) === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-3">
          {statusNotice}
          {saveState === 'saving' && <span>Saving…</span>}
          {saveState === 'saved' && <span className="text-moss">Saved</span>}
          {saveState === 'error' && (
            <span className="text-danger">Not saved — check connection</span>
          )}
        </span>
      </div>
    </div>
  )
}
