import React, { createContext, useEffect, useState, useCallback } from 'react'
import { apiUrl } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [userType, setUserType] = useState(null) // 'customer' | 'mechanic' | 'admin' etc
  const [profile, setProfile] = useState(null) // profile object returned by /profile endpoints
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Helper to persist auth to localStorage
  const persist = (tkn, type, adminFlag = false) => {
    try {
      if (tkn) localStorage.setItem('token', tkn)
      else localStorage.removeItem('token')
      if (type) localStorage.setItem('userType', type)
      else localStorage.removeItem('userType')
      localStorage.setItem('isAdmin', adminFlag ? '1' : '')
    } catch {
      // ignore storage errors
    }
  }

  const clearAuth = useCallback(() => {
    setToken(null)
    setUserType(null)
    setProfile(null)
    setIsAdmin(false)
    persist(null, null, false)
    // notify other parts of app (existing code listens for this event)
    window.dispatchEvent(new Event('login-status-change'))
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    // optionally redirecting is left to callers
  }, [clearAuth])

  // Fetch profile based on userType and token
  const fetchProfile = useCallback(async (tkn, type) => {
    if (!tkn || !type) return null
    const headers = { 'Authorization': `Bearer ${tkn}`, 'Accept': 'application/json' }
    try {
      if (type === 'customer') {
        const res = await fetch(apiUrl('/customers/profile'), { headers })
        if (!res.ok) throw new Error('Failed to fetch customer profile')
        const data = await res.json()
        setProfile(data)
        setIsAdmin(false)
        return data
      } else {
        // mechanic/admin use mechanics/profile
        const res = await fetch(apiUrl('/mechanics/profile'), { headers })
        if (!res.ok) throw new Error('Failed to fetch mechanic profile')
        const data = await res.json()
        const adminFlag = !!(data.is_admin || data.isAdmin)
        setProfile(data)
        setIsAdmin(adminFlag)
        return data
      }
    } catch (err) {
      // token might be invalid — clear auth
      console.debug('fetchProfile error', err)
      clearAuth()
      return null
    }
  }, [clearAuth])

  // Hydrate from localStorage on mount
  useEffect(() => {
    const tkn = (() => { try { return localStorage.getItem('token') } catch { return null } })()
    const type = (() => { try { return localStorage.getItem('userType') } catch { return null } })()
    if (tkn && type) {
      setToken(tkn)
      setUserType(type)
      fetchProfile(tkn, type).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // log in by calling backend auth endpoint; callers may pass userType if required
  const login = useCallback(async ({ email, password, type: desiredType } = {}) => {
    // try common login endpoints; adjust to your backend if different
    const payload = { email, password }
    if (desiredType) payload.user_type = desiredType

    // prefer /auth/login but fallback to /login
    const endpoints = ['/auth/login', '/login']
    let lastErr = null
    for (const ep of endpoints) {
      try {
        const res = await fetch(apiUrl(ep), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        })
        let body = null
        try { body = await res.json() } catch { body = null }
        if (!res.ok) {
          lastErr = new Error((body && (body.message || body.error)) || `HTTP ${res.status}`)
          continue
        }
        // Try to extract token & userType from response
        const tkn = body?.token || body?.access_token || body?.data?.token || null
        const returnedType = desiredType || body?.userType || body?.user_type || body?.data?.userType || body?.data?.user_type || null
        const adminFlag = !!(body?.is_admin || body?.isAdmin || body?.data?.is_admin)
        if (!tkn) {
          // some APIs might return only success and set cookie; in that case attempt to read localStorage/cookies
          lastErr = new Error('Login succeeded but token not returned')
          // still persist any userType if present
        }
        // Save token and userType and fetch profile
        if (tkn) {
          setToken(tkn)
          setUserType(returnedType)
          persist(tkn, returnedType, adminFlag)
          await fetchProfile(tkn, returnedType || desiredType)
          window.dispatchEvent(new Event('login-status-change'))
        } else {
          // if token missing but server indicated success, try to hydrate from storage/cookies
          const storedTkn = localStorage.getItem('token')
          const storedType = localStorage.getItem('userType')
          if (storedTkn) {
            setToken(storedTkn)
            setUserType(storedType)
            await fetchProfile(storedTkn, storedType)
            window.dispatchEvent(new Event('login-status-change'))
          } else {
            throw lastErr || new Error('Login failed: no token')
          }
        }
        return { ok: true }
      } catch (err) {
        lastErr = err
        // try next endpoint
      }
    }
    throw lastErr || new Error('Login failed')
  }, [fetchProfile])

  // Directly set auth when token is already obtained elsewhere
  const loginWithToken = useCallback(async (tkn, type) => {
    if (!tkn) throw new Error('Token required')
    setToken(tkn)
    setUserType(type)
    persist(tkn, type)
    await fetchProfile(tkn, type)
    window.dispatchEvent(new Event('login-status-change'))
  }, [fetchProfile])

  const value = {
    token,
    userType,
    profile,
    isAdmin,
    loading,
    login,
    loginWithToken,
    logout,
    clearAuth,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
