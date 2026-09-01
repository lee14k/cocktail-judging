import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

// Restores the session on load, and exposes login/logout. `role` filters which
// kind of session a page accepts, so a judge token never unlocks the admin.
export function useSession(role) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(Boolean(getToken()))

  useEffect(() => {
    let cancelled = false
    if (!getToken()) return
    api('/api/me')
      .then((me) => { if (!cancelled) setSession(me.role === role ? me : null) })
      .catch(() => { if (!cancelled) setSession(null) })
      .finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [role])

  const login = useCallback(async (code) => {
    const result = await api('/api/login', { method: 'POST', body: { code } })
    if (result.role !== role) {
      const where = result.role === 'admin' ? 'the admin page' : 'the judge page'
      throw new Error(`That code is for ${where}.`)
    }
    setToken(result.token)
    setSession(result)
    return result
  }, [role])

  const logout = useCallback(async () => {
    try { await api('/api/logout', { method: 'POST' }) } catch {}
    setToken(null)
    setSession(null)
  }, [])

  const clear = useCallback(() => { setToken(null); setSession(null) }, [])

  return { session, checking, login, logout, clear }
}
