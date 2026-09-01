import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/format.js'
import { useGuard, useToast } from '../components/Toast.jsx'
import Sheet from '../components/Sheet.jsx'

// Every entry with the details judges never see.
export default function Entries({ data, onChanged }) {
  const { entries, settings } = data
  const [region, setRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const guard = useGuard()
  const toast = useToast()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => region === 'all' || e.region === region)
      .filter((e) => !q || [e.drinkName, e.entrantName, e.bar, e.city, ...e.ingredients].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
  }, [entries, region, query])

  async function remove(entry) {
    await guard(async () => {
      await api(`/api/admin/entries/${entry.id}`, { method: 'DELETE' })
      toast(`Deleted ${entry.drinkName}`)
      setConfirmDelete(null)
      setOpen(null)
      onChanged()
    })
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Entries</h2>
          <p className="mt-1 text-sm text-ink-2">{entries.length} received. Newest first.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="input min-h-10 w-56 py-1 text-sm" placeholder="Search drink, entrant, bar" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search entries" />
          <select className="input min-h-10 w-auto py-1 text-sm" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
            <option value="all">All regions</option>
            {settings.regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-ink-2">{entries.length === 0 ? 'No entries yet.' : 'Nothing matches that search.'}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => setOpen(e)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-raised sm:gap-4 sm:px-4">
                <img src={e.photoUrl} alt="" className="size-14 shrink-0 rounded-lg bg-raised object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight">{e.drinkName}</p>
                  <p className="truncate text-sm text-ink-2">{e.entrantName}, {e.bar}, {e.city}</p>
                </div>
                <div className="hidden shrink-0 text-right text-sm sm:block">
                  <p>{e.region}</p>
                  <p className="text-ink-2">{formatTime(e.submittedAt)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={Boolean(open)} onClose={() => { setOpen(null); setConfirmDelete(null) }} title={open?.drinkName} wide
        footer={open && (
          confirmDelete === open.id ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">Delete this entry and its photo? Judges' favorites and picks for it are removed too.</p>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>Keep it</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(open)}>Delete entry</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm text-cherry" onClick={() => setConfirmDelete(open.id)}>
                <Trash2 size={16} aria-hidden="true" /> Delete entry
              </button>
            </div>
          )
        )}
      >
        {open && (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <img src={open.photoUrl} alt={`Photo of ${open.drinkName}`} className="aspect-4/5 w-full rounded-lg bg-raised object-cover" />
            <div className="flex flex-col gap-5 text-[15px]">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-raised p-3">
                <dt className="text-ink-2">Entrant</dt><dd>{open.entrantName}</dd>
                <dt className="text-ink-2">Bar</dt><dd>{open.bar}</dd>
                <dt className="text-ink-2">City</dt><dd>{open.city}</dd>
                <dt className="text-ink-2">Email</dt><dd className="break-all"><a className="underline" href={`mailto:${open.email}`}>{open.email}</a></dd>
                <dt className="text-ink-2">Region</dt><dd>{open.region}</dd>
                <dt className="text-ink-2">Received</dt><dd>{formatTime(open.submittedAt)}</dd>
              </dl>
              <section>
                <h3 className="mb-2">Ingredients</h3>
                <ul className="flex flex-col divide-y divide-line">{open.ingredients.map((line, i) => <li key={i} className="py-1.5">{line}</li>)}</ul>
              </section>
              {open.method && <section><h3 className="mb-2">Method</h3><p className="whitespace-pre-line leading-relaxed">{open.method}</p></section>}
              {open.inspiration && <section><h3 className="mb-2">Inspiration</h3><p className="whitespace-pre-line leading-relaxed text-ink-2">{open.inspiration}</p></section>}
            </div>
          </div>
        )}
      </Sheet>
    </section>
  )
}
