import { useEffect, useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'
import { formatTime, plural } from '../lib/format.js'

// Review picks, then submit with an explicit confirmation step. The
// confirmation happens inside the same sheet so nothing is lost on the way.
export default function ShortlistSheet({
  open, onClose, picks, limit, submitted, submittedAt, judgingOpen,
  onRemove, onSubmit, onBrowseFavorites,
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!open) { setConfirming(false); setError('') } }, [open])

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onSubmit()
      setConfirming(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const locked = submitted || !judgingOpen

  let footer = null
  if (submitted) {
    footer = (
      <p className="flex items-center gap-2 text-sm">
        <CheckCircle2 size={18} className="shrink-0 text-amber" aria-hidden="true" />
        Submitted {formatTime(submittedAt)}. Ask the competition admin if you need to change it.
      </p>
    )
  } else if (!judgingOpen) {
    footer = <p className="text-sm text-ink-2">Judging is closed. Your picks are saved but can't be submitted right now.</p>
  } else if (confirming) {
    footer = (
      <div className="flex flex-col gap-2">
        {error && <p className="text-sm font-bold text-cherry" role="alert">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>Go back</button>
          <button type="button" className="btn btn-primary" onClick={confirm} disabled={busy}>
            {busy ? 'Submitting' : 'Yes, submit'}
          </button>
        </div>
      </div>
    )
  } else {
    footer = (
      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setConfirming(true)} disabled={picks.length === 0}>
          Submit final shortlist
        </button>
        <p className="text-center text-sm text-ink-2">
          {picks.length === 0 ? `Choose up to ${limit} entries first.` : `${picks.length} of ${limit} slots used. You'll confirm before it's final.`}
        </p>
      </div>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title={confirming ? 'Submit your shortlist?' : 'Your shortlist'} footer={footer}>
      {confirming ? (
        <div className="flex flex-col gap-4">
          <p>
            You're sending {plural(picks.length, 'entry', 'entries')} through as your final shortlist.
            {picks.length < limit && ` You have room for ${limit - picks.length} more if you want to go back.`}
          </p>
          <p className="text-ink-2">After you submit, your favorites and shortlist are locked. The competition admin can reopen them if something needs to change.</p>
          <ol className="flex flex-col divide-y divide-line rounded-lg border border-line">
            {picks.map((pick) => (
              <li key={pick.id} className="flex items-center gap-3 px-3 py-2">
                <img src={pick.photoUrl} alt="" className="size-10 rounded-md object-cover" />
                <span className="font-display">{pick.drinkName}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : picks.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-4">
          <p className="text-ink-2">No picks yet. Your shortlist is chosen from your favorites.</p>
          {!locked && <button type="button" className="btn btn-secondary" onClick={onBrowseFavorites}>Go to favorites</button>}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {picks.map((pick) => (
            <li key={pick.id} className="flex items-center gap-3 py-3">
              <img src={pick.photoUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">{pick.drinkName}</p>
                <p className="text-sm text-ink-2">{pick.region}</p>
              </div>
              {!locked && (
                <button type="button" className="btn btn-ghost btn-sm text-ink-2" onClick={() => onRemove(pick.id)} aria-label={`Remove ${pick.drinkName} from shortlist`}>
                  <X size={18} aria-hidden="true" /> Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
