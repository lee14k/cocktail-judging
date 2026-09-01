import { useState } from 'react'
import { Eye, EyeOff, Pencil } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/format.js'
import { useGuard, useToast } from '../components/Toast.jsx'
import Sheet from '../components/Sheet.jsx'
import Field from '../components/Field.jsx'

// Who the judges are, how far along they are, and their sign-in codes.
export default function Judges({ data, onChanged }) {
  const { judges, settings } = data
  const [showCodes, setShowCodes] = useState(false)
  const [editing, setEditing] = useState(null)
  const guard = useGuard()
  const toast = useToast()
  const judgeUrl = `${window.location.origin}/judge`

  async function reopen(j) {
    await guard(async () => {
      await api(`/api/admin/judges/${j.id}/reopen`, { method: 'POST' })
      toast(`${j.name} can edit their shortlist again`)
      onChanged()
    })
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Judges</h2>
          <p className="mt-1 text-sm text-ink-2">
            Each judge signs in at <span className="select-all">{judgeUrl}</span> with their own code.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCodes((s) => !s)} aria-pressed={showCodes}>
          {showCodes ? <><EyeOff size={16} aria-hidden="true" /> Hide codes</> : <><Eye size={16} aria-hidden="true" /> Show codes</>}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-2">
              <th className="px-4 py-2.5 font-bold">Judge</th>
              <th className="px-4 py-2.5 font-bold">Code</th>
              <th className="px-4 py-2.5 font-bold">Favorites</th>
              <th className="px-4 py-2.5 font-bold">Shortlist</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {judges.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-2.5 font-bold">{j.name}</td>
                <td className="px-4 py-2.5 tracking-wide">{showCodes ? <span className="select-all">{j.code}</span> : <span aria-label="hidden">••••••</span>}</td>
                <td className="px-4 py-2.5">{j.favorites}</td>
                <td className="px-4 py-2.5">{j.shortlist} of {settings.shortlistLimit}</td>
                <td className="px-4 py-2.5">
                  {j.submitted ? (
                    <span className="font-bold text-amber">Submitted {formatTime(j.submittedAt)}</span>
                  ) : j.favorites > 0 ? (
                    <span>In progress</span>
                  ) : (
                    <span className="text-ink-2">Not started</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    {j.submitted && <button type="button" className="btn btn-ghost btn-sm" onClick={() => reopen(j)}>Reopen</button>}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(j)} aria-label={`Edit ${j.name}`}><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditJudge judge={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged() }} />
    </section>
  )
}

function EditJudge({ judge, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const toast = useToast()

  // Reset the form each time a different judge is opened.
  const [seenId, setSeenId] = useState(null)
  if (judge && judge.id !== seenId) {
    setSeenId(judge.id)
    setName(judge.name)
    setCode(judge.code)
    setError('')
    setConfirmClear(false)
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      const body = { name }
      if (code !== judge.code) body.code = code
      await api(`/api/admin/judges/${judge.id}`, { method: 'PUT', body })
      toast('Judge updated')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function clearPicks() {
    setBusy(true)
    try {
      await api(`/api/admin/judges/${judge.id}/clear`, { method: 'POST' })
      toast(`Cleared ${judge.name}'s picks`)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={Boolean(judge)} onClose={onClose} title={judge ? `Edit ${judge.name}` : ''}
      footer={judge && (
        <div className="flex justify-between gap-2">
          {confirmClear ? (
            <div className="flex items-center gap-2 text-sm">
              <span>Remove all their favorites and picks?</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={clearPicks} disabled={busy}>Clear picks</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(false)}>Keep</button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm text-cherry" onClick={() => setConfirmClear(true)} disabled={busy}>Clear picks</button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>Save changes</button>
        </div>
      )}
    >
      {judge && (
        <div className="flex flex-col gap-4">
          <Field label="Name" help="Judges see their own name; it also appears on the leaderboard.">
            {({ id, describedBy }) => <input id={id} className="input" value={name} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} />}
          </Field>
          <Field label="Sign-in code" help="Changing the code signs this judge out everywhere. Codes aren't case-sensitive." error={error}>
            {({ id, describedBy, invalid }) => (
              <input id={id} className="input tracking-wide" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-describedby={describedBy} aria-invalid={invalid} />
            )}
          </Field>
        </div>
      )}
    </Sheet>
  )
}
