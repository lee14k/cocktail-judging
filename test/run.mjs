import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const PORT = 3998
fs.rmSync('/tmp/cj-ui', { recursive: true, force: true })
const server = spawn('node', ['server/index.js'], { env: { ...process.env, DATA_DIR: '/tmp/cj-ui', PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] })
let serverLog = ''
server.stdout.on('data', (d) => (serverLog += d))
server.stderr.on('data', (d) => (serverLog += d))
await new Promise((r) => setTimeout(r, 1200))

// --- jsdom globals ----------------------------------------------------------
const dom = new JSDOM('<!doctype html><html><head><meta name="theme-color" content="#0F2E26"></head><body></body></html>', {
  url: `http://localhost:${PORT}/`,
  pretendToBeVisual: true,
})
const win = dom.window
for (const key of Object.getOwnPropertyNames(win)) {
  if (key in globalThis) continue
  try { globalThis[key] = win[key] } catch {}
}
Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
Object.defineProperty(globalThis, 'document', { value: win.document, configurable: true })
Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true })
Object.defineProperty(globalThis, 'localStorage', { value: win.localStorage, configurable: true })
globalThis.ResizeObserver = class { observe() {} disconnect() {} }
win.scrollTo = () => {}
const realFetch = globalThis.fetch
globalThis.fetch = (url, opts) => realFetch(typeof url === 'string' && url.startsWith('/') ? `http://localhost:${PORT}${url}` : url, opts)
win.fetch = globalThis.fetch

const consoleErrors = []
const origError = console.error
console.error = (...args) => { consoleErrors.push(args.map(String).join(' ')); origError(...args) }

const { mount } = await import('./out/ui.js')

// --- helpers -------------------------------------------------------------
let passes = 0, fails = 0
const check = (label, ok, extra = '') => { ok ? passes++ : fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  -> ' + extra : ''}`) }
const $ = (root, sel) => root.querySelector(sel)
const $$ = (root, sel) => [...root.querySelectorAll(sel)]
const byText = (root, sel, text) => $$(root, sel).find((n) => n.textContent.trim().includes(text))
const setInput = (input, value) => {
  const proto = input.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : input.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value)
  input.dispatchEvent(new win.Event('input', { bubbles: true }))
  input.dispatchEvent(new win.Event('change', { bubbles: true }))
}
async function click(ctx, el) { await ctx.act(async () => { el.click() }); await ctx.flush() }

// Seed demo data through the API first.
const adminLogin = await (await fetch(`http://localhost:${PORT}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'ADMIN-2026' }) })).json()
await fetch(`http://localhost:${PORT}/api/admin/demo`, { method: 'POST', headers: { authorization: `Bearer ${adminLogin.token}` } })

try {
  // ===== Judge flow ==========================================================
  let ctx = await mount('/judge')
  await ctx.flush()
  check('judge: sign-in screen renders', Boolean(byText(ctx.el, 'h1', 'Judge sign-in')))
  await ctx.act(async () => setInput($(ctx.el, 'input'), 'judge-12'))
  await click(ctx, byText(ctx.el, 'button', 'Sign in'))
  await ctx.flush()
  check('judge: board shows 18 cards', $$(ctx.el, 'article').length === 18, `${$$(ctx.el, 'article').length} cards`)
  check('judge: no entrant names in DOM', !ctx.el.textContent.includes('Okafor') && !ctx.el.textContent.includes('Low Tide'))
  check('judge: header shows judge name', ctx.el.textContent.includes('Judge 12'))
  check('judge: rail reads 0 of 5', Boolean(byText(ctx.el, 'button', '0 of 5')))

  // Favorite the first four cards via the heart buttons.
  const hearts = $$(ctx.el, 'article button[aria-pressed]').filter((b) => b.getAttribute('aria-label')?.includes('favorites'))
  for (const h of hearts.slice(0, 4)) await click(ctx, h)
  check('judge: favorites tab count = 4', Boolean(byText(ctx.el, '[role=tab]', 'Favorites 4')), byText(ctx.el, '[role=tab]', 'Favorites')?.textContent)
  check('judge: heart is pressed after tap', hearts[0].getAttribute('aria-pressed') === 'true')

  // Region filter narrows the grid.
  await click(ctx, byText(ctx.el, 'button.chip', 'Midwest'))
  check('judge: region filter shows 3', $$(ctx.el, 'article').length === 3)
  await click(ctx, byText(ctx.el, 'button.chip', 'All regions'))

  // Favorites view: shortlist three, hit the limit gracefully.
  await click(ctx, byText(ctx.el, '[role=tab]', 'Favorites'))
  check('judge: favorites view shows 4 cards with shortlist buttons', $$(ctx.el, 'article').length === 4 && $$(ctx.el, 'article button').some((b) => b.textContent.includes('Add to shortlist')))
  for (let i = 0; i < 3; i++) await click(ctx, $$(ctx.el, 'article button').find((b) => b.textContent.includes('Add to shortlist')))
  check('judge: rail reads 3 of 5', Boolean(byText(ctx.el, 'button', '3 of 5')))
  check('judge: 3 shortlisted badges', $$(ctx.el, 'article span').filter((s) => s.textContent.includes('Shortlisted')).length === 3)
  check('judge: rail has 3 filled slots', $$(ctx.el, 'img.slot-fill').length === 3)

  // Open a detail sheet from a card and toggle shortlist off/on from it.
  await click(ctx, $$(ctx.el, 'article button[aria-label^="Open"]')[0])
  let dialog = $(document.body, '[role=dialog]')
  check('judge: detail sheet opens with ingredients', Boolean(dialog) && dialog.textContent.includes('Ingredients') && dialog.textContent.includes('Method'))
  await click(ctx, byText(dialog, 'button', 'Remove from shortlist'))
  check('judge: rail reads 2 of 5 after removing in detail', Boolean(byText(ctx.el, 'button', '2 of 5')))
  await click(ctx, byText(dialog, 'button', 'Add to shortlist'))
  await click(ctx, $(dialog, 'button[aria-label=Close]'))
  check('judge: sheet closes', !$(document.body, '[role=dialog]'))

  // Shortlist sheet -> confirm -> submit.
  await click(ctx, $(ctx.el, 'button[aria-label^="Open your shortlist"]'))
  dialog = $(document.body, '[role=dialog]')
  check('judge: shortlist sheet lists 3 picks', $$(dialog, 'ul li').length === 3)
  await click(ctx, byText(dialog, 'button', 'Submit final shortlist'))
  check('judge: confirmation step shown', dialog.textContent.includes('Submit your shortlist?') && dialog.textContent.includes('sending 3 entries'))
  await click(ctx, byText(dialog, 'button', 'Go back'))
  check('judge: go back returns to list', Boolean(byText(dialog, 'button', 'Submit final shortlist')))
  await click(ctx, byText(dialog, 'button', 'Submit final shortlist'))
  await click(ctx, byText(dialog, 'button', 'Yes, submit'))
  await ctx.flush()
  check('judge: toast confirms submission', document.body.textContent.includes('Shortlist submitted'))
  check('judge: sheet shows submitted time text', $(document.body, '[role=dialog]')?.textContent.includes('Submitted'))
  await click(ctx, $(document.body, '[role=dialog] button[aria-label=Close]'))
  check('judge: rail shows Submitted and hearts disabled', ctx.el.textContent.includes('Submitted') && $$(ctx.el, 'article button[aria-pressed]').every((b) => b.disabled))
  check('judge: locked notice visible', ctx.el.textContent.includes('Your shortlist is in'))

  // Server agrees.
  const ov = await (await fetch(`http://localhost:${PORT}/api/admin/overview`, { headers: { authorization: `Bearer ${adminLogin.token}` } })).json()
  const j12 = ov.judges.find((j) => j.id === 'judge-12')
  check('server: judge-12 submitted with 3 picks, 4 favorites', j12.submitted && j12.shortlist === 3 && j12.favorites === 4)

  // Sign out returns to gate.
  await click(ctx, $(ctx.el, 'button[aria-label="Sign out"]'))
  check('judge: sign out returns to sign-in', Boolean(byText(ctx.el, 'h1', 'Judge sign-in')))
  // Wrong-role code is explained.
  await ctx.act(async () => setInput($(ctx.el, 'input'), 'ADMIN-2026'))
  await click(ctx, byText(ctx.el, 'button', 'Sign in'))
  check('judge: admin code on judge page explains itself', ctx.el.textContent.includes('That code is for the admin page'))
  ctx.root.unmount(); ctx.el.remove()

  // ===== Admin flow ==========================================================
  ctx = await mount('/admin'); await ctx.flush()
  check('admin: sign-in screen', Boolean(byText(ctx.el, 'h1', 'Admin sign-in')))
  await ctx.act(async () => setInput($(ctx.el, 'input'), 'admin-2026'))
  await click(ctx, byText(ctx.el, 'button', 'Sign in')); await ctx.flush()
  check('admin: leaderboard renders 18 ranked rows', $$(ctx.el, 'ol > li').length === 18)
  check('admin: leaderboard shows entrant details', ctx.el.textContent.includes('Okafor') && ctx.el.textContent.includes('Low Tide'))
  check('admin: header shows 6 of 12 submitted', ctx.el.textContent.includes('6 of 12 submitted'))
  check('admin: region bars render', $$(ctx.el, 'aside li').length >= 6)
  const firstRow = $(ctx.el, 'ol > li')
  check('admin: top row has amber shortlist count', /\d/.test($(firstRow, '.text-amber')?.textContent || ''))
  await ctx.act(async () => setInput($(ctx.el, 'select[aria-label="Filter by region"]'), 'Pacific'))
  await ctx.flush()
  check('admin: region filter -> 3 rows', $$(ctx.el, 'ol > li').length === 3)

  await click(ctx, byText(ctx.el, 'nav button', 'Entries'))
  check('admin: entries tab lists 18', $$(ctx.el, 'main ul > li').length === 18, `${$$(ctx.el, 'main ul > li').length}`)
  await ctx.act(async () => setInput($(ctx.el, 'input[aria-label="Search entries"]'), 'negroni')); await ctx.flush()
  check('admin: search narrows to 1', $$(ctx.el, 'main ul > li').length === 1)
  await click(ctx, $(ctx.el, 'main ul > li button'))
  dialog = $(document.body, '[role=dialog]')
  check('admin: entry sheet shows email and entrant', dialog?.textContent.includes('owen@example.com') && dialog.textContent.includes('Quarry'))
  await click(ctx, $(dialog, 'button[aria-label=Close]'))

  await click(ctx, byText(ctx.el, 'nav button', 'Judges'))
  check('admin: judges table has 12 rows', $$(ctx.el, 'tbody tr').length === 12)
  check('admin: codes hidden by default', !ctx.el.textContent.includes('JUDGE-01'))
  await click(ctx, byText(ctx.el, 'button', 'Show codes'))
  check('admin: codes revealed', ctx.el.textContent.includes('JUDGE-01'))
  const reopenRow = $$(ctx.el, 'tbody tr').find((r) => r.textContent.includes('Judge 12'))
  await click(ctx, byText(reopenRow, 'button', 'Reopen'))
  check('admin: reopen judge-12', !$$(ctx.el, 'tbody tr').find((r) => r.textContent.includes('Judge 12')).textContent.includes('Submitted'))
  await click(ctx, $(reopenRow, 'button[aria-label="Edit Judge 12"]') || $$(ctx.el, 'tbody tr').find((r) => r.textContent.includes('Judge 12')).querySelector('button[aria-label^="Edit"]'))
  dialog = $(document.body, '[role=dialog]')
  await ctx.flush()
  check('admin: edit sheet lands focus on the first field', document.activeElement === $$(dialog, 'input')[0], document.activeElement?.tagName + ' ' + (document.activeElement?.getAttribute('aria-label') || ''))
  for (const ch of ['S', 'Sa', 'Sam', 'Sam Rivera']) { await ctx.act(async () => setInput($$(dialog, 'input')[0], ch)); await ctx.flush() }
  check('admin: typing in edit sheet keeps focus in the input', document.activeElement === $$(dialog, 'input')[0])
  await click(ctx, byText(dialog, 'button', 'Save changes'))
  check('admin: judge renamed', ctx.el.textContent.includes('Sam Rivera'))

  await click(ctx, byText(ctx.el, 'nav button', 'Settings'))
  const judgingSwitch = $(ctx.el, '[role=switch][aria-label="Judging is open"]')
  check('admin: judging switch present and on', judgingSwitch?.getAttribute('aria-checked') === 'true')
  await click(ctx, judgingSwitch)
  check('admin: judging closed after toggle', ctx.el.textContent.includes('Judging closed') && $(ctx.el, '[role=switch][aria-label="Judging is closed"]')?.getAttribute('aria-checked') === 'false')
  check('admin: embed snippet contains iframe to /embed', $(ctx.el, 'pre')?.textContent.includes(`http://localhost:${PORT}/embed`))
  check('admin: default admin code warning shown', ctx.el.textContent.includes('ADMIN_CODE'))
  await click(ctx, byText(ctx.el, 'button', 'Reset judging'))
  await click(ctx, byText(ctx.el, 'button', 'Yes, reset judging'))
  check('admin: reset judging -> 0 of 12 submitted', ctx.el.textContent.includes('0 of 12 submitted'))
  await click(ctx, $(ctx.el, '[role=switch][aria-label="Judging is closed"]'))
  ctx.root.unmount(); ctx.el.remove()

  // ===== Judge sees closed state ============================================
  await fetch(`http://localhost:${PORT}/api/admin/settings`, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminLogin.token}` }, body: JSON.stringify({ judgingOpen: false }) })
  localStorage.clear()
  ctx = await mount('/judge'); await ctx.flush()
  await ctx.act(async () => setInput($(ctx.el, 'input'), 'JUDGE-05'))
  await click(ctx, byText(ctx.el, 'button', 'Sign in')); await ctx.flush()
  check('judge: closed notice + rail', ctx.el.textContent.includes('Judging is closed right now') && ctx.el.textContent.includes('Judging closed'))
  check('judge: hearts disabled while closed', $$(ctx.el, 'article button[aria-pressed]').every((b) => b.disabled))
  ctx.root.unmount(); ctx.el.remove()
  await fetch(`http://localhost:${PORT}/api/admin/settings`, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminLogin.token}` }, body: JSON.stringify({ judgingOpen: true }) })

  // ===== Entry form ===========================================================
  ctx = await mount('/enter'); await ctx.flush()
  check('enter: paper theme applied to <html>', document.documentElement.classList.contains('theme-paper'))
  check('enter: form renders with region options', $$(ctx.el, 'select option').length === 7)
  await click(ctx, byText(ctx.el, 'button', 'Submit entry'))
  check('enter: validation errors shown', $$(ctx.el, '[role=alert]').length >= 6, `${$$(ctx.el, '[role=alert]').length} errors`)
  check('enter: first invalid field focused', document.activeElement?.getAttribute('aria-invalid') === 'true', document.activeElement?.tagName)
  await ctx.act(async () => setInput(document.activeElement, 'Smoke on the Marsh')); await ctx.flush()
  check('enter: editing a field clears its error', !byText(ctx.el, '[role=alert]', 'Give your cocktail a name'))
  await click(ctx, byText(ctx.el, 'button', 'Add ingredient'))
  check('enter: add ingredient -> 4 rows', $$(ctx.el, 'input[aria-label^="Ingredient"]').length === 4)
  await click(ctx, $(ctx.el, 'button[aria-label="Remove ingredient 4"]'))
  check('enter: remove ingredient -> 3 rows', $$(ctx.el, 'input[aria-label^="Ingredient"]').length === 3)
  ctx.root.unmount(); ctx.el.remove()
  check('enter: paper theme removed on unmount', !document.documentElement.classList.contains('theme-paper'))

  // Closed entries state.
  await fetch(`http://localhost:${PORT}/api/admin/settings`, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminLogin.token}` }, body: JSON.stringify({ entriesOpen: false }) })
  ctx = await mount('/embed'); await ctx.flush()
  check('embed: closed message when entries closed', ctx.el.textContent.includes('Entries are closed'))
  ctx.root.unmount(); ctx.el.remove()

  // Home
  ctx = await mount('/'); await ctx.flush()
  check('home: three doors', $$(ctx.el, 'a[href="/judge"], a[href="/enter"], a[href="/admin"]').length === 3)
  ctx.root.unmount(); ctx.el.remove()
} catch (err) {
  fails++
  console.error('TEST CRASH', err)
}

const relevantErrors = consoleErrors.filter((e) => !e.includes('Not implemented: HTMLCanvasElement') && !e.includes('act(') && !e.includes('wrapped in act'))
check('no React/console errors during flows', relevantErrors.length === 0, relevantErrors.slice(0, 3).join(' | ').slice(0, 400))
console.log(`\n${passes} passed, ${fails} failed`)
server.kill('SIGTERM')
await new Promise((r) => server.on('exit', r))
if (fails) console.log('--- server log ---\n' + serverLog)
process.exit(fails ? 1 : 0)
