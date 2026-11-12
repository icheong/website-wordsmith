import { useMemo, useState } from 'react'
import prompts from '../data/prompts.json'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'

const CATEGORIES = ['All', 'Sensory', 'Perspective', 'Atmosphere']

/**
 * Module A — Static Prompt Library.
 * Hand-curated prompts from a local JSON file (zero AI dependency).
 * Clicking a prompt makes it the active writing task and opens the Workspace.
 */
export default function PromptLibrary() {
  const { activePrompt, applyPrompt } = useStudio()
  const { notify } = useToast()
  const [category, setCategory] = useState('All')

  const visible = useMemo(
    () =>
      category === 'All'
        ? prompts
        : prompts.filter((p) => p.category === category),
    [category],
  )

  function handlePick(prompt) {
    applyPrompt(prompt)
    notify('Prompt set — the Workspace is ready.')
  }

  function handleShuffle() {
    const pool = visible.filter((p) => p.id !== activePrompt?.id)
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? visible[0]
    if (pick) handlePick(pick)
  }

  return (
    <div className="mx-auto w-full max-w-[70rem] px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Module A</p>
          <h1 className="font-serif text-3xl tracking-tight">Prompt Library</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Twenty-four hand-picked prompts in three collections. Choose one and
            it becomes your writing task — no timers, no points, just the words.
          </p>
        </div>
        <button type="button" onClick={handleShuffle} className="btn btn-quiet">
          Shuffle a prompt
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              category === c
                ? 'border-accent bg-accent-wash text-accent-deep'
                : 'border-rule bg-paper-raised text-ink-soft hover:border-ink-faint hover:text-ink'
            }`}
          >
            {c}
            <span className="ml-1.5 text-xs text-ink-faint">
              {c === 'All'
                ? prompts.length
                : prompts.filter((p) => p.category === c).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((prompt) => {
          const isActive = activePrompt?.id === prompt.id
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handlePick(prompt)}
              className={`group flex flex-col rounded-xl border p-5 text-left transition-colors ${
                isActive
                  ? 'border-accent bg-accent-wash'
                  : 'border-rule bg-paper-raised hover:border-ink-faint'
              }`}
            >
              <span className="eyebrow mb-3">{prompt.category}</span>
              <span className="font-serif text-[17px] leading-relaxed">
                {prompt.text}
              </span>
              <span
                className={`mt-4 text-sm font-medium ${
                  isActive ? 'text-accent-deep' : 'text-ink-faint group-hover:text-accent'
                }`}
              >
                {isActive ? 'Active task ✓' : 'Use this prompt →'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
