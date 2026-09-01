import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ToastProvider } from '../src/components/Toast.jsx'
import App from '../src/App.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
export async function mount(path) {
  window.history.pushState({}, '', path)
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(<BrowserRouter><ToastProvider><App /></ToastProvider></BrowserRouter>) })
  return { el, root, act, flush: async () => { await act(async () => { await new Promise(r => setTimeout(r, 30)) }) } }
}
