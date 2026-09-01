// Thin fetch wrapper. The session token lives in localStorage so a judge who
// adds the app to their home screen stays signed in between shifts.

const TOKEN_KEY = 'cocktail-judging.token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch {}
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.")
  }
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`)
  return data
}
