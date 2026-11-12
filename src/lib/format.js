/** Small formatting helpers shared across the workspace. */

export function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const MODULE_LABELS = {
  free_write: 'Free write',
  sentence_ladder: 'Sentence ladder',
  paragraph_builder: 'Paragraph pillars',
}

export const STATUS_META = {
  draft: { label: 'Draft', className: 'bg-paper-deep text-ink-soft' },
  submitted: { label: 'Submitted', className: 'bg-accent-wash text-accent-deep' },
  reviewed: { label: 'Reviewed', className: 'bg-moss-wash text-moss' },
}
