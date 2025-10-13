import React, { useState } from 'react'
import './RegisterView.css'
import { apiUrl } from '../lib/api'

function RegisterView() {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'customer',
    salary: '',
    address: ''
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
      const endpoint = formData.userType === 'customer'
        ? apiUrl('/customers')
        : apiUrl('/mechanics')

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password
      }

      // Include mechanic-specific required fields
      if (formData.userType === 'mechanic') {
        payload.salary = parseFloat(formData.salary) || 0
        payload.address = formData.address
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      // Many backends return the created resource or a 201 status. Treat non-2xx as failure.
      if (response.status === 201 || data.id) {
        setMessage('Registration successful! Please login.')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          userType: 'customer',
          salary: '',
          address: ''
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

        {formData.userType === 'mechanic' && (
          <>
            <div className="form-group">
              <label htmlFor="salary">Salary</label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        )}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default RegisterView