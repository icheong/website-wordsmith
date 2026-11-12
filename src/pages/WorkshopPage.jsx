import { useState } from 'react'
import SentenceLadder from '../components/workshop/SentenceLadder'
import ParagraphPillars from '../components/workshop/ParagraphPillars'

const TOOLS = [
  { id: 'ladder', label: 'Expand-a-Sentence Ladder' },
  { id: 'pillars', label: 'Paragraph Pillars' },
]

/** Module B — the primary sentence workshop (two micro-drill tools). */
export default function WorkshopPage() {
  const [tool, setTool] = useState('ladder')

  return (
    <div className="mx-auto w-full max-w-[70rem] px-5 py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">Module B</p>
        <h1 className="font-serif text-3xl tracking-tight">Sentence Workshop</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Small, deliberate practice. Build one sentence up step by step, or
          shape a whole paragraph with colour-coded structure — then send your
          work to the Workspace to finish it.
        </p>
      </div>

      <div className="mb-8 inline-flex rounded-lg border border-rule bg-paper-raised p-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={`rounded-md px-4 py-2 text-sm transition-colors ${
              tool === t.id
                ? 'bg-accent text-white'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tool === 'ladder' ? <SentenceLadder /> : <ParagraphPillars />}
    </div>
  )
}
