import { useEffect, useMemo, useState } from 'react'
import { useStudio } from '../../context/StudioContext'
import { useToast } from '../../context/ToastContext'

const STEPS = [
  {
    key: 'skeleton',
    label: 'Skeleton',
    hint: 'Bare bones only: who did what?',
    placeholder: 'The dog ran.',
  },
  {
    key: 'setting',
    label: 'Setting',
    hint: 'Where and when did it happen?',
    placeholder: 'In the park after school, just as the rain stopped…',
  },
  {
    key: 'detail',
    label: 'Detail',
    hint: 'Add something to see, hear, smell or feel.',
    placeholder: '…its paws splashing through silver puddles…',
  },
  {
    key: 'action',
    label: 'Action & Consequence',
    hint: 'What happened next — and because of that…',
    placeholder: '…and it scattered a whole flock of pigeons into the grey sky.',
  },
]

const EMPTY = { skeleton: '', setting: '', detail: '', action: '' }

/** Join the ladder rungs into one flowing piece of writing. */
function combine(steps) {
  return Object.keys(EMPTY)
    .map((k) => (steps[k] ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Expand-a-Sentence Ladder: a four-rung guided expansion
 * (Skeleton → Setting → Detail → Action/Consequence).
 * Progress autosaves as a `sentence_ladder` draft.
 */
export default function SentenceLadder() {
  const { current, loadForModule, ensureAndPatch, setTab, flush } = useStudio()
  const { notify } = useToast()
  const [steps, setSteps] = useState(EMPTY)
  const [ready, setReady] = useState(false)

  // Resume the child's most recent ladder draft (if any) on mount.
  useEffect(() => {
    let cancelled = false
    loadForModule('sentence_ladder').then((draft) => {
      if (cancelled) return
      if (draft?.module_data) setSteps({ ...EMPTY, ...draft.module_data })
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [loadForModule])

  const derived = useMemo(() => combine(steps), [steps])
  const doneCount = STEPS.filter((s) => steps[s.key].trim()).length

  function handleChange(key, value) {
    const next = { ...steps, [key]: value }
    setSteps(next)
    ensureAndPatch('sentence_ladder', {
      module_data: next,
      typed_text: combine(next),
    })
  }

  async function handleOpenInWorkspace() {
    if (!derived) return
    await flush()
    setTab('workspace')
    notify('Your ladder draft is open in the Workspace.')
  }

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-ink-faint">
        Opening your ladder…
      </p>
    )
  }

  const currentOpenIsLadder = current?.module_type === 'sentence_ladder'

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      {/* The ladder */}
      <ol className="relative space-y-6">
        {STEPS.map((step, index) => {
          const filled = steps[step.key].trim().length > 0
          const isLast = index === STEPS.length - 1
          return (
            <li key={step.key} className="relative flex gap-4 pl-1">
              {/* Rail */}
              {!isLast && (
                <span
                  className={`absolute left-[17px] top-9 h-[calc(100%-0.5rem)] w-px ${
                    filled ? 'bg-accent/50' : 'bg-rule'
                  }`}
                />
              )}
              <span
                className={`relative z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                  filled
                    ? 'border-accent bg-accent text-white'
                    : 'border-rule bg-paper-raised text-ink-faint'
                }`}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 rounded-xl border border-rule bg-paper-raised p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <label
                    htmlFor={`ladder-${step.key}`}
                    className="font-serif text-lg"
                  >
                    {step.label}
                  </label>
                  <span className="text-xs text-ink-faint">{step.hint}</span>
                </div>
                <textarea
                  id={`ladder-${step.key}`}
                  value={steps[step.key]}
                  onChange={(e) => handleChange(step.key, e.target.value)}
                  placeholder={step.placeholder}
                  rows={step.key === 'skeleton' ? 2 : 3}
                  className="w-full resize-y rounded-lg border border-rule bg-white px-3 py-2 font-serif text-[17px] leading-relaxed outline-none placeholder:text-ink-faint focus:border-accent"
                />
              </div>
            </li>
          )
        })}
      </ol>

      {/* Live result + handoff */}
      <aside className="h-fit rounded-xl border border-rule bg-paper-raised p-5 lg:sticky lg:top-20">
        <p className="eyebrow mb-3">Your expanded sentence</p>
        <p className="min-h-24 font-serif text-[17px] leading-relaxed text-ink">
          {derived || (
            <span className="text-ink-faint">
              Start with the skeleton — one plain sentence. Each rung you fill
              in appears here.
            </span>
          )}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
          <span className="text-xs text-ink-faint">
            {doneCount} of {STEPS.length} rungs
          </span>
          <span
            className={`text-xs ${currentOpenIsLadder ? 'text-moss' : 'text-ink-faint'}`}
          >
            {currentOpenIsLadder ? 'Autosaving' : 'Not saved yet'}
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
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Sends this draft to the split-screen editor so you can type it up and
          scan your notebook page.
        </p>
      </aside>
    </div>
  )
}
