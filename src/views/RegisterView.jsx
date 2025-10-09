import React, { useState } from 'react'
import './RegisterView.css'

function RegisterView() {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'customer'
  })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setMessage('Please fill all required fields')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          user_type: formData.userType
        })
      })
      
      const data = await response.json()
      
      if (data.message === 'User created successfully') {
        setMessage('Registration successful! Please login.')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          userType: 'customer'
        })
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setMessage(`Registration failed: ${data.message}`)
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="register-page">
      <h1>Register</h1>
      
      {message && <div className="message">{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input 
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input 
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="userType">I am a</label>
          <select 
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleInputChange}
          >
            <option value="customer">Customer</option>
            <option value="mechanic">Mechanic</option>
          </select>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default RegisterView