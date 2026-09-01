import { useEffect, useRef, useState } from 'react'
import { Plus, X, Camera } from 'lucide-react'
import { api } from '../lib/api.js'
import { resizeImage } from '../lib/resizeImage.js'
import Field from '../components/Field.jsx'
import Spinner from '../components/Spinner.jsx'

const EMPTY = {
  drinkName: '',
  ingredients: ['', '', ''],
  method: '',
  inspiration: '',
  region: '',
  entrantName: '',
  bar: '',
  city: '',
  email: '',
  website: '', // honeypot; real people never see or fill this
}

// The contestant entry form. Used standalone at /enter and inside an iframe
// at /embed. Validation mirrors the server so errors show up next to fields.
export default function EntryForm({ onHeightChange }) {
  const [config, setConfig] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null) // { dataUrl, name }
  const [photoBusy, setPhotoBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const topRef = useRef(null)

  useEffect(() => {
    api('/api/public/config').then(setConfig).catch((err) => setLoadError(err.message))
  }, [])

  useEffect(() => { onHeightChange?.() })

  // After a failed submit, move focus to the first field that needs attention.
  useEffect(() => {
    if (Object.keys(errors).some((k) => k !== 'submit' && errors[k])) {
      topRef.current?.querySelector('[aria-invalid="true"]')?.focus()
    }
  }, [errors])

  const clearError = (key) => setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er))
  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); clearError(key) }
  const setIngredient = (i, value) => { setForm((f) => ({ ...f, ingredients: f.ingredients.map((x, j) => (j === i ? value : x)) })); clearError('ingredients') }
  const addIngredient = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, ''] }))
  const removeIngredient = (i) => setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))

  async function choosePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    setErrors((er) => ({ ...er, photo: undefined }))
    try {
      const dataUrl = await resizeImage(file)
      setPhoto({ dataUrl, name: file.name })
    } catch {
      setErrors((er) => ({ ...er, photo: "Couldn't read that image. Try a JPEG or PNG." }))
    } finally {
      setPhotoBusy(false)
    }
  }

  function validate() {
    const er = {}
    if (!form.drinkName.trim()) er.drinkName = 'Give your cocktail a name.'
    const ingredients = form.ingredients.map((s) => s.trim()).filter(Boolean)
    if (ingredients.length < 2) er.ingredients = 'List at least two ingredients.'
    if (!form.method.trim()) er.method = 'Describe how the drink is made.'
    if (!form.region) er.region = 'Choose your region.'
    if (!photo) er.photo = 'Add a photo of the finished drink.'
    if (!form.entrantName.trim()) er.entrantName = 'Enter your name.'
    if (!form.bar.trim()) er.bar = 'Enter your bar or venue.'
    if (!form.city.trim()) er.city = 'Enter your city.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = 'Enter a valid email address.'
    return er
  }

  async function submit(e) {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    setSubmitting(true)
    try {
      const result = await api('/api/entries', {
        method: 'POST',
        body: { ...form, ingredients: form.ingredients.map((s) => s.trim()).filter(Boolean), photo: photo.dataUrl },
      })
      setDone(result)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) return <p className="text-cherry">{loadError}</p>
  if (!config) return <Spinner label="Loading form" />

  if (!config.entriesOpen) {
    return (
      <div className="flex flex-col gap-2">
        <h2>Entries are closed</h2>
        <p className="text-ink-2">Thanks for your interest in the {config.competitionName}. Entries aren't being accepted right now.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <h2>Your entry is in</h2>
        <p>
          <span className="font-display text-lg">{done.drinkName}</span> has been submitted to the {config.competitionName}.
          Judges will see your photo, drink name, ingredients, and region. Your name and bar stay hidden from them.
        </p>
        <p className="text-ink-2">We'll be in touch at {form.email.trim()} with results.</p>
        <button type="button" className="btn btn-secondary self-start" onClick={() => { setForm(EMPTY); setPhoto(null); setDone(null) }}>
          Enter another cocktail
        </button>
      </div>
    )
  }

  return (
    <form ref={topRef} onSubmit={submit} noValidate className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-display text-h3">Your cocktail</legend>

        <Field label="Drink name" error={errors.drinkName}>
          {({ id, describedBy, invalid }) => (
            <input id={id} className="input" value={form.drinkName} onChange={set('drinkName')} maxLength={80} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="off" />
          )}
        </Field>

        <Field label="Ingredients" help="One per line, with measures. Example: 1.5 oz mezcal" error={errors.ingredients}>
          {({ id, describedBy, invalid }) => (
            <div className="flex flex-col gap-2" role="group" aria-labelledby={id}>
              {form.ingredients.map((value, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    id={i === 0 ? id : undefined}
                    className="input"
                    value={value}
                    onChange={(e) => setIngredient(i, e.target.value)}
                    placeholder={i === 0 ? '1.5 oz mezcal' : i === 1 ? '0.75 oz lime juice' : ''}
                    maxLength={120}
                    aria-label={`Ingredient ${i + 1}`}
                    aria-describedby={i === 0 ? describedBy : undefined}
                    aria-invalid={i === 0 ? invalid : undefined}
                    autoComplete="off"
                  />
                  {form.ingredients.length > 2 && (
                    <button type="button" className="btn btn-ghost shrink-0 px-3" onClick={() => removeIngredient(i)} aria-label={`Remove ingredient ${i + 1}`}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              {form.ingredients.length < 15 && (
                <button type="button" className="btn btn-secondary btn-sm self-start" onClick={addIngredient}>
                  <Plus size={16} aria-hidden="true" /> Add ingredient
                </button>
              )}
            </div>
          )}
        </Field>

        <Field label="Method" help="How it's built, shaken or stirred, glass, and garnish." error={errors.method}>
          {({ id, describedBy, invalid }) => (
            <textarea id={id} className="input" rows={4} value={form.method} onChange={set('method')} maxLength={1500} aria-describedby={describedBy} aria-invalid={invalid} />
          )}
        </Field>

        <Field label="Inspiration" optional help="A sentence or two about the idea behind the drink. Judges read this, so leave out your name and bar.">
          {({ id, describedBy }) => (
            <textarea id={id} className="input" rows={3} value={form.inspiration} onChange={set('inspiration')} maxLength={600} aria-describedby={describedBy} />
          )}
        </Field>

        <Field label="Photo of the finished drink" help="Portrait orientation works best. It's resized before upload." error={errors.photo}>
          {({ id, describedBy, invalid }) => (
            <div className="flex items-start gap-4">
              {photo ? (
                <img src={photo.dataUrl} alt="Your drink" className="aspect-4/5 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid aspect-4/5 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-line text-ink-2" aria-hidden="true">
                  <Camera size={24} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className={`btn btn-secondary cursor-pointer ${photoBusy ? 'opacity-60' : ''}`}>
                  <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} aria-describedby={describedBy} aria-invalid={invalid} disabled={photoBusy} />
                  {photoBusy ? 'Preparing photo' : photo ? 'Choose a different photo' : 'Choose photo'}
                </label>
                {photo && <p className="text-sm text-ink-2 break-all">{photo.name}</p>}
              </div>
            </div>
          )}
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-h3">About you</legend>
        <p className="mb-2 text-sm text-ink-2">Judges see only the drink. Your name, bar, city, and email are kept for the organizers.</p>

        <Field label="Region" error={errors.region}>
          {({ id, describedBy, invalid }) => (
            <select id={id} className="input" value={form.region} onChange={set('region')} aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="">Choose a region</option>
              {config.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.entrantName}>
            {({ id, describedBy, invalid }) => <input id={id} className="input" value={form.entrantName} onChange={set('entrantName')} maxLength={80} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="Email" error={errors.email}>
            {({ id, describedBy, invalid }) => <input id={id} type="email" className="input" value={form.email} onChange={set('email')} maxLength={120} autoComplete="email" inputMode="email" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="Bar or venue" error={errors.bar}>
            {({ id, describedBy, invalid }) => <input id={id} className="input" value={form.bar} onChange={set('bar')} maxLength={120} autoComplete="organization" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="City" error={errors.city}>
            {({ id, describedBy, invalid }) => <input id={id} className="input" value={form.city} onChange={set('city')} maxLength={80} placeholder="Detroit, MI" autoComplete="address-level2" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </div>

        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        {errors.submit && <p className="text-sm font-bold text-cherry" role="alert">{errors.submit}</p>}
        <button type="submit" className="btn btn-primary sm:self-start sm:px-8" disabled={submitting || photoBusy}>
          {submitting ? 'Submitting entry' : 'Submit entry'}
        </button>
      </div>
    </form>
  )
}
