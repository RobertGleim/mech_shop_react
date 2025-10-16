import React, { createContext, useEffect, useState } from 'react'
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
      /* ignore storage errors */
    }
  }

  const clearAuth = () => {
    setToken(null)
    setUserType(null)
    setProfile(null)
    setIsAdmin(false)
    persist(null, null, false)
    window.dispatchEvent(new Event('login-status-change'))
  }

  const logout = () => {
    clearAuth()
  }

  
  const fetchProfile = async (tkn, type) => {
    if (!tkn || !type) return null
    const endpoint = type === 'customer' ? '/customers/profile' : '/mechanics/profile'
    try {
      const res = await fetch(apiUrl(endpoint), {
        headers: { Authorization: `Bearer ${tkn}`, Accept: 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      setIsAdmin(Boolean(data?.is_admin || data?.isAdmin))
      return data
    } catch (err) {
      console.debug('fetchProfile error', err)
      clearAuth()
      return null
    }
  }

  
  useEffect(() => {
    let storedToken = null
    let storedType = null
    try {
      storedToken = localStorage.getItem('token')
      storedType = localStorage.getItem('userType')
    } catch {
      /* ignore */
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

  
  const login = async ({ email, password, type: desiredType } = {}) => {
    const payload = { email, password }
    if (desiredType) payload.user_type = desiredType

    const endpoints = ['/auth/login', '/login']
    let lastErr = null

    for (const ep of endpoints) {
      try {
        const res = await fetch(apiUrl(ep), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          lastErr = new Error(body?.message || `HTTP ${res.status}`)
          continue
        }

        const tkn = body?.token || body?.access_token || body?.data?.token || null
        const returnedType = desiredType || body?.userType || body?.user_type || body?.data?.userType || body?.data?.user_type || null
        const adminFlag = Boolean(body?.is_admin || body?.isAdmin || body?.data?.is_admin)

        if (!tkn) {
          lastErr = new Error('Login succeeded but token missing')
          continue
        }

        setToken(tkn)
        setUserType(returnedType)
        persist(tkn, returnedType, adminFlag)
        await fetchProfile(tkn, returnedType || desiredType)
        window.dispatchEvent(new Event('login-status-change'))
        return { ok: true }
      } catch (err) {
        lastErr = err
      }
    }

    throw lastErr || new Error('Login failed')
  }

  const loginWithToken = async (tkn, type) => {
    if (!tkn) throw new Error('Token required')
    setToken(tkn)
    setUserType(type)
    persist(tkn, type)
    await fetchProfile(tkn, type)
    window.dispatchEvent(new Event('login-status-change'))
  }

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
