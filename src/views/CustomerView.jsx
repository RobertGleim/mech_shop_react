import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom' // Add this import
import './CustomerView.css'
import { apiUrl } from '../lib/api'

function CustomerView() {
  const navigate = useNavigate(); // Add this hook
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [updatedInfo, setUpdatedInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  })
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'customer') {
      setLoading(false)
      return
    }

    // Fetch customer data from API
  fetch(apiUrl('/customers/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch customer data')
      }
      return response.json()
    })
    .then(data => {

      setCustomer({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        address: data.address
      })
      setUpdatedInfo({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        address: data.address
      })
      setLoading(false)
    })
    .catch(() => {

      setLoading(false)
    })
  }, [])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setUpdatedInfo({
      ...updatedInfo,
      [name]: value
    })
  }

  // Handle update form submission
  const handleUpdate = (e) => {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess(false)
    
    // Simple validation
    if (!updatedInfo.firstName || !updatedInfo.lastName || !updatedInfo.phone || !updatedInfo.address) {
      setUpdateError('All fields except email are required')
      return
    }

    // Check if customer ID is available
    if (!customer?.id) {
      setUpdateError('Customer ID not found. Please refresh the page and try again.')
      return
    }

    const token = localStorage.getItem('token')
    
    const updateData = {
      first_name: updatedInfo.firstName,
      last_name: updatedInfo.lastName,
      email: updatedInfo.email,
      phone: updatedInfo.phone,
      address: updatedInfo.address,
      // Temporary: backend might require password field
      password: 'dummy_password_not_used'
    }
    

    
  // Send update request to API
  fetch(apiUrl('/customers/'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        
        // Handle validation errors from marshmallow
        let errorMessage = 'Failed to update profile'
        if (errorData.Message && typeof errorData.Message === 'object') {
          // Convert validation errors to readable format
          const validationErrors = Object.entries(errorData.Message)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ')
          errorMessage = `Validation errors: ${validationErrors}`
        } else if (errorData.message || errorData.Message) {
          errorMessage = errorData.message || errorData.Message
        }
        
        throw new Error(errorMessage)
      }
      return response.json()
    })
    .then(() => {

      // Update the customer object with new values
      setCustomer({
        ...customer,
        firstName: updatedInfo.firstName,
        lastName: updatedInfo.lastName,
        phone: updatedInfo.phone,
        address: updatedInfo.address
      })
      
      setUpdateSuccess(true)
      setEditMode(false)
    })
    .catch(error => {

      setUpdateError(error.message || 'Failed to update profile. Please try again.')
    })
  }

  // Cancel edit mode
  const handleCancel = () => {
    setEditMode(false)
    setUpdatedInfo({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    }) // Reset form to current values
    setUpdateError('')
  }

  // Function to handle scheduling service
  const handleScheduleService = () => {
    navigate('/contact', { 
      state: { 
        customerData: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          isLoggedInCustomer: true
        } 
      }
    });
  }

  if (loading) {
    return <div className="customer-container">Loading...</div>
  }

  if (!customer) {
    return <div className="customer-container">Please log in first</div>
  }

  return (
    <div className="customer-container">
      <div className="customer-wrapper">
        <h1>Welcome {customer.firstName}!</h1>
        <h2>Your Profile</h2>

        {updateSuccess && (
          <div className="success-message">
            Your information has been updated successfully!
          </div>
        )}

        <div className="customer-card">
          <h3>Customer Information</h3>
          
          {!editMode ? (
            // View Mode
            <>
              <div className="info-section">
                <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                <p><strong>Address:</strong> {customer.address}</p>
              </div>

              <div className="buttons-section">
                <button 
                  className="customer-btn edit-btn" 
                  onClick={() => setEditMode(true)}
                >
                  Update Profile
                </button>
                <button 
                  className="customer-btn"
                  onClick={handleScheduleService}
                >
                  Schedule Service
                </button>
                <button className="customer-btn">View History</button>
              </div>
            </>
          ) : (
            // Edit Mode
            <form onSubmit={handleUpdate} className="update-form">
              {updateError && <div className="error-message">{updateError}</div>}
              
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text"
                  name="firstName"
                  value={updatedInfo.firstName || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text"
                  name="lastName"
                  value={updatedInfo.lastName || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email"
                  name="email"
                  value={updatedInfo.email || ''}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="tel"
                  name="phone"
                  value={updatedInfo.phone || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text"
                  name="address"
                  value={updatedInfo.address || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="customer-btn save-btn">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="customer-btn cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerView