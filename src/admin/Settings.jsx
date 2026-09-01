import { useEffect, useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { api } from '../lib/api.js'
import { useGuard, useToast } from '../components/Toast.jsx'
import Field from '../components/Field.jsx'

export default function Settings({ data, onChanged }) {
  const { settings, judges, entries, adminCodeIsDefault } = data
  const guard = useGuard()
  const toast = useToast()

  async function update(patch, message) {
    return guard(async () => {
      await api('/api/admin/settings', { method: 'PUT', body: patch })
      if (message) toast(message)
      onChanged()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel flex flex-col gap-5 p-5">
        <h2>Judging</h2>
        <Toggle
          checked={settings.judgingOpen}
          onChange={(v) => update({ judgingOpen: v }, v ? 'Judging opened' : 'Judging closed')}
          label={settings.judgingOpen ? 'Judging is open' : 'Judging is closed'}
          description={settings.judgingOpen
            ? 'Judges can save favorites, build their shortlist, and submit.'
            : 'Judges can still browse, but nothing can be changed or submitted until you reopen.'}
        />
        <Toggle
          checked={settings.entriesOpen}
          onChange={(v) => update({ entriesOpen: v }, v ? 'Entry form opened' : 'Entry form closed')}
          label={settings.entriesOpen ? 'Entry form is open' : 'Entry form is closed'}
          description={settings.entriesOpen ? 'Contestants can submit new entries.' : 'The entry form shows a closed message instead of the form.'}
        />
        <ShortlistLimit settings={settings} judges={judges} onSave={(n) => update({ shortlistLimit: n }, `Shortlist limit set to ${n}`)} />
      </section>

      <section className="panel flex flex-col gap-5 p-5">
        <h2>Competition</h2>
        <TextSetting
          label="Competition name"
          value={settings.competitionName}
          onSave={(v) => update({ competitionName: v }, 'Name updated')}
        />
        <RegionsSetting regions={settings.regions} entries={entries} onSave={(regions) => update({ regions }, 'Regions updated')} />
      </section>

      <EmbedSection />

      <section className="panel flex flex-col gap-4 p-5">
        <h2>Demo and resets</h2>
        {adminCodeIsDefault && (
          <p className="rounded-lg border border-cherry/60 px-3 py-2 text-sm">
            The admin code is still the default. Set the <span className="font-bold">ADMIN_CODE</span> environment variable on Railway before sharing this link.
          </p>
        )}
        <DangerAction
          label="Load demo entries"
          description="Adds 18 fictional entries with illustrations, plus favorites and shortlists for eight judges (five submitted). Safe to run again; it replaces the previous demo set."
          buttonLabel="Load demo"
          tone="secondary"
          onConfirm={() => guard(async () => { const r = await api('/api/admin/demo', { method: 'POST' }); toast(`Loaded ${r.count} demo entries`); onChanged() })}
        />
        <DangerAction
          label="Reset judging"
          description="Clears every judge's favorites, shortlist, and submission. Entries are kept."
          buttonLabel="Reset judging"
          onConfirm={() => guard(async () => { await api('/api/admin/reset', { method: 'POST', body: { mode: 'judging' } }); toast('Judging reset'); onChanged() })}
        />
        <DangerAction
          label="Delete everything"
          description="Removes all entries and photos and resets judging. There is no undo."
          buttonLabel="Delete all"
          onConfirm={() => guard(async () => { await api('/api/admin/reset', { method: 'POST', body: { mode: 'everything' } }); toast('All entries deleted'); onChanged() })}
        />
      </section>
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-sm text-ink-2">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-amber' : 'bg-line'}`}
      >
        <span className={`absolute top-1 size-6 rounded-full bg-ink shadow transition-[left] ${checked ? 'left-7' : 'left-1'}`} aria-hidden="true" />
      </button>
    </div>
  )
}

function ShortlistLimit({ settings, judges, onSave }) {
  const [value, setValue] = useState(String(settings.shortlistLimit))
  useEffect(() => setValue(String(settings.shortlistLimit)), [settings.shortlistLimit])
  const n = Number(value)
  const dirty = n !== settings.shortlistLimit
  const over = judges.filter((j) => j.shortlist > n).length
  return (
    <Field label="Shortlist limit" help="How many entries each judge can put on their final shortlist.">
      {({ id, describedBy }) => (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input id={id} type="number" min="1" max="50" inputMode="numeric" className="input w-24" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby={describedBy} />
            <button type="button" className="btn btn-secondary" disabled={!dirty || !Number.isInteger(n) || n < 1 || n > 50} onClick={() => onSave(n)}>Save</button>
          </div>
          {dirty && over > 0 && (
            <p className="text-sm text-cherry">{over} {over === 1 ? 'judge has' : 'judges have'} more than {n} picks already. They'll need to remove some before submitting.</p>
          )}
        </div>
      )}
    </Field>
  )
}

function TextSetting({ label, value, onSave }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const dirty = draft.trim() !== value && draft.trim().length > 0
  return (
    <Field label={label}>
      {({ id }) => (
        <div className="flex gap-2">
          <input id={id} className="input" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="button" className="btn btn-secondary" disabled={!dirty} onClick={() => onSave(draft.trim())}>Save</button>
        </div>
      )}
    </Field>
  )
}

function RegionsSetting({ regions, entries, onSave }) {
  const [draft, setDraft] = useState(regions.join('\n'))
  useEffect(() => setDraft(regions.join('\n')), [regions])
  const next = [...new Set(draft.split('\n').map((s) => s.trim()).filter(Boolean))]
  const dirty = next.join('|') !== regions.join('|')
  const orphaned = entries.filter((e) => !next.includes(e.region)).length
  return (
    <Field label="Regions" help="One per line, in the order they appear in filters and the entry form.">
      {({ id, describedBy }) => (
        <div className="flex flex-col gap-2">
          <textarea id={id} className="input" rows={Math.max(4, Math.min(10, next.length + 1))} value={draft} onChange={(e) => setDraft(e.target.value)} aria-describedby={describedBy} />
          {dirty && orphaned > 0 && (
            <p className="text-sm text-cherry">{orphaned} existing {orphaned === 1 ? 'entry uses' : 'entries use'} a region not in this list. They'll still show, but won't match any filter.</p>
          )}
          <div className="flex justify-end">
            <button type="button" className="btn btn-secondary" disabled={!dirty || next.length === 0} onClick={() => onSave(next)}>Save regions</button>
          </div>
        </div>
      )}
    </Field>
  )
}

function EmbedSection() {
  const toast = useToast()
  const origin = window.location.origin
  const snippet = `<iframe src="${origin}/embed" title="Cocktail competition entry form" style="width:100%;min-height:900px;border:0" loading="lazy"></iframe>
<script>
  // Optional: let the form set its own height so there's no inner scrollbar.
  addEventListener('message', function (e) {
    if (e.origin !== '${origin}' || !e.data || e.data.type !== 'entry-form-height') return;
    var f = document.querySelector('iframe[src^="${origin}/embed"]');
    if (f) f.style.height = e.data.height + 'px';
  });
</script>`

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      toast('Embed code copied')
    } catch {
      toast('Select the code and copy it manually', { tone: 'error' })
    }
  }

  return (
    <section className="panel flex flex-col gap-4 p-5 lg:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Entry form on your website</h2>
          <p className="mt-1 text-sm text-ink-2">
            Paste this where the form should appear. It uses a light theme so it sits naturally on most sites.
            The standalone version is at <a className="underline" href="/enter" target="_blank" rel="noreferrer">{origin}/enter</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <a className="btn btn-secondary btn-sm" href="/embed" target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Preview</a>
          <button type="button" className="btn btn-primary btn-sm" onClick={copy}><Copy size={16} aria-hidden="true" /> Copy embed code</button>
        </div>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-ground p-4 text-xs leading-relaxed"><code>{snippet}</code></pre>
      <p className="text-sm text-ink-2">
        To limit which sites can embed the form, set the <span className="font-bold">EMBED_ORIGINS</span> environment variable to a comma-separated list of origins.
      </p>
    </section>
  )
}

function DangerAction({ label, description, buttonLabel, onConfirm, tone = 'danger' }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false); setConfirming(false) }
  }
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{label}</p>
        <p className="text-sm text-ink-2">{description}</p>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          <button type="button" className={`btn btn-sm ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={run} disabled={busy}>{busy ? 'Working' : `Yes, ${buttonLabel.toLowerCase()}`}</button>
        </div>
      ) : (
        <button type="button" className={`btn btn-sm ${tone === 'danger' ? 'btn-secondary text-cherry' : 'btn-secondary'}`} onClick={() => setConfirming(true)}>{buttonLabel}</button>
      )}
    </div>
  )
}
