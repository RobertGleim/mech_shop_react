import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './LoginView.css'
import { apiUrl } from '../lib/api'

// Use production API only in production mode; in dev use the dev proxy
const apiBase = import.meta.env.MODE === 'production' ? import.meta.env.VITE_API_URL || '' : ''

function LoginView() {
  // Make variables for form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userType, setUserType] = useState('customer')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  // Function that runs when form is submitted
  async function handleSubmit(e) {
    // Stop the page from refreshing
    e.preventDefault()
    
    setError('')
    setSuccess('')
    setLoading(true)

    // Check if form is filled
    if (email === "" || password === "") {
      setError("Please fill all fields")
      setLoading(false)
      return
    }
    
    // Try to log in
    const loginData = {
      email: email,
      password: password
    }

    try {
      // Build request URL: production-only apiBase, otherwise dev proxy
      const url = apiBase ? `${apiBase.replace(/\/$/, '')}/mechanics/login` : '/api/mechanics/login'

      // Only include cookies when using the dev proxy (same-origin); omit for external API
      const credentialsMode = apiBase ? 'omit' : 'include'

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: credentialsMode,
        body: JSON.stringify(loginData)
      })

      if (!resp.ok) {
        // Handle common auth errors with friendly messages
        if (resp.status === 401) {
          setErrorMessage('Invalid credentials. Please try again.')
          return
        }
        if (resp.status === 403) {
          // Distinguish between missing permissions vs server rejecting cross-origin requests
          const msg = apiBase
            ? 'Access forbidden by the production API (403). If this should work locally, run the dev server without VITE_API_URL so the proxy is used, or check backend CORS/auth settings.'
            : 'Forbidden. Your account is not authorized.'
          setErrorMessage(msg)
          return
        }
        const errText = await resp.text().catch(() => '')
        throw new Error(errText || `Login failed with status ${resp.status}`)
      }

      const data = await resp.json()

      if (data.token) {
        // Save login info
        localStorage.setItem('token', data.token)
        localStorage.setItem('userType', userType)

        // Tell other components we logged in
        window.dispatchEvent(new Event('login-status-change'))

        // Show success message
        setSuccess('Login successful!')

        // If mechanic, fetch profile to check admin flag and redirect accordingly
        if (userType === 'mechanic') {
            fetch(apiUrl('/mechanics/profile'), {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          })
          .then(res => {
            if (!res.ok) {
              console.error('Profile fetch failed:', res.status, res.statusText)
              throw new Error(`Profile fetch failed: ${res.status} ${res.statusText}`)
            }
            return res.json()
          })
          .then(profile => {
            const isAdmin = profile?.is_admin || profile?.isAdmin || false
            // persist admin flag for NavBar and other components
            if (isAdmin) {
              localStorage.setItem('isAdmin', 'true')
            } else {
              localStorage.removeItem('isAdmin')
            }
            
            // Notify NavBar and other components about the login status change
            window.dispatchEvent(new Event('login-status-change'))
            
            // Navigate based on admin status
            if (isAdmin) {
              navigate('/admin')
            } else {
              navigate('/mechanic')
            }
          })
          .catch((err) => {
            // If profile fetch fails for any reason, fall back to mechanic dashboard
            console.error('Profile fetch error after login:', err)
            localStorage.removeItem('isAdmin')
            // Notify NavBar about the status change even if profile fetch fails
            window.dispatchEvent(new Event('login-status-change'))
            navigate('/mechanic')
          })
        } else {
          // Customer goes to customer dashboard
          navigate('/customer')
        }
      } else {
        setError('Login failed - invalid credentials')
      }
      setLoading(false)
    } catch (err) {
      console.error('Login error:', err)
      setErrorMessage(err.message || 'Network error during login.')
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
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
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
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
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