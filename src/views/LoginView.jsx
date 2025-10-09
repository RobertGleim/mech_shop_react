import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './LoginView.css'

function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userType, setUserType] = useState('customer')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const loginData = {
      email: email,
      password: password
    }

    const endpoint = userType === 'customer' 
      ? 'https://mech-shop-api.onrender.com/customers/login'
      : 'https://mech-shop-api.onrender.com/mechanics/login'

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        setSuccess('Login successful!')
        localStorage.setItem('token', data.token)
        localStorage.setItem('userType', userType)
        
        // Dispatch event to notify NavBar component
        window.dispatchEvent(new Event('login-status-change'))
        
        // Redirect based on user type
        if (userType === 'customer') {
          navigate('/customer')
        } else {
          navigate('/mechanic')
        }
      } else {
        setError('Login failed - invalid credentials')
      }
      setLoading(false)
    })
    .catch(() => {
      setError('Connection error')
      setLoading(false)
    })
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