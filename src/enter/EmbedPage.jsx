import { useCallback, useEffect, useRef } from 'react'
import EntryForm from './EntryForm.jsx'
import { usePaperTheme } from './usePaperTheme.js'

// The iframe version: no chrome, light theme, and it tells the host page its
// height so the iframe can grow instead of showing an inner scrollbar.
export default function EmbedPage() {
  usePaperTheme()
  const ref = useRef(null)

  const postHeight = useCallback(() => {
    if (window.parent === window || !ref.current) return
    const height = Math.ceil(ref.current.getBoundingClientRect().height) + 2
    window.parent.postMessage({ type: 'entry-form-height', height }, '*')
  }, [])

  useEffect(() => {
    postHeight()
    const observer = new ResizeObserver(postHeight)
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [postHeight])

  return (
    <div className="theme-paper bg-ground text-ink">
      <div ref={ref} className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
        <EntryForm onHeightChange={postHeight} />
      </div>
    </div>
  )
}
