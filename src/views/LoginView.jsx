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
      const url = buildUrl('/mechanics/login')
      // Debug outgoing request
      console.debug('Login request ->', { url, payload, credentials: credentialsMode })

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: credentialsMode,
        body: JSON.stringify(payload)
      })

      // Try to parse structured JSON first, otherwise text
      let serverBody = null
      try {
        serverBody = await resp.clone().json()
      } catch {
        try {
          serverBody = await resp.clone().text()
        } catch {
          serverBody = null
        }
      }

      console.error && console.error('Login failed response:', { status: resp.status, body: serverBody })

      if (!resp.ok) {
        // Provide clear messages for common auth errors
        if (resp.status === 400) {
          const msg = serverBody && (serverBody.message || serverBody.error) || 'Bad request - please check your input.'
          setErrorMessage(msg)
          return
        }
        if (resp.status === 401) {
          setErrorMessage('Invalid credentials. Please try again.')
          return
        }
        if (resp.status === 403) {
          setErrorMessage('Forbidden. Your account is not authorized.')
          return
        }

        const serverMsg = serverBody && (serverBody.message || JSON.stringify(serverBody)) || `Login failed with status ${resp.status}`
        setErrorMessage(serverMsg)
        return
      }

      const data = await resp.json()
      const token = data?.token || data?.access_token
      if (!token) {
        console.error('Login succeeded but no token in response:', data)
        setErrorMessage('Login succeeded but no token was returned by the server.')
        return
      }

      // Persist token immediately
      localStorage.setItem('token', token)

      // Fetch profile to determine role/is_admin and persist userType/isAdmin for AdminView
      try {
        const profileResp = await fetch(buildUrl('/mechanics/profile'), {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          credentials: credentialsMode
        })

        let profileBody = null
        try { profileBody = await profileResp.json() } catch { profileBody = null }

        if (!profileResp.ok) {
          console.error('Profile fetch failed after login:', { status: profileResp.status, body: profileBody })
          // Clear token if profile can't be fetched/auth fails
          localStorage.removeItem('token')
          setErrorMessage(profileBody?.message || 'Failed to verify profile after login.')
          return
        }

        // Determine user type and admin flag
        const isAdmin = !!(profileBody?.is_admin || profileBody?.isAdmin)
        const role = isAdmin ? 'admin' : 'mechanic'
        localStorage.setItem('userType', role)
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false')
        // notify other parts of the app
        window.dispatchEvent(new Event('login-status-change'))

        // Navigate: go to admin dashboard if admin, otherwise home
        if (isAdmin) navigate('/admin')
        else navigate('/')

      } catch (profileErr) {
        console.error('Error fetching profile after login:', profileErr)
        // Keep token but surface error
        setErrorMessage('Logged in but failed to fetch profile. Try refreshing or logging in again.')
        return
      }
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