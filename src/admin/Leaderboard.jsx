import { useMemo, useState } from 'react'
import { plural } from '../lib/format.js'

// Aggregate results across judges, plus entries by region.
export default function Leaderboard({ data, includeUnsubmitted, onIncludeUnsubmitted, onGoToSettings }) {
  const { leaderboard, judges, settings, regionCounts, entries } = data
  const [region, setRegion] = useState('all')
  const submitted = judges.filter((j) => j.submitted).length
  const rows = useMemo(() => (region === 'all' ? leaderboard : leaderboard.filter((e) => e.region === region)), [leaderboard, region])
  const maxRegion = Math.max(1, ...regionCounts.map((r) => r.count))
  const countingJudges = includeUnsubmitted ? judges.filter((j) => j.shortlist > 0).length : submitted

  if (entries.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16">
        <h2>No entries yet</h2>
        <p className="text-ink-2">The leaderboard fills in as contestants enter and judges submit their shortlists. To try it out first, load the demo entries from Settings.</p>
        <button type="button" className="btn btn-secondary" onClick={onGoToSettings}>Go to settings</button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2>Leaderboard</h2>
            <p className="mt-1 text-sm text-ink-2">
              Ranked by how many judges put the entry on their final shortlist. Counting {plural(countingJudges, 'judge')}
              {includeUnsubmitted ? ' with picks so far' : ` who have submitted (${submitted} of ${judges.length})`}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-amber" checked={includeUnsubmitted} onChange={(e) => onIncludeUnsubmitted(e.target.checked)} />
              Include unsubmitted picks
            </label>
            <select className="input min-h-10 w-auto py-1 text-sm" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
              <option value="all">All regions</option>
              {settings.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map((entry, i) => (
            <li key={entry.id} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
              <span className="w-7 shrink-0 text-right font-display text-lg text-ink-2" aria-label={`Rank ${i + 1}`}>{i + 1}</span>
              <img src={entry.photoUrl} alt="" className="size-14 shrink-0 rounded-lg bg-raised object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight">{entry.drinkName}</p>
                <p className="truncate text-sm text-ink-2">{entry.entrantName}, {entry.bar}, {entry.city}</p>
                <p className="text-sm">{entry.region}</p>
                {entry.judges.length > 0 && (
                  <p className="mt-1 truncate text-xs text-ink-2" title={entry.judges.join(', ')}>Shortlisted by {entry.judges.join(', ')}</p>
                )}
              </div>
              <div className="flex shrink-0 items-baseline gap-4 text-right">
                <div>
                  <span className="block font-display text-3xl leading-none text-amber">{entry.shortlist}</span>
                  <span className="block text-xs text-ink-2">{entry.shortlist === 1 ? 'shortlist' : 'shortlists'}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="block font-display text-xl leading-none">{entry.favorites}</span>
                  <span className="block text-xs text-ink-2">{entry.favorites === 1 ? 'favorite' : 'favorites'}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
        {rows.length === 0 && <p className="py-8 text-center text-ink-2">No entries from {region}.</p>}
      </section>

      <aside className="flex flex-col gap-6">
        <section className="panel p-4">
          <h3 className="mb-3">Entries by region</h3>
          <ul className="flex flex-col gap-2.5">
            {regionCounts.map((r) => (
              <li key={r.region}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.region}</span>
                  <span className="text-ink-2">{r.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ground">
                  <div className="h-full rounded-full bg-amber" style={{ width: `${(r.count / maxRegion) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-2">{plural(entries.length, 'entry', 'entries')} total</p>
        </section>

        <section className="panel p-4">
          <h3 className="mb-3">Judges</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {judges.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{j.name}</span>
                <span className={j.submitted ? 'font-bold text-amber' : 'text-ink-2'}>
                  {j.submitted ? 'Submitted' : j.favorites > 0 ? `${j.shortlist} of ${settings.shortlistLimit} picked` : 'Not started'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
