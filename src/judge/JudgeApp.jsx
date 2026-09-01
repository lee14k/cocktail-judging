import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, Heart, CheckCircle2, Lock } from 'lucide-react'
import { api } from '../lib/api.js'
import { useSession } from '../lib/useSession.js'
import { formatTime } from '../lib/format.js'
import { useToast, useDocumentTitle } from '../components/Toast.jsx'
import CodeGate from '../components/CodeGate.jsx'
import Spinner from '../components/Spinner.jsx'
import Mark from '../components/Mark.jsx'
import EntryCard from './EntryCard.jsx'
import EntryDetail from './EntryDetail.jsx'
import ShortlistRail from './ShortlistRail.jsx'
import ShortlistSheet from './ShortlistSheet.jsx'

export default function JudgeApp() {
  const { session, checking, login, logout, clear } = useSession('judge')
  useDocumentTitle('Judging')
  if (checking) return <div className="grid min-h-dvh place-items-center"><Spinner /></div>
  if (!session) {
    return (
      <CodeGate
        title="Judge sign-in"
        description="Enter the code from your judging invitation. You'll see each entry's photo, name, ingredients, and region. Entrant names and bars stay hidden."
        placeholder="e.g. JUDGE-04"
        onLogin={login}
      />
    )
  }
  return <JudgeBoard onLogout={logout} onSessionLost={clear} />
}

const POLL_MS = 20000

function JudgeBoard({ onLogout, onSessionLost }) {
  const toast = useToast()
  const [board, setBoard] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState('all') // 'all' | 'favorites'
  const [region, setRegion] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [shortlistOpen, setShortlistOpen] = useState(false)
  const pending = useRef(0)

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      const data = await api('/api/judge/board')
      // Don't let a poll overwrite a selection change that's still saving.
      if (pending.current > 0 && quiet) return
      setBoard(data)
      setLoadError('')
    } catch (err) {
      if (err.status === 401) return onSessionLost()
      if (!quiet) setLoadError(err.message)
    }
  }, [onSessionLost])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load({ quiet: true }) }
    const timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [load])

  const settings = board?.settings
  const state = board?.state
  const entries = board?.entries || []
  const favorites = useMemo(() => new Set(state?.favorites || []), [state])
  const shortlist = state?.shortlist || []
  const limit = settings?.shortlistLimit || 0
  const submitted = Boolean(state?.submitted)
  const locked = submitted || !settings?.judgingOpen
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])

  const counts = useMemo(() => {
    const c = { all: 0 }
    for (const e of entries) { c.all++; c[e.region] = (c[e.region] || 0) + 1 }
    return c
  }, [entries])

  const visible = useMemo(() => {
    let list = entries
    if (view === 'favorites') list = list.filter((e) => favorites.has(e.id))
    if (region !== 'all') list = list.filter((e) => e.region === region)
    return list
  }, [entries, view, region, favorites])

  // Optimistically apply a selection change, then let the server confirm it.
  const saveSelections = useCallback(async (nextFavorites, nextShortlist) => {
    if (!board) return
    const previous = board.state
    setBoard((b) => ({ ...b, state: { ...b.state, favorites: nextFavorites, shortlist: nextShortlist } }))
    pending.current++
    try {
      const saved = await api('/api/judge/selections', { method: 'PUT', body: { favorites: nextFavorites, shortlist: nextShortlist } })
      setBoard((b) => ({ ...b, state: saved }))
    } catch (err) {
      setBoard((b) => ({ ...b, state: previous }))
      toast(err.message, { tone: 'error' })
      if (err.status === 409 || err.status === 423) load()
    } finally {
      pending.current--
    }
  }, [board, toast, load])

  const toggleFavorite = useCallback((id) => {
    if (locked) return
    const nextFav = new Set(favorites)
    let nextShort = shortlist
    if (nextFav.has(id)) {
      nextFav.delete(id)
      nextShort = shortlist.filter((x) => x !== id)
    } else {
      nextFav.add(id)
    }
    saveSelections([...nextFav], nextShort)
  }, [locked, favorites, shortlist, saveSelections])

  const toggleShortlist = useCallback((id) => {
    if (locked) return
    if (shortlist.includes(id)) {
      saveSelections([...favorites], shortlist.filter((x) => x !== id))
      return
    }
    if (shortlist.length >= limit) {
      toast(`Your shortlist is full. Remove one to add another.`)
      return
    }
    const nextFav = new Set(favorites)
    nextFav.add(id) // shortlisting always keeps the entry a favorite
    saveSelections([...nextFav], [...shortlist, id])
  }, [locked, shortlist, favorites, limit, saveSelections, toast])

  const submitShortlist = useCallback(async () => {
    const saved = await api('/api/judge/submit', { method: 'POST' })
    setBoard((b) => ({ ...b, state: saved }))
    toast('Shortlist submitted')
  }, [toast])

  if (loadError && !board) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink-2">{loadError}</p>
        <button type="button" className="btn btn-secondary" onClick={() => load()}>Try again</button>
      </div>
    )
  }
  if (!board) return <div className="grid min-h-dvh place-items-center"><Spinner label="Loading entries" /></div>

  const openEntry = openId ? byId.get(openId) : null

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 border-b border-line bg-ground/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
          <Mark size={24} />
          <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{settings.competitionName}</span>
          <span className="text-sm font-bold">{board.judge.name}</span>
          <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={onLogout} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <div role="tablist" aria-label="Show" className="grid grid-cols-2 rounded-lg border border-line bg-surface p-1">
            <Tab selected={view === 'all'} onClick={() => setView('all')}>
              All entries <span className="opacity-70">{counts.all}</span>
            </Tab>
            <Tab selected={view === 'favorites'} onClick={() => setView('favorites')}>
              <Heart size={15} className={favorites.size ? 'fill-current' : ''} aria-hidden="true" />
              Favorites <span className="opacity-70">{favorites.size}</span>
            </Tab>
          </div>
        </div>
        <div className="hide-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2.5" role="group" aria-label="Filter by region">
          <button type="button" className="chip" aria-pressed={region === 'all'} onClick={() => setRegion('all')}>All regions</button>
          {settings.regions.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={region === r} onClick={() => setRegion(r)}>
              {r}{counts[r] ? <span className="ml-1.5 opacity-70">{counts[r]}</span> : null}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {submitted && (
          <Notice icon={<CheckCircle2 size={20} className="text-amber" />}>
            Your shortlist is in. Submitted {formatTime(state.submittedAt)}. You can keep browsing, but favorites and picks are now locked.
          </Notice>
        )}
        {!submitted && !settings.judgingOpen && (
          <Notice icon={<Lock size={20} className="text-cherry" />}>
            Judging is closed right now. You can browse entries, but favorites and the shortlist can't be changed.
          </Notice>
        )}

        {entries.length === 0 ? (
          <Empty title="No entries yet" text="Entries will appear here as contestants submit them." />
        ) : visible.length === 0 ? (
          view === 'favorites' ? (
            <Empty
              title={region === 'all' ? 'No favorites yet' : `No favorites in ${region} yet`}
              text="Tap the heart on any entry you'd like to come back to. Your shortlist gets picked from here."
              action={<button type="button" className="btn btn-secondary" onClick={() => { setView('all'); setRegion('all') }}>Browse all entries</button>}
            />
          ) : (
            <Empty title={`No entries from ${region}`} text="Try another region." />
          )
        ) : (
          <>
            {view === 'favorites' && !locked && (
              <p className="pt-4 text-sm text-ink-2">
                Choose up to {limit} of these for your final shortlist. {shortlist.length} of {limit} chosen.
              </p>
            )}
            <ul className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((entry) => (
                <li key={entry.id}>
                  <EntryCard
                    entry={entry}
                    favorite={favorites.has(entry.id)}
                    shortlisted={shortlist.includes(entry.id)}
                    showShortlistAction={view === 'favorites'}
                    shortlistFull={shortlist.length >= limit}
                    locked={locked}
                    onOpen={() => setOpenId(entry.id)}
                    onToggleFavorite={() => toggleFavorite(entry.id)}
                    onToggleShortlist={() => toggleShortlist(entry.id)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <ShortlistRail
        picks={shortlist.map((id) => byId.get(id)).filter(Boolean)}
        limit={limit}
        submitted={submitted}
        judgingOpen={settings.judgingOpen}
        onOpen={() => setShortlistOpen(true)}
      />

      <EntryDetail
        entry={openEntry}
        favorite={openEntry ? favorites.has(openEntry.id) : false}
        shortlisted={openEntry ? shortlist.includes(openEntry.id) : false}
        shortlistFull={shortlist.length >= limit}
        limit={limit}
        locked={locked}
        onClose={() => setOpenId(null)}
        onToggleFavorite={() => openEntry && toggleFavorite(openEntry.id)}
        onToggleShortlist={() => openEntry && toggleShortlist(openEntry.id)}
      />

      <ShortlistSheet
        open={shortlistOpen}
        onClose={() => setShortlistOpen(false)}
        picks={shortlist.map((id) => byId.get(id)).filter(Boolean)}
        limit={limit}
        submitted={submitted}
        submittedAt={state.submittedAt}
        judgingOpen={settings.judgingOpen}
        onRemove={toggleShortlist}
        onSubmit={submitShortlist}
        onBrowseFavorites={() => { setShortlistOpen(false); setView('favorites') }}
      />
    </div>
  )
}

function Tab({ selected, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-bold text-ink-2 transition-colors aria-selected:bg-ink aria-selected:text-ground"
    >
      {children}
    </button>
  )
}

function Notice({ icon, children }) {
  return (
    <div className="panel mt-4 flex items-start gap-3 px-4 py-3 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p>{children}</p>
    </div>
  )
}

function Empty({ title, text, action }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-start gap-3 py-16">
      <h2>{title}</h2>
      <p className="text-ink-2">{text}</p>
      {action}
    </div>
  )
}
