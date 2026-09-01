import { useEffect } from 'react'

// The contestant pages use the light theme. Switching it on the <html>
// element lets the body background follow, and puts it back on unmount.
export function usePaperTheme() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-paper')
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = meta?.getAttribute('content')
    meta?.setAttribute('content', '#ffffff')
    return () => {
      root.classList.remove('theme-paper')
      if (previous) meta?.setAttribute('content', previous)
    }
  }, [])
}
