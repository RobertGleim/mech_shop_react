import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './ContactView.css'

export default function ContactView() {
  const location = useLocation()
  const customerData = location.state?.customerData || null

  const [name, setName] = useState(customerData?.name || '')
  const [email, setEmail] = useState(customerData?.email || '')
  const [phone, setPhone] = useState(customerData?.phone || '')
  const [service, setService] = useState('oil_change')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState(customerData?.isLoggedInCustomer ? 'I would like to schedule the following service:' : '')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerData) return
    setName(customerData.name || '')
    setEmail(customerData.email || '')
    setPhone(customerData.phone || '')
    if (customerData.isLoggedInCustomer) setMessage('I would like to schedule the following service:')
  }, [customerData])

  const minDate = new Date().toISOString().split('T')[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !phone || !message) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
      if (!customerData) {
        setName(''); setEmail(''); setPhone('')
      }
      setMessage('')
      setPreferredDate('')
      setService('oil_change')
    }, 900)
  }

  if (success) {
    return (
      <div className="contact-container">
        <div className="contact-wrapper">
          <div className="contact-card">
            <div className="card-header">
              <h1>Thank you</h1>
              <p>We received your request and will contact you shortly.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <div className="contact-card">
          <div className="card-header">
            <h1>Contact Us</h1>
            <h2>{customerData ? 'Schedule Your Service' : 'Get in touch with our team'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={customerData?.isLoggedInCustomer} />
              {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={customerData?.isLoggedInCustomer} />
              {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={customerData?.isLoggedInCustomer} />
              {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
            </div>

            <div className="form-group">
              <label>Service Type</label>
              <select value={service} onChange={(e) => setService(e.target.value)}>
                <option value="oil_change">Oil Change</option>
                <option value="tire_rotation">Tire Rotation</option>
                <option value="brake_service">Brake Service</option>
                <option value="engine_repair">Engine Repair</option>
                <option value="inspection">Vehicle Inspection</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Date</label>
              <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} min={minDate} />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Please describe what you need help with..." />
            </div>

            <button type="submit" className="contact-btn" disabled={loading}>
              {loading ? 'Sending...' : customerData ? 'Schedule Service' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}