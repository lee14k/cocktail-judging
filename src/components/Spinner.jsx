export default function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center gap-3 text-ink-2">
      <span className="inline-block size-4 animate-spin rounded-full border-2 border-line border-t-amber" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
