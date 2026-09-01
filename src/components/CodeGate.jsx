import { useState } from 'react'
import { Link } from 'react-router'
import Mark from './Mark.jsx'
import Field from './Field.jsx'

// Shared sign-in screen. Judges and the admin both sign in with a code.
export default function CodeGate({ title, description, placeholder, onLogin, competitionName }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!code.trim()) return setError('Enter your code to continue.')
    setBusy(true)
    setError('')
    try {
      await onLogin(code.trim())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start text-sm text-ink-2 hover:text-ink">
        <Mark size={22} />
        <span>{competitionName || 'Cocktail Competition'}</span>
      </Link>
      <h1 className="mb-2">{title}</h1>
      <p className="mb-8 text-ink-2">{description}</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Your code" error={error}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className="input text-lg tracking-wide"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={placeholder}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoFocus
            />
          )}
        </Field>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Checking' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
