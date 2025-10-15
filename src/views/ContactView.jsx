import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './ContactView.css'

// Arrow function component
const ContactView = () => {
  // Get data passed from other pages
  const location = useLocation();
  const customerData = location.state?.customerData || null;
  
  // Create state variables for form fields
  const [name, setName] = useState(customerData?.name || '')
  const [email, setEmail] = useState(customerData?.email || '')
  const [phone, setPhone] = useState(customerData?.phone || '')
  const [message, setMessage] = useState('')
  const [service, setService] = useState('oil_change')
  const [preferredDate, setPreferredDate] = useState('')
  
  // Create state variables for form status
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // This runs when customerData changes
  useEffect(() => {
    if (customerData) {
      // Fill in form with customer data
      setName(customerData.name || '')
      setEmail(customerData.email || '')
      setPhone(customerData.phone || '')
      
      // Add default message for logged in users
      if (customerData.isLoggedInCustomer) {
        setMessage('I would like to schedule the following service:')
      }
    }
  }, [customerData])
  
  // Function that runs when form is submitted
  const handleSubmit = (e) => {
    // Prevent page refresh
    e.preventDefault()
    
    // Show loading state
    setLoading(true)
    setError('')
    
    // Check if required fields are filled
    if (!name || !email || !phone || !message) {
      setError('All fields are required')
      setLoading(false)
      return
    }
    
    // This simulates sending data to a server
    setTimeout(() => {
      // Show success message
      setSuccess(true)
      setLoading(false)
      
      // Clear form fields
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
  
  // Return the component UI
  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        {/* single centered card that contains the header and either success or the form */}
        <div className="contact-card">
          <div className="card-header">
            <h1>Contact Us</h1>
            <h2>{customerData ? 'Schedule Your Service' : 'Get in touch with our team'}</h2>
          </div>
          
          {/* Show success message or form based on submission status */}
          {success ? (
            <div className="success-message">
              <h3>Thank you for contacting us!</h3>
              <p>We have received your message and will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              {/* Show error message if there is one */}
              {error && <div className="error-message">{error}</div>}
              
              {/* Name field */}
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
              
              {/* Email field */}
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
              
              {/* Phone field */}
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
              
              {/* Service dropdown */}
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
              
              {/* Date picker */}
              <div className="form-group">
                <label>Preferred Date</label>
                <input 
                  type="date" 
                  value={preferredDate} 
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {/* Message text area */}
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
              
              {/* Submit button */}
              <button type="submit" className="contact-btn" disabled={loading}>
                {loading ? 'Sending...' : customerData ? 'Schedule Service' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactView