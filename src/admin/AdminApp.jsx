import { useCallback, useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSession } from '../lib/useSession.js'
import { useDocumentTitle } from '../components/Toast.jsx'
import CodeGate from '../components/CodeGate.jsx'
import Spinner from '../components/Spinner.jsx'
import Mark from '../components/Mark.jsx'
import Leaderboard from './Leaderboard.jsx'
import Entries from './Entries.jsx'
import Judges from './Judges.jsx'
import Settings from './Settings.jsx'

export default function AdminApp() {
  const { session, checking, login, logout, clear } = useSession('admin')
  useDocumentTitle('Admin')
  if (checking) return <div className="grid min-h-dvh place-items-center"><Spinner /></div>
  if (!session) {
    return (
      <CodeGate
        title="Admin sign-in"
        description="Manage judging, see the leaderboard, and review entries."
        placeholder="Admin code"
        onLogin={login}
      />
    )
  }
  return <Dashboard onLogout={logout} onSessionLost={clear} />
}

const TABS = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'entries', label: 'Entries' },
  { id: 'judges', label: 'Judges' },
  { id: 'settings', label: 'Settings' },
]

const POLL_MS = 10000

function Dashboard({ onLogout, onSessionLost }) {
  const [tab, setTab] = useState('leaderboard')
  const [includeUnsubmitted, setIncludeUnsubmitted] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await api(`/api/admin/overview?includeUnsubmitted=${includeUnsubmitted ? 1 : 0}`))
      setError('')
    } catch (err) {
      if (err.status === 401) return onSessionLost()
      setError(err.message)
    }
  }, [includeUnsubmitted, onSessionLost])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load() }
    const timer = setInterval(tick, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  if (!data) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-ink-2">{error}</p>
            <button type="button" className="btn btn-secondary" onClick={load}>Try again</button>
          </div>
        ) : <Spinner />}
      </div>
    )
  }

  const { settings, judges } = data
  const submittedCount = judges.filter((j) => j.submitted).length

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <span className="inline-flex items-center gap-2">
            <Mark size={24} />
            <span className="font-display text-lg">{settings.competitionName}</span>
          </span>
          <span className="text-sm text-ink-2">Admin</span>
          <span className="ml-auto inline-flex items-center gap-2 text-sm">
            <span className={`size-2.5 rounded-full ${settings.judgingOpen ? 'bg-amber' : 'bg-cherry'}`} aria-hidden="true" />
            {settings.judgingOpen ? 'Judging open' : 'Judging closed'}
            <span className="text-ink-2">{submittedCount} of {judges.length} submitted</span>
          </span>
          <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={onLogout} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Admin sections">
          <ul className="hide-scrollbar -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-bold text-ink-2 hover:text-ink aria-[current=page]:border-amber aria-[current=page]:text-ink"
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && <p className="mb-4 text-sm text-cherry" role="alert">{error}</p>}
        {tab === 'leaderboard' && (
          <Leaderboard data={data} includeUnsubmitted={includeUnsubmitted} onIncludeUnsubmitted={setIncludeUnsubmitted} onGoToSettings={() => setTab('settings')} />
        )}
        {tab === 'entries' && <Entries data={data} onChanged={load} />}
        {tab === 'judges' && <Judges data={data} onChanged={load} />}
        {tab === 'settings' && <Settings data={data} onChanged={load} />}
      </main>
    </div>
  )
}
