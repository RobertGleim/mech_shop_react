import React, { useState } from 'react'
import './ContactView.css'

function ContactView() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [service, setService] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const services = [
    'Computer Diagnostics & Troubleshooting',
    'Oil Change & Routine Maintenance',
    'Engine & Transmission Repair', 
    'Brake Service & Wheel Alignment',
    'Battery, Alternator & Electrical Systems',
    'AC & Heating Service'
  ]

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Simulate sending form
    setTimeout(() => {
      setMessage('Thank you! We will contact you soon.')
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setService('')
      setComments('')
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <h1>Contact Us</h1>
        <h2>Request a service</h2>

        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            {message && <div className="success-message">{message}</div>}

            <h3>Your Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Your address"
                required
              />
            </div>

            <h3>Service Needed</h3>

            <div className="form-group">
              <label>Choose Service</label>
              <select
                value={service}
                onChange={e => setService(e.target.value)}
                required
              >
                <option value="">Select a service...</option>
                {services.map((serviceName, index) => (
                  <option key={index} value={serviceName}>
                    {serviceName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Comments</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Tell us about your car problem..."
                rows={5}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        </div>

        <div className="contact-info">
          <h3>Our Location</h3>
          <p>📍 123 Mechanic Street, Auto City, AC 12345</p>
          <p>📞 (555) 123-MECH</p>
          <p>⏰ Mon-Fri: 8am-6pm, Sat: 9am-4pm</p>
          <p>✉️ info@coolx3mechanics.com</p>
        </div>
      </div>
    </div>
  )
}

export default ContactView