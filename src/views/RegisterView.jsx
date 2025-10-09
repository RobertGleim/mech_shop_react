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
  const [checkingEmail, setCheckingEmail] = useState(false)

  // Check if email exists before form submission
  const checkEmail = async () => {
    if (!email || checkingEmail) return;
    
    setCheckingEmail(true);
    
    try {
      // Try to login with the email to see if it exists
      // This is a workaround since there's no dedicated "check email" endpoint
      const response = await fetch(`https://mech-shop-api.onrender.com/customers/email-check/${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.exists) {
        setError(`Email ${email} is already registered. Please use a different email or login.`);
        return true;
      }
      return false;
    } catch {
      // If the endpoint doesn't exist, we'll continue with registration
      console.log("Email check failed, continuing with registration");
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  // Add email validation on blur
  const handleEmailBlur = async () => {
    if (email) {
      await checkEmail();
    }
  };

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // First check if email exists
    const emailExists = await checkEmail();
    if (emailExists) {
      setLoading(false);
      return;
    }

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      address: address,
      password: password
    }

    if (userType === 'customer') {
      userData.phone = phone
    } else {
      userData.salary = parseFloat(salary)
    }

    const endpoint = userType === 'customer' 
      ? 'https://mech-shop-api.onrender.com/customers'
      : 'https://mech-shop-api.onrender.com/mechanics'

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    .then(response => {
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 409 || response.status === 500) {
          // 409 Conflict or 500 with existing email
          throw new Error(`Email ${email} is already registered. Please use a different email or login.`);
        }
        
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Registration failed');
        }).catch(err => {
          if (err.message.includes('JSON')) {
            throw new Error(`Server error: ${response.statusText}`);
          }
          throw err;
        });
      }
      return response.json();
    })
    .then(() => {
      setSuccess('Account created! You can now login.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
      setSalary('');
      setLoading(false);
    })
    .catch(error => {
      console.error('Registration error:', error);
      
      // Check if error message contains hints about duplicate email
      if (error.message.toLowerCase().includes('email') || 
          error.message.toLowerCase().includes('exists') ||
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('already')) {
        setError(`This email address is already registered. Please use a different email or login.`);
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
      
      setLoading(false);
    });
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
                onBlur={handleEmailBlur}
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

            <button 
              type="submit" 
              className="register-btn" 
              disabled={loading || checkingEmail}
            >
              {loading ? 'Creating...' : 
               checkingEmail ? 'Checking email...' :
               `Create ${userType === 'customer' ? 'Customer' : 'Mechanic'} Account`}
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