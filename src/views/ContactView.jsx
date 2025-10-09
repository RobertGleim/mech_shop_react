import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './ContactView.css'

function ContactView() {
  const location = useLocation();
  const customerData = location.state?.customerData || null;
  
  // Initialize state with customer data if available
  const [name, setName] = useState(customerData?.name || '')
  const [email, setEmail] = useState(customerData?.email || '')
  const [phone, setPhone] = useState(customerData?.phone || '')
  const [message, setMessage] = useState('')
  const [service, setService] = useState('oil_change')
  const [preferredDate, setPreferredDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // Set form field values when customerData changes
  useEffect(() => {
    if (customerData) {
      setName(customerData.name || '')
      setEmail(customerData.email || '')
      setPhone(customerData.phone || '')
      
      // If customer is logged in, set a default message
      if (customerData.isLoggedInCustomer) {
        setMessage('I would like to schedule the following service:')
      }
    }
  }, [customerData])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Form validation
    if (!name || !email || !phone || !message) {
      setError('All fields are required')
      setLoading(false)
      return
    }
    
    // In a real app, you would submit this data to your backend
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
      
      // Reset form after successful submission
      if (!customerData) {
        setName('')
        setEmail('')
        setPhone('')
      }
      setMessage('')
      setPreferredDate('')
      setService('oil_change')
    }, 1000)
  }
  
  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <h2>{customerData ? 'Schedule Your Service' : 'Get in touch with our team'}</h2>
        </div>
        
        {success ? (
          <div className="success-message">
            <h3>Thank you for contacting us!</h3>
            <p>We have received your message and will get back to you shortly.</p>
          </div>
        ) : (
          <div className="contact-card">
            <form onSubmit={handleSubmit} className="contact-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Your Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={customerData?.isLoggedInCustomer}
                  className={customerData?.isLoggedInCustomer ? 'autofilled' : ''}
                />
                {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={customerData?.isLoggedInCustomer}
                  className={customerData?.isLoggedInCustomer ? 'autofilled' : ''}
                />
                {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={customerData?.isLoggedInCustomer}
                  className={customerData?.isLoggedInCustomer ? 'autofilled' : ''}
                />
                {customerData?.isLoggedInCustomer && <small>Auto-filled from your profile</small>}
              </div>
              
              <div className="form-group">
                <label>Service Type</label>
                <select 
                  value={service} 
                  onChange={(e) => setService(e.target.value)}
                  required
                >
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
                <input 
                  type="date" 
                  value={preferredDate} 
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Please describe what you need help with..."
                ></textarea>
              </div>
              
              <button type="submit" className="contact-btn" disabled={loading}>
                {loading ? 'Sending...' : customerData ? 'Schedule Service' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactView