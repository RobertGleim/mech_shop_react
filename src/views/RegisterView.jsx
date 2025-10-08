import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './RegisterView.css'

function RegisterView() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [salary, setSalary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userType, setUserType] = useState('customer')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      address: address,
      password: password
    }

    // Add fields based on user type
    if (userType === 'customer') {
      userData.phone = phone
    } else {
      userData.salary = parseFloat(salary)
    }

    const endpoint = userType === 'customer' 
      ? 'https://mech-shop-api.onrender.com/api/customers'
      : 'https://mech-shop-api.onrender.com/api/mechanics'

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.message || data.id) {
        setSuccess('Account created! You can now login.')
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setAddress('')
        setPassword('')
        setSalary('')
      } else {
        setError('Registration failed')
      }
      setLoading(false)
    })
    .catch(() => {
      setError('Connection error')
      setLoading(false)
    })
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-header">
            <h1>Create Account</h1>
            <h2>Join Cool X3 Mechanics today</h2>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
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

            {userType === 'customer' && (
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
            )}

            {userType === 'mechanic' && (
              <div className="form-group">
                <label>Salary</label>
                <input
                  type="number"
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder="Annual salary"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Address"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? 'Creating...' : `Create ${userType === 'customer' ? 'Customer' : 'Mechanic'} Account`}
            </button>
          </form>

          <div className="register-footer">
            <p>Have an account? <NavLink to="/login">Sign in</NavLink></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterView