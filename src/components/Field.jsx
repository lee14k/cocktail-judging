import { useId } from 'react'

// Label, control, help text, and error, wired together for screen readers.
export default function Field({ label, help, error, children, optional = false }) {
  const id = useId()
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-2">(optional)</span>}
      </label>
      {typeof children === 'function' ? children({ id, describedBy, invalid: Boolean(error) }) : children}
      {help && !error && <p id={`${id}-help`} className="text-sm text-ink-2">{help}</p>}
      {error && <p id={`${id}-error`} className="text-sm font-bold text-cherry" role="alert">{error}</p>}
    </div>
  )
}
