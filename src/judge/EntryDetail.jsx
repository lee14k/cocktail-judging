import { Heart, Plus, Check, Minus } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'

// Full view of one entry with the spec, method, and the two actions.
export default function EntryDetail({
  entry, favorite, shortlisted, shortlistFull, limit, locked,
  onClose, onToggleFavorite, onToggleShortlist,
}) {
  const open = Boolean(entry)
  const canShortlist = !locked && (shortlisted || !shortlistFull)

  let shortlistLabel
  if (shortlisted) shortlistLabel = <><Minus size={18} aria-hidden="true" /> Remove from shortlist</>
  else if (shortlistFull) shortlistLabel = <><Check size={18} aria-hidden="true" /> Shortlist is full</>
  else shortlistLabel = <><Plus size={18} aria-hidden="true" /> Add to shortlist</>

  return (
    <Sheet open={open} onClose={onClose} title={entry?.drinkName} wide
      footer={entry && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`btn ${favorite ? 'btn-secondary' : 'btn-primary'}`}
              onClick={onToggleFavorite}
              disabled={locked}
              aria-pressed={favorite}
            >
              <Heart size={18} className={favorite ? 'fill-current' : ''} aria-hidden="true" />
              {favorite ? 'Favorited' : 'Favorite'}
            </button>
            <button
              type="button"
              className={`btn ${shortlisted ? 'btn-secondary' : 'btn-primary'}`}
              onClick={onToggleShortlist}
              disabled={!canShortlist}
              aria-pressed={shortlisted}
            >
              {shortlistLabel}
            </button>
          </div>
          {locked ? (
            <p className="text-center text-sm text-ink-2">Selections are locked.</p>
          ) : shortlistFull && !shortlisted ? (
            <p className="text-center text-sm text-ink-2">All {limit} shortlist slots are used. Remove one to add this.</p>
          ) : null}
        </div>
      )}
    >
      {entry && (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <img src={entry.photoUrl} alt={`Photo of ${entry.drinkName}`} className="aspect-4/5 w-full rounded-lg bg-raised object-cover" />
          <div className="flex flex-col gap-5">
            <p className="text-ink-2">{entry.region}</p>
            <section>
              <h3 className="mb-2">Ingredients</h3>
              <ul className="flex flex-col divide-y divide-line">
                {entry.ingredients.map((line, i) => (
                  <li key={i} className="py-1.5 leading-snug">{line}</li>
                ))}
              </ul>
            </section>
            {entry.method && (
              <section>
                <h3 className="mb-2">Method</h3>
                <p className="whitespace-pre-line leading-relaxed">{entry.method}</p>
              </section>
            )}
            {entry.inspiration && (
              <section>
                <h3 className="mb-2">Inspiration</h3>
                <p className="whitespace-pre-line leading-relaxed text-ink-2">{entry.inspiration}</p>
              </section>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
