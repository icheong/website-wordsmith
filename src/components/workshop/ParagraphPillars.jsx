import { useEffect, useMemo, useState } from 'react'
import { useStudio } from '../../context/StudioContext'
import { useToast } from '../../context/ToastContext'

const EMPTY = { pillar: '', beams: [''], anchor: '' }

function combine(structure) {
  return [structure.pillar, ...structure.beams, structure.anchor]
    .map((t) => (t ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Paragraph Pillars: colour-coded structure blocks —
 * Topic sentence (Pillar) → Supporting details (Beams) → Closing (Anchor).
 * Autosaves as a `paragraph_builder` draft.
 */
export default function ParagraphPillars() {
  const { current, loadForModule, ensureAndPatch, setTab, flush } = useStudio()
  const { notify } = useToast()
  const [structure, setStructure] = useState(EMPTY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadForModule('paragraph_builder').then((draft) => {
      if (cancelled) return
      if (draft?.module_data) {
        setStructure({
          pillar: draft.module_data.pillar ?? '',
          beams:
            Array.isArray(draft.module_data.beams) && draft.module_data.beams.length
              ? draft.module_data.beams
              : [''],
          anchor: draft.module_data.anchor ?? '',
        })
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [loadForModule])

  const derived = useMemo(() => combine(structure), [structure])

  function push(next) {
    setStructure(next)
    ensureAndPatch('paragraph_builder', {
      module_data: next,
      typed_text: combine(next),
    })
  }

  function setBeam(index, value) {
    const beams = structure.beams.map((b, i) => (i === index ? value : b))
    push({ ...structure, beams })
  }

  function addBeam() {
    push({ ...structure, beams: [...structure.beams, ''] })
  }

  function removeBeam(index) {
    if (structure.beams.length === 1) return
    push({
      ...structure,
      beams: structure.beams.filter((_, i) => i !== index),
    })
  }

  async function handleOpenInWorkspace() {
    if (!derived) return
    await flush()
    setTab('workspace')
    notify('Your paragraph draft is open in the Workspace.')
  }

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-ink-faint">
        Opening your pillars…
      </p>
    )
  }

  const currentOpenIsPillars = current?.module_type === 'paragraph_builder'
  const beamCount = structure.beams.filter((b) => b.trim()).length

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        {/* Pillar — topic sentence */}
        <BlockShell
          tone="accent"
          label="Pillar — Topic sentence"
          hint="One clear sentence that says what the paragraph is about."
        >
          <textarea
            value={structure.pillar}
            onChange={(e) => push({ ...structure, pillar: e.target.value })}
            placeholder="Our class pet, Winston, is the funniest animal in school."
            rows={2}
            className="w-full resize-y rounded-lg border border-rule bg-white px-3 py-2 font-serif text-[17px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </BlockShell>

        {/* Beams — supporting details */}
        <div className="rounded-xl border border-ochre/40 bg-ochre-wash p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-ochre">
              Beams — Supporting details
            </p>
            <span className="text-xs text-ink-soft">
              Facts, examples and reasons that hold the pillar up.
            </span>
          </div>

          <div className="space-y-3">
            {structure.beams.map((beam, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-semibold text-ochre">
                  {index + 1}
                </span>
                <textarea
                  value={beam}
                  onChange={(e) => setBeam(index, e.target.value)}
                  placeholder="He sleeps in a shoebox and wears a tiny knitted hat."
                  rows={2}
                  className="w-full resize-y rounded-lg border border-rule bg-white px-3 py-2 font-serif text-[17px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-ochre"
                />
                <button
                  type="button"
                  onClick={() => removeBeam(index)}
                  disabled={structure.beams.length === 1}
                  aria-label={`Remove beam ${index + 1}`}
                  className="btn btn-ghost mt-1 shrink-0 px-2 py-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBeam}
            className="btn btn-quiet mt-3 border-ochre/40 text-ochre"
          >
            + Add beam
          </button>
        </div>

        {/* Anchor — closing */}
        <BlockShell
          tone="moss"
          label="Anchor — Closing sentence"
          hint="Wrap it up, circle back to the pillar, or leave a lasting thought."
        >
          <textarea
            value={structure.anchor}
            onChange={(e) => push({ ...structure, anchor: e.target.value })}
            placeholder="Honestly, no textbook could ever make me laugh like Winston does."
            rows={2}
            className="w-full resize-y rounded-lg border border-rule bg-white px-3 py-2 font-serif text-[17px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-moss"
          />
        </BlockShell>
      </div>

      {/* Live result + handoff */}
      <aside className="h-fit rounded-xl border border-rule bg-paper-raised p-5 lg:sticky lg:top-20">
        <p className="eyebrow mb-3">Your paragraph</p>
        <p className="min-h-24 font-serif text-[17px] leading-relaxed">
          {derived || (
            <span className="text-ink-faint">
              A pillar, a few beams and an anchor make a paragraph that stands
              up on its own.
            </span>
          )}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
          <span className="text-xs text-ink-faint">
            {beamCount} beam{beamCount === 1 ? '' : 's'} in place
          </span>
          <span
            className={`text-xs ${currentOpenIsPillars ? 'text-moss' : 'text-ink-faint'}`}
          >
            {currentOpenIsPillars ? 'Autosaving' : 'Not saved yet'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenInWorkspace}
          disabled={!derived}
          className="btn btn-primary mt-4 w-full justify-center"
        >
          Open in Workspace →
        </button>
      </aside>
    </div>
  )
}

/** Shared frame for the Pillar and Anchor blocks. */
function BlockShell({ tone, label, hint, children }) {
  const tones = {
    accent: { border: 'border-accent/40', bg: 'bg-accent-wash', text: 'text-accent-deep' },
    moss: { border: 'border-moss/40', bg: 'bg-moss-wash', text: 'text-moss' },
  }
  const t = tones[tone]
  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-5`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className={`text-sm font-semibold ${t.text}`}>{label}</p>
        <span className="text-xs text-ink-soft">{hint}</span>
      </div>
      {children}
    </div>
  )
}
