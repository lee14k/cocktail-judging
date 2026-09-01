// The competition mark: a coupe, drawn once, used everywhere.
export default function Mark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M4 7h24c0 8-5.4 12.5-12 12.5S4 15 4 7Z" fill="var(--amber)" />
      <path d="M16 19.5V27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9 28h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 7h24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
