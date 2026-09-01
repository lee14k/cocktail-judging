import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const show = useCallback((message, { tone = 'default', duration = 3200 } = {}) => {
    const id = ++counter.current
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`sheet-enter pointer-events-auto max-w-md rounded-lg border px-4 py-3 text-sm font-bold shadow-sheet ${
              t.tone === 'error' ? 'border-cherry bg-cherry text-cherry-ink' : 'border-line bg-raised text-ink'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

// Convenience for async handlers: show the error message if one throws.
export function useGuard() {
  const toast = useToast()
  return useCallback(async (fn) => {
    try { return await fn() } catch (err) { toast(err.message || 'Something went wrong.', { tone: 'error' }); return undefined }
  }, [toast])
}

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    if (title) document.title = title
    return () => { document.title = previous }
  }, [title])
}
