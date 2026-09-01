import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as store from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 3000
const ADMIN_CODE = process.env.ADMIN_CODE || 'ADMIN-2026'
const EMBED_ORIGINS = (process.env.EMBED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)

store.load()

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(express.json({ limit: '12mb' }))

// --- Helpers ---------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const bad = (message) => new HttpError(400, message)

function sessionFrom(req) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  return { token, session: store.findSession(token) }
}

function requireRole(role) {
  return (req, res, next) => {
    const { token, session } = sessionFrom(req)
    if (!session || session.role !== role) return next(new HttpError(401, 'Sign in to continue.'))
    req.token = token
    req.session = session
    next()
  }
}

function publicSettings() {
  const { competitionName, regions, entriesOpen, judgingOpen, shortlistLimit } = store.get().settings
  return { competitionName, regions, entriesOpen, judgingOpen, shortlistLimit }
}

function judgeSummary(judge) {
  const js = store.getJudgeState(judge.id)
  return {
    id: judge.id,
    name: judge.name,
    code: judge.code,
    favorites: js.favorites.length,
    shortlist: js.shortlist.length,
    submitted: js.submitted,
    submittedAt: js.submittedAt,
  }
}

function judgeBoard(judgeId) {
  const state = store.get()
  const judge = state.judges.find((j) => j.id === judgeId)
  return {
    judge: { id: judge.id, name: judge.name },
    settings: publicSettings(),
    entries: state.entries.map(store.judgeView),
    state: store.getJudgeState(judgeId),
  }
}

// Sign-in attempts are throttled per IP so the short codes can't be brute
// forced cheaply. In-memory is fine for a single Railway instance.
const attempts = new Map()
function throttleLogin(req, res, next) {
  const now = Date.now()
  const key = req.ip
  const rec = attempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 }
  if (now > rec.resetAt) Object.assign(rec, { count: 0, resetAt: now + 15 * 60 * 1000 })
  rec.count++
  attempts.set(key, rec)
  if (rec.count > 30) return next(new HttpError(429, 'Too many sign-in attempts. Try again in a few minutes.'))
  next()
}

const text = (value, max, label, { required = true } = {}) => {
  const v = typeof value === 'string' ? value.trim() : ''
  if (required && !v) throw bad(`${label} is required.`)
  if (v.length > max) throw bad(`${label} must be ${max} characters or fewer.`)
  return v
}

// --- Public: health, config, contestant entries ---------------------------

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/public/config', (req, res) => res.json(publicSettings()))

app.post('/api/entries', async (req, res, next) => {
  try {
    const settings = store.get().settings
    if (!settings.entriesOpen) throw new HttpError(423, 'Entries are closed.')
    const body = req.body || {}
    if (body.website) return res.status(200).json({ ok: true }) // honeypot: pretend success to bots

    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((s) => String(s || '').trim()).filter(Boolean)
      : []
    if (ingredients.length < 2) throw bad('List at least two ingredients.')
    if (ingredients.length > 15) throw bad('List no more than 15 ingredients.')
    if (ingredients.some((s) => s.length > 120)) throw bad('Keep each ingredient under 120 characters.')

    const region = text(body.region, 80, 'Region')
    if (!settings.regions.includes(region)) throw bad('Choose a region from the list.')

    const email = text(body.email, 120, 'Email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Enter a valid email address.')

    const entry = {
      drinkName: text(body.drinkName, 80, 'Drink name'),
      ingredients,
      method: text(body.method, 1500, 'Method'),
      inspiration: text(body.inspiration, 600, 'Inspiration', { required: false }),
      region,
      entrantName: text(body.entrantName, 80, 'Your name'),
      bar: text(body.bar, 120, 'Bar or venue'),
      city: text(body.city, 80, 'City'),
      email,
      photoUrl: await store.savePhotoFromDataUrl(body.photo),
    }
    const record = store.addEntry(entry)
    res.status(201).json({ id: record.id, drinkName: record.drinkName, submittedAt: record.submittedAt })
  } catch (err) {
    next(err)
  }
})

// --- Sessions -------------------------------------------------------------

app.post('/api/login', throttleLogin, (req, res, next) => {
  const code = String(req.body?.code || '').trim().toUpperCase()
  if (!code) return next(bad('Enter your code.'))
  if (code === ADMIN_CODE.toUpperCase()) {
    const token = store.createSession({ role: 'admin' })
    return res.json({ token, role: 'admin' })
  }
  const judge = store.get().judges.find((j) => j.code.toUpperCase() === code)
  if (!judge) return next(new HttpError(401, "That code didn't match. Check it and try again."))
  const token = store.createSession({ role: 'judge', judgeId: judge.id })
  res.json({ token, role: 'judge', judge: { id: judge.id, name: judge.name } })
})

app.post('/api/logout', (req, res) => {
  const { token } = sessionFrom(req)
  if (token) store.deleteSession(token)
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  const { session } = sessionFrom(req)
  if (!session) return res.status(401).json({ error: 'Not signed in.' })
  if (session.role === 'judge') {
    const judge = store.get().judges.find((j) => j.id === session.judgeId)
    return res.json({ role: 'judge', judge: { id: judge.id, name: judge.name } })
  }
  res.json({ role: 'admin' })
})

// --- Judge -----------------------------------------------------------------

app.get('/api/judge/board', requireRole('judge'), (req, res) => {
  res.json(judgeBoard(req.session.judgeId))
})

app.put('/api/judge/selections', requireRole('judge'), (req, res, next) => {
  const { settings } = store.get()
  const js = store.getJudgeState(req.session.judgeId)
  if (js.submitted) return next(new HttpError(409, 'Your shortlist is already submitted.'))
  if (!settings.judgingOpen) return next(new HttpError(423, 'Judging is closed.'))
  const { favorites, shortlist, overLimit } = store.normaliseSelections(req.body || {})
  if (overLimit) return next(bad(`You can shortlist up to ${settings.shortlistLimit} entries.`))
  js.favorites = favorites
  js.shortlist = shortlist
  store.scheduleSave()
  res.json(js)
})

app.post('/api/judge/submit', requireRole('judge'), (req, res, next) => {
  const { settings } = store.get()
  const js = store.getJudgeState(req.session.judgeId)
  if (js.submitted) return next(new HttpError(409, 'Your shortlist is already submitted.'))
  if (!settings.judgingOpen) return next(new HttpError(423, 'Judging is closed.'))
  const { shortlist, overLimit } = store.normaliseSelections(js)
  if (shortlist.length === 0) return next(bad('Add at least one entry to your shortlist before submitting.'))
  if (overLimit) return next(bad(`You can shortlist up to ${settings.shortlistLimit} entries.`))
  js.shortlist = shortlist
  js.submitted = true
  js.submittedAt = new Date().toISOString()
  store.scheduleSave()
  res.json(js)
})

// --- Admin -----------------------------------------------------------------

app.get('/api/admin/overview', requireRole('admin'), (req, res) => {
  const state = store.get()
  const includeUnsubmitted = req.query.includeUnsubmitted === '1'
  res.json({
    settings: state.settings,
    judges: state.judges.map(judgeSummary),
    entries: state.entries,
    leaderboard: store.leaderboard({ includeUnsubmitted }),
    regionCounts: store.regionCounts(),
    adminCodeIsDefault: ADMIN_CODE === 'ADMIN-2026',
  })
})

app.put('/api/admin/settings', requireRole('admin'), (req, res, next) => {
  try {
    const settings = store.get().settings
    const body = req.body || {}
    if (body.competitionName !== undefined) settings.competitionName = text(body.competitionName, 80, 'Competition name')
    if (body.judgingOpen !== undefined) settings.judgingOpen = Boolean(body.judgingOpen)
    if (body.entriesOpen !== undefined) settings.entriesOpen = Boolean(body.entriesOpen)
    if (body.shortlistLimit !== undefined) {
      const n = Number(body.shortlistLimit)
      if (!Number.isInteger(n) || n < 1 || n > 50) throw bad('Shortlist limit must be a whole number from 1 to 50.')
      settings.shortlistLimit = n
    }
    if (body.regions !== undefined) {
      if (!Array.isArray(body.regions)) throw bad('Regions must be a list.')
      const regions = [...new Set(body.regions.map((r) => String(r || '').trim()).filter(Boolean))]
      if (regions.length === 0) throw bad('Add at least one region.')
      if (regions.some((r) => r.length > 60)) throw bad('Keep region names under 60 characters.')
      settings.regions = regions
    }
    store.scheduleSave()
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

app.put('/api/admin/judges/:id', requireRole('admin'), (req, res, next) => {
  try {
    const state = store.get()
    const judge = state.judges.find((j) => j.id === req.params.id)
    if (!judge) throw new HttpError(404, 'Judge not found.')
    const body = req.body || {}
    if (body.name !== undefined) judge.name = text(body.name, 60, 'Judge name')
    if (body.code !== undefined) {
      const code = text(body.code, 40, 'Code').toUpperCase()
      if (code === ADMIN_CODE.toUpperCase()) throw bad("A judge code can't match the admin code.")
      if (state.judges.some((j) => j.id !== judge.id && j.code.toUpperCase() === code)) throw bad('Another judge already has that code.')
      judge.code = code
      // Changing a code signs that judge out everywhere.
      for (const [token, s] of Object.entries(state.sessions)) if (s.judgeId === judge.id) delete state.sessions[token]
    }
    store.scheduleSave()
    res.json(judgeSummary(judge))
  } catch (err) {
    next(err)
  }
})

app.post('/api/admin/judges/:id/reopen', requireRole('admin'), (req, res, next) => {
  const judge = store.get().judges.find((j) => j.id === req.params.id)
  if (!judge) return next(new HttpError(404, 'Judge not found.'))
  const js = store.getJudgeState(judge.id)
  js.submitted = false
  js.submittedAt = null
  store.scheduleSave()
  res.json(judgeSummary(judge))
})

app.post('/api/admin/judges/:id/clear', requireRole('admin'), (req, res, next) => {
  const judge = store.get().judges.find((j) => j.id === req.params.id)
  if (!judge) return next(new HttpError(404, 'Judge not found.'))
  store.get().judgeState[judge.id] = { favorites: [], shortlist: [], submitted: false, submittedAt: null }
  store.scheduleSave()
  res.json(judgeSummary(judge))
})

app.delete('/api/admin/entries/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await store.deleteEntry(req.params.id)
    if (!removed) throw new HttpError(404, 'Entry not found.')
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

app.post('/api/admin/demo', requireRole('admin'), async (req, res, next) => {
  try {
    const count = await store.loadDemo()
    res.json({ ok: true, count })
  } catch (err) {
    next(err)
  }
})

app.post('/api/admin/reset', requireRole('admin'), async (req, res, next) => {
  try {
    const mode = req.body?.mode
    if (mode === 'judging') {
      store.resetJudging({ keepEntries: true })
    } else if (mode === 'everything') {
      for (const e of [...store.get().entries]) await store.deleteEntry(e.id)
      store.resetJudging({ keepEntries: false })
    } else {
      throw bad('Unknown reset mode.')
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// Unknown API routes get JSON, not the HTML fallback.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

// --- Static files ------------------------------------------------------------

app.use('/uploads', express.static(store.UPLOADS_DIR, { maxAge: '7d', immutable: true, index: false }))

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next()
    // Only the embeddable form may be placed in an iframe on another site.
    const ancestors = req.path.startsWith('/embed')
      ? (EMBED_ORIGINS.length ? EMBED_ORIGINS.join(' ') : '*')
      : "'self'"
    res.set('Content-Security-Policy', `frame-ancestors ${ancestors}`)
    res.sendFile(path.join(DIST, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.type('text').send('Client not built yet. Run `npm run build`, or use `npm run dev` locally.'))
}

// --- Errors -----------------------------------------------------------------

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large. Photos must be under 8 MB.' })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body was not valid JSON.' })
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server.' : err.message })
})

const server = app.listen(PORT, () => {
  console.log(`Cocktail judging server on http://localhost:${PORT}`)
  console.log(`Data directory: ${store.DATA_DIR}`)
  if (ADMIN_CODE === 'ADMIN-2026') console.log('Admin code is the default (ADMIN-2026). Set ADMIN_CODE before going live.')
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close()
    await store.flush().catch(() => {})
    process.exit(0)
  })
}
