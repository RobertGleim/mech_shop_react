import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegisterView.css' // register uses its own styles to match card look
import { apiUrl } from '../lib/api'

export default function RegisterView() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(apiUrl('/customers/'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form)
      })
      const body = await resp.json().catch(()=>null)
      if (!resp.ok) {
        // body may be validation messages or message field
        const msg = body && (body.message || JSON.stringify(body)) || `Failed (${resp.status})`
        setError(msg)
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
      // optionally redirect to login after a short delay
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.message || 'Network error')
      setLoading(false)
    }
  }

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <div className="contact-card">
          <h3>Create an Account</h3>

          {success ? (
            <div className="success-message">Account created. Redirecting to login...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message" style={{marginBottom:12}}>{error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={form.address} onChange={handleChange} />
                </div>
              </div>

              <div style={{marginTop:12}}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}