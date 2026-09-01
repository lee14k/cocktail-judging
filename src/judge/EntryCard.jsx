import { Heart, Plus, Check } from 'lucide-react'
import { ingredientNames } from '../lib/format.js'

// One entry in the browse grid. The photo is the hero; the heart sits on it
// so the text block below can breathe. In the Favorites view the card also
// carries the shortlist toggle, since that's where the shortlist is picked.
export default function EntryCard({
  entry, favorite, shortlisted, showShortlistAction, shortlistFull, locked,
  onOpen, onToggleFavorite, onToggleShortlist,
}) {
  const flavors = ingredientNames(entry.ingredients).join(', ')
  return (
    <article className="overflow-hidden rounded-xl bg-surface">
      <div className="relative">
        <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Open ${entry.drinkName}`}>
          <img
            src={entry.photoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-4/5 w-full bg-raised object-cover"
          />
        </button>
        {shortlisted && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-amber-ink">
            <Check size={13} strokeWidth={3} aria-hidden="true" /> Shortlisted
          </span>
        )}
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={locked}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${entry.drinkName} from favorites` : `Add ${entry.drinkName} to favorites`}
          className={`absolute bottom-3 right-3 grid size-11 place-items-center rounded-full backdrop-blur transition-colors disabled:opacity-60 ${
            favorite ? 'bg-amber text-amber-ink' : 'bg-black/45 text-white hover:bg-black/60'
          }`}
        >
          <Heart size={22} className={favorite ? 'fill-current' : ''} aria-hidden="true" />
        </button>
      </div>
      <div className="px-4 pb-4 pt-3">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <h3 className="line-clamp-2">{entry.drinkName}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-2">{flavors}</p>
          <p className="mt-2 text-sm">{entry.region}</p>
        </button>
        {showShortlistAction && (
          <button
            type="button"
            onClick={onToggleShortlist}
            disabled={locked || (!shortlisted && shortlistFull)}
            aria-pressed={shortlisted}
            className={`btn btn-sm mt-3 w-full ${shortlisted ? 'btn-secondary' : 'btn-primary'}`}
          >
            {shortlisted ? <><Check size={16} aria-hidden="true" /> In your shortlist</> : <><Plus size={16} aria-hidden="true" /> Add to shortlist</>}
          </button>
        )}
      </div>
    </article>
  )
}
