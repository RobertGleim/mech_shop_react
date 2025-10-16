import React, { createContext, useEffect, useState, useCallback } from 'react'
import { apiUrl } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [userType, setUserType] = useState(null) 
  const [profile, setProfile] = useState(null) 
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  
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

  // Clear auth state
  const clearAuth = useCallback(() => {
    setToken(null)
    setUserType(null)
    setProfile(null)
    setIsAdmin(false)
    persist(null, null, false)
    window.dispatchEvent(new Event('login-status-change'))
  }, [])

  // Logout just clears auth (redirect handled by callers)
  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  // Fetch profile for given token and type (customer vs mechanic)
  const fetchProfile = useCallback(async (tkn, type) => {
    if (!tkn || !type) return null
    const headers = { 'Authorization': `Bearer ${tkn}`, 'Accept': 'application/json' }
    const endpoint = type === 'customer' ? '/customers/profile' : '/mechanics/profile'
    try {
      const res = await fetch(apiUrl(endpoint), { headers })
      if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`)
      const data = await res.json()
      setProfile(data)
      const adminFlag = Boolean(data?.is_admin || data?.isAdmin)
      setIsAdmin(adminFlag)
      return data
    } catch (err) {
      // invalid token or network error -> clear auth
      console.debug('fetchProfile error', err)
      clearAuth()
      return null
    }
  }, [clearAuth])

  // Hydrate from localStorage on mount (simple)
  useEffect(() => {
    let storedToken = null
    let storedType = null
    try {
      storedToken = localStorage.getItem('token')
      storedType = localStorage.getItem('userType')
    } catch {
      // ignore storage errors
    }
    if (storedToken && storedType) {
      setToken(storedToken)
      setUserType(storedType)
      fetchProfile(storedToken, storedType).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Login: try /auth/login then /login; keep logic simple and readable
  const login = useCallback(async ({ email, password, type: desiredType } = {}) => {
    const payload = { email, password }
    if (desiredType) payload.user_type = desiredType

    const tryEndpoints = ['/auth/login', '/login']
    let lastError = null

    for (const ep of tryEndpoints) {
      try {
        const res = await fetch(apiUrl(ep), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          lastError = new Error(body?.message || `HTTP ${res.status}`)
          continue
        }

        // Extract token and user type in a straightforward way
        const tkn = body?.token || body?.access_token || body?.data?.token || null
        const returnedType = desiredType || body?.userType || body?.user_type || body?.data?.userType || body?.data?.user_type || null
        const adminFlag = Boolean(body?.is_admin || body?.isAdmin || body?.data?.is_admin)

        if (!tkn) {
          lastError = new Error('Login succeeded but no token returned')
          continue
        }

        // Save and fetch profile
        setToken(tkn)
        setUserType(returnedType)
        persist(tkn, returnedType, adminFlag)
        await fetchProfile(tkn, returnedType || desiredType)
        window.dispatchEvent(new Event('login-status-change'))
        return { ok: true }
      } catch (err) {
        lastError = err
        // try next endpoint
      }
    }

    throw lastError || new Error('Login failed')
  }, [fetchProfile])

  // Directly set auth when token is obtained elsewhere
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
