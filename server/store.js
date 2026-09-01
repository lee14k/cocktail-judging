import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { DEFAULT_REGIONS, SEED_ENTRIES, glassSvg, demoJudgeActivity } from './seed.js'

// A single JSON file plus an uploads folder. Deliberately simple for a
// prototype: no database to provision, and a Railway Volume mounted at
// DATA_DIR keeps everything across redeploys. Swap this module for Postgres
// when the competition outgrows it; the API surface in index.js won't change.

export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data')
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const DB_FILE = path.join(DATA_DIR, 'db.json')

export const JUDGE_COUNT = 12

function defaultJudges() {
  return Array.from({ length: JUDGE_COUNT }, (_, i) => ({
    id: `judge-${i + 1}`,
    name: `Judge ${i + 1}`,
    code: `JUDGE-${String(i + 1).padStart(2, '0')}`,
  }))
}

function emptyJudgeState() {
  return { favorites: [], shortlist: [], submitted: false, submittedAt: null }
}

function defaultDb() {
  const judges = defaultJudges()
  const judgeState = Object.fromEntries(judges.map((j) => [j.id, emptyJudgeState()]))
  return {
    settings: {
      competitionName: 'National Cocktail Competition',
      judgingOpen: true,
      entriesOpen: true,
      shortlistLimit: 5,
      regions: [...DEFAULT_REGIONS],
    },
    judges,
    judgeState,
    entries: [],
    sessions: {},
  }
}

let db = null
let saveTimer = null
let saving = Promise.resolve()

export function load() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      db = { ...defaultDb(), ...raw, settings: { ...defaultDb().settings, ...(raw.settings || {}) } }
      // Make sure every judge has a state record even if the file predates one.
      for (const j of db.judges) if (!db.judgeState[j.id]) db.judgeState[j.id] = emptyJudgeState()
    } catch (err) {
      console.error(`Could not read ${DB_FILE}; starting with an empty database.`, err)
      db = defaultDb()
    }
  } else {
    db = defaultDb()
    scheduleSave()
  }
  return db
}

export function get() {
  if (!db) load()
  return db
}

// Writes are debounced and atomic (write to a temp file, then rename) so a
// crash mid-write can't leave a half-written db.json behind.
export function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saving = saving.then(async () => {
      const tmp = `${DB_FILE}.${process.pid}.tmp`
      await fsp.writeFile(tmp, JSON.stringify(db, null, 2))
      await fsp.rename(tmp, DB_FILE)
    }).catch((err) => console.error('Failed to save database', err))
  }, 150)
}

export async function flush() {
  clearTimeout(saveTimer)
  saveTimer = null
  const tmp = `${DB_FILE}.${process.pid}.tmp`
  await saving
  await fsp.writeFile(tmp, JSON.stringify(db, null, 2))
  await fsp.rename(tmp, DB_FILE)
}

export function id(prefix = '') {
  return prefix + crypto.randomBytes(8).toString('hex')
}

// --- Sessions -------------------------------------------------------------

export function createSession(payload) {
  const token = crypto.randomBytes(24).toString('base64url')
  get().sessions[token] = { ...payload, createdAt: new Date().toISOString() }
  scheduleSave()
  return token
}

export function findSession(token) {
  if (!token) return null
  const session = get().sessions[token]
  if (!session) return null
  if (session.role === 'judge' && !get().judges.some((j) => j.id === session.judgeId)) return null
  return session
}

export function deleteSession(token) {
  delete get().sessions[token]
  scheduleSave()
}

// --- Photos ---------------------------------------------------------------

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export async function savePhotoFromDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(dataUrl || '')
  if (!match) throw Object.assign(new Error('Photo must be a JPEG, PNG, or WebP image.'), { status: 400 })
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > MAX_PHOTO_BYTES) {
    throw Object.assign(new Error('Photo is larger than 8 MB. Choose a smaller image.'), { status: 413 })
  }
  const filename = `${id('photo-')}.${MIME_EXT[match[1]]}`
  await fsp.writeFile(path.join(UPLOADS_DIR, filename), buffer)
  return `/uploads/${filename}`
}

async function removePhoto(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith('/uploads/')) return
  const file = path.join(UPLOADS_DIR, path.basename(photoUrl))
  await fsp.rm(file, { force: true })
}

// --- Entries --------------------------------------------------------------

// What judges are allowed to see. Entrant identity never leaves the server
// through the judge API, so it can't leak through devtools or a screenshot.
export function judgeView(entry) {
  const { id, drinkName, ingredients, method, inspiration, region, photoUrl, submittedAt } = entry
  return { id, drinkName, ingredients, method, inspiration, region, photoUrl, submittedAt }
}

export function addEntry(entry) {
  const record = { id: id('entry-'), submittedAt: new Date().toISOString(), ...entry }
  get().entries.push(record)
  scheduleSave()
  return record
}

export async function deleteEntry(entryId) {
  const state = get()
  const entry = state.entries.find((e) => e.id === entryId)
  if (!entry) return false
  state.entries = state.entries.filter((e) => e.id !== entryId)
  for (const js of Object.values(state.judgeState)) {
    js.favorites = js.favorites.filter((x) => x !== entryId)
    js.shortlist = js.shortlist.filter((x) => x !== entryId)
  }
  await removePhoto(entry.photoUrl)
  scheduleSave()
  return true
}

// --- Judge state ----------------------------------------------------------

export function getJudgeState(judgeId) {
  const state = get()
  if (!state.judgeState[judgeId]) state.judgeState[judgeId] = emptyJudgeState()
  return state.judgeState[judgeId]
}

// Normalises a proposed favorites/shortlist pair against the rules:
// only real entries, shortlist drawn from favorites, shortlist within limit.
export function normaliseSelections({ favorites, shortlist }) {
  const state = get()
  const known = new Set(state.entries.map((e) => e.id))
  const fav = [...new Set((favorites || []).filter((x) => known.has(x)))]
  const favSet = new Set(fav)
  const short = [...new Set((shortlist || []).filter((x) => favSet.has(x)))]
  return { favorites: fav, shortlist: short, overLimit: short.length > state.settings.shortlistLimit }
}

export function resetJudging({ keepEntries = true } = {}) {
  const state = get()
  for (const j of state.judges) state.judgeState[j.id] = emptyJudgeState()
  if (!keepEntries) state.entries = []
  scheduleSave()
}

// --- Aggregation ----------------------------------------------------------

export function leaderboard({ includeUnsubmitted = false } = {}) {
  const state = get()
  const tally = new Map(state.entries.map((e) => [e.id, { shortlist: 0, favorites: 0, judges: [] }]))
  for (const judge of state.judges) {
    const js = state.judgeState[judge.id]
    if (!js) continue
    for (const entryId of js.favorites) tally.get(entryId) && tally.get(entryId).favorites++
    if (js.submitted || includeUnsubmitted) {
      for (const entryId of js.shortlist) {
        const t = tally.get(entryId)
        if (!t) continue
        t.shortlist++
        t.judges.push(judge.name)
      }
    }
  }
  return state.entries
    .map((entry) => ({ ...entry, ...tally.get(entry.id) }))
    .sort((a, b) => b.shortlist - a.shortlist || b.favorites - a.favorites || a.drinkName.localeCompare(b.drinkName))
}

export function regionCounts() {
  const state = get()
  const counts = Object.fromEntries(state.settings.regions.map((r) => [r, 0]))
  for (const e of state.entries) counts[e.region] = (counts[e.region] || 0) + 1
  return Object.entries(counts).map(([region, count]) => ({ region, count }))
}

// --- Demo data ------------------------------------------------------------

export async function loadDemo() {
  const state = get()
  // Remove any previous demo entries so the button is safe to press twice.
  const previous = state.entries.filter((e) => e.demo)
  for (const e of previous) await deleteEntry(e.id)

  const created = []
  for (const seed of SEED_ENTRIES) {
    const { art, key, ...fields } = seed
    const filename = `demo-${key}.svg`
    await fsp.writeFile(path.join(UPLOADS_DIR, filename), glassSvg(art))
    created.push(addEntry({ ...fields, photoUrl: `/uploads/${filename}`, demo: true }))
  }
  const activity = demoJudgeActivity(created.map((e) => e.id), state.judges, state.settings.shortlistLimit)
  for (const [judgeId, js] of Object.entries(activity)) state.judgeState[judgeId] = js
  scheduleSave()
  return created.length
}
