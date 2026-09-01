import { ChevronUp, CheckCircle2, Lock } from 'lucide-react'

// The rail pinned to the bottom of the judge screen: one slot per allowed
// pick. Slots fill with photos as the judge chooses, so the limit is visible
// without reading a number. Tap anywhere on it to open the shortlist.
export default function ShortlistRail({ picks, limit, submitted, judgingOpen, onOpen }) {
  const showAllSlots = limit <= 8
  const slots = showAllSlots ? Array.from({ length: limit }, (_, i) => picks[i] || null) : picks.slice(0, 6)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-left"
        aria-label={`Open your shortlist, ${picks.length} of ${limit} chosen`}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {slots.map((pick, i) =>
            pick ? (
              <img
                key={pick.id}
                src={pick.photoUrl}
                alt=""
                className="slot-fill size-10 rounded-full object-cover ring-2 ring-amber"
              />
            ) : (
              <span key={`empty-${i}`} className="size-10 rounded-full border-2 border-dashed border-line" />
            ),
          )}
          {!showAllSlots && picks.length > 6 && (
            <span className="grid size-10 place-items-center rounded-full bg-raised text-xs font-bold">+{picks.length - 6}</span>
          )}
        </div>
        <div className="ml-auto min-w-0 text-right">
          {submitted ? (
            <span className="inline-flex items-center gap-1.5 font-bold"><CheckCircle2 size={18} className="text-amber" aria-hidden="true" /> Submitted</span>
          ) : !judgingOpen ? (
            <span className="inline-flex items-center gap-1.5 text-ink-2"><Lock size={16} aria-hidden="true" /> Judging closed</span>
          ) : (
            <>
              <span className="block font-bold leading-tight">Shortlist</span>
              <span className="block text-sm text-ink-2">{picks.length} of {limit}</span>
            </>
          )}
        </div>
        <ChevronUp size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
      </button>
    </div>
  )
}
