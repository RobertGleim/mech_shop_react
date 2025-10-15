import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './LoginView.css'

// Use dev proxy when in development; only call VITE_API_URL in production
const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')
const buildUrl = (path) => {
  if (!path.startsWith('/')) path = `/${path}`
  return apiBase ? `${apiBase.replace(/\/$/, '')}${path}` : `/api${path}`
}
const credentialsMode = apiBase ? 'omit' : 'include'

function LoginView() {
  // Make variables for form data
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('mechanic')
  const navigate = useNavigate()

  // Function that runs when form is submitted
  async function handleSubmit(event) {
    // Stop the page from refreshing
    event.preventDefault()
    setErrorMessage('')

    const rawId = (emailOrUsername || '').trim()
    const rawPassword = (password || '').trim()

    if (!rawId) {
      setErrorMessage('Please enter your email or username.')
      return
    }
    if (!rawPassword) {
      setErrorMessage('Please enter your password.')
      return
    }

    // Build payload: prefer email when input looks like an email, otherwise send username
    const payload = { password: rawPassword }
    if (rawId.includes('@')) {
      payload.email = rawId
    } else {
      payload.username = rawId
    }

    setLoading(true)

    try {
      // Choose endpoint based on selected user type
      const endpoint = userType === 'customer' ? '/customers/login' : '/mechanics/login'
      const url = buildUrl(endpoint)
      console.debug('Login request ->', { url, payload, credentials: credentialsMode })

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: credentialsMode,
        body: JSON.stringify(payload)
      })

      // Robustly parse JSON/text body
      let respBody = null
      try { respBody = await resp.clone().json() } catch {
        try { respBody = await resp.clone().text() } catch { respBody = null }
      }

      const prettyBody = respBody && typeof respBody === 'object' ? JSON.stringify(respBody, null, 2) : String(respBody)
      console.log('Login response details:', { status: resp.status, statusText: resp.statusText, headers: Array.from(resp.headers.entries()), body: prettyBody })

      if (!resp.ok) {
        // Provide actionable messages for common statuses
        const serverMsg = respBody && (typeof respBody === 'object' ? (respBody.message || respBody.error || JSON.stringify(respBody)) : String(respBody))
        if (resp.status === 400) { setErrorMessage(serverMsg || 'Bad request - please check your input.'); return }
        if (resp.status === 401) { setErrorMessage(serverMsg || 'Invalid credentials. Please try again.'); return }
        if (resp.status === 403) { setErrorMessage(serverMsg || 'Forbidden. Your account is not authorized.'); return }
        setErrorMessage(serverMsg || `Login failed with status ${resp.status}`)
        return
      }

      // Successful response
      const data = respBody && typeof respBody === 'object' ? respBody : await resp.json().catch(()=>null)
      const token = data?.token || data?.access_token || data?.accessToken
      if (!token) {
        console.error('Login succeeded but no token in response:', data)
        setErrorMessage('Login succeeded but no token returned by server.')
        return
      }

      // Persist token under multiple keys so AdminView/getAuthToken finds it
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('access_token', token)
        localStorage.setItem('authToken', token)
        // also mirror to sessionStorage
        sessionStorage.setItem('token', token)
        // cookie fallback (expires in 7 days)
        document.cookie = `token=${encodeURIComponent(token)};path=/;max-age=${7*24*60*60}`
      } catch (e) {
        console.warn('Could not persist token to storage', e)
      }

      // Persist user metadata for role checks
      if (typeof data.id !== 'undefined') localStorage.setItem('userId', String(data.id))

      if (userType === 'customer') {
        // customer login path: mark as customer
        localStorage.setItem('isAdmin', 'false')
        localStorage.setItem('userType', 'customer')
      } else {
        // mechanic login path: use is_admin flag if present, otherwise default to mechanic
        const isAdmin = !!data.is_admin
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false')
        localStorage.setItem('userType', isAdmin ? 'admin' : 'mechanic')
      }

      // Notify other parts of the app (AdminView listens for this)
      window.dispatchEvent(new Event('login-status-change'))

      // Navigate to appropriate page
      if (localStorage.getItem('userType') === 'admin') navigate('/admin')
      else if (localStorage.getItem('userType') === 'customer') navigate('/')
      else navigate('/')
    } catch (err) {
      console.error('Login error (network/other):', err)
      setErrorMessage(err.message || 'Network error during login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <h2>Sign in to your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {errorMessage && <div className="error">{errorMessage}</div>}

            <div className="user-type-switch">
              <button 
                type="button"
                className={`switch-btn ${userType === 'customer' ? 'active' : ''}`}
                onClick={() => setUserType('customer')}
              >
                Customer
              </button>
              <button 
                type="button"
                className={`switch-btn ${userType === 'mechanic' ? 'active' : ''}`}
                onClick={() => setUserType('mechanic')}
              >
                Mechanic
              </button>
            </div>

            <div className="form-group">
              <label>Email or Username</label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : `Sign In as ${userType === 'customer' ? 'Customer' : 'Mechanic'}`}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <NavLink to="/register">Sign up here</NavLink></p>
            <NavLink to="/forgot-password">Forgot your password?</NavLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginView