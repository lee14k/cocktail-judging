import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Mark from './components/Mark.jsx'
import { api } from './lib/api.js'

// Landing page: three doors. In production the competition website links
// straight to /judge, /admin, and embeds /embed, so this stays plain.
export default function Home() {
  const [config, setConfig] = useState(null)
  useEffect(() => { api('/api/public/config').then(setConfig).catch(() => {}) }, [])

  const doors = [
    { to: '/judge', title: 'Judge', text: 'Browse entries, save favorites, submit your shortlist.' },
    { to: '/enter', title: 'Enter a cocktail', text: 'Submit your drink to the competition.' },
    { to: '/admin', title: 'Admin', text: 'Leaderboard, judging controls, and entries by region.' },
  ]

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-10">
      <div className="mb-auto flex items-center gap-3">
        <Mark size={34} />
        <span className="text-lg">{config?.competitionName || 'Cocktail Competition'}</span>
      </div>
      <h1 className="mt-16 mb-10 max-w-md text-[2.6rem] leading-[1.05]">Virtual judging for a national cocktail competition.</h1>
      <ul className="mb-auto flex flex-col divide-y divide-line border-y border-line">
        {doors.map((door) => (
          <li key={door.to}>
            <Link to={door.to} className="group flex items-baseline justify-between gap-6 py-5 hover:bg-surface -mx-3 px-3 rounded-lg">
              <span>
                <span className="block font-display text-h3">{door.title}</span>
                <span className="block text-ink-2">{door.text}</span>
              </span>
              <span className="shrink-0 text-amber opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">Open</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-ink-2">
        Prototype. {config && (config.judgingOpen ? 'Judging is open.' : 'Judging is closed.')}
      </p>
    </main>
  )
}
