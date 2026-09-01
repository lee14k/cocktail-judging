import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Mark from '../components/Mark.jsx'
import { api } from '../lib/api.js'
import { useDocumentTitle } from '../components/Toast.jsx'
import EntryForm from './EntryForm.jsx'
import { usePaperTheme } from './usePaperTheme.js'

// Standalone entry page, for when the form isn't embedded anywhere.
export default function EnterPage() {
  usePaperTheme()
  useDocumentTitle('Enter your cocktail')
  const [config, setConfig] = useState(null)
  useEffect(() => { api('/api/public/config').then(setConfig).catch(() => {}) }, [])

  return (
    <div className="theme-paper min-h-dvh bg-ground text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2"><Mark size={26} /><span>{config?.competitionName || 'Cocktail Competition'}</span></Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-3">Enter your cocktail</h1>
        <p className="mb-10 max-w-prose text-ink-2">
          Tell us about the drink and add a photo. A panel of judges reviews every entry without seeing who made it.
        </p>
        <EntryForm />
      </main>
    </div>
  )
}
