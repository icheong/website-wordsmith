import { useMemo, useState } from 'react'
import { useStudio } from '../context/StudioContext'
import {
  MODULE_LABELS,
  STATUS_META,
  countWords,
  formatDate,
} from '../lib/format'

const FILTERS = [
  { id: 'submitted', label: 'Needs review' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'all', label: 'All' },
]

/**
 * Parent-only Reviews tab: submissions waiting for feedback, the ones already
 * reviewed, and a full history. Opening a row hands off to the Workspace.
 */
export default function ReviewsPage() {
  const { list, openSubmission, setTab } = useStudio()
  const [filter, setFilter] = useState('submitted')

  const counts = useMemo(
    () => ({
      submitted: list.filter((s) => s.status === 'submitted').length,
      reviewed: list.filter((s) => s.status === 'reviewed').length,
      all: list.length,
    }),
    [list],
  )

  const visible = useMemo(() => {
    const rows = filter === 'all' ? list : list.filter((s) => s.status === filter)
    return [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [list, filter])

  async function handleOpen(id) {
    await openSubmission(id)
    setTab('workspace')
  }

  return (
    <div className="mx-auto w-full max-w-[70rem] px-5 py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">Parent</p>
        <h1 className="font-serif text-3xl tracking-tight">Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Open a piece to read it side by side with the notebook scan, then
          click anywhere on the page to pin a note. Mark it reviewed when
          you’re done.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              filter === f.id
                ? 'border-accent bg-accent-wash text-accent-deep'
                : 'border-rule bg-paper-raised text-ink-soft hover:border-ink-faint hover:text-ink'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs text-ink-faint">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule bg-paper-raised px-6 py-14 text-center">
          <p className="font-serif text-lg">
            {filter === 'submitted' ? 'Nothing waiting for review.' : 'Nothing here yet.'}
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            {filter === 'submitted'
              ? 'When a child submits a piece it will appear here.'
              : 'Pieces will collect here as they move through review.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-rule bg-paper-raised">
          {visible.map((item, index) => {
            const meta = STATUS_META[item.status]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpen(item.id)}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-paper-deep ${
                  index > 0 ? 'border-t border-rule' : ''
                }`}
              >
                {/* Thumbnail */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    className="size-12 shrink-0 rounded-md border border-rule object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-md border border-rule bg-paper text-[10px] text-ink-faint">
                    no scan
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-medium">
                      {item.title || 'Untitled piece'}
                    </span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {item.profiles?.display_name ?? 'Unknown'}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-soft">
                    {MODULE_LABELS[item.module_type]} ·{' '}
                    {countWords(item.typed_text)} words ·{' '}
                    {formatDate(item.created_at)}
                    {item.image_url ? ' · scan attached' : ''}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
                >
                  {meta.label}
                </span>
                <span className="shrink-0 text-sm text-accent">Open →</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
