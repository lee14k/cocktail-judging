import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// A bottom sheet on phones, a centered dialog on larger screens.
export default function Sheet({ open, onClose, title, children, footer, wide = false }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    // Land keyboard focus on the sheet's content first, not its close button.
    requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const controls = 'button, [href], input, textarea, select'
      const target = panel.querySelector(`[data-sheet-body] ${controls.split(', ').map((c) => `[data-sheet-body] ${c}`).join(', ')}`)
        || panel.querySelector(`[data-sheet-footer] ${controls.split(', ').join(', [data-sheet-footer] ')}`)
        || panel.querySelector('[data-sheet-close]')
      target?.focus()
    })
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        className={`sheet-enter relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-sheet sm:max-h-[85vh] sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="border-b border-line px-5 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            {title ? <h2 id="sheet-title" className="text-h3">{title}</h2> : <span />}
            <button type="button" data-sheet-close className="btn btn-ghost btn-sm -mr-2 -mt-1 shrink-0" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div data-sheet-body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div data-sheet-footer className="border-t border-line bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  )
}
