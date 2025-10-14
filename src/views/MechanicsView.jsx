import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MechanicsView.css'
import { apiUrl } from '../lib/api'

function MechanicsView() {
  // Set up our navigation
  const navigate = useNavigate()
  
  // All of our state variables
  const [mechanic, setMechanic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(true)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  // This runs when the page loads
  useEffect(() => {
    // Check if mechanic is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    console.log('MechanicsView - checking authentication:', { hasToken: !!token, userType })

    if (!token || userType !== 'mechanic') {
      console.log('No token or not a mechanic, redirecting to login')
      navigate('/login')
      setLoading(false)
      return
    }

    // Get mechanic info from the server
    fetch(apiUrl('/mechanics/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired - redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('userType')
          localStorage.removeItem('isAdmin')
          navigate('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      console.log('Mechanic profile loaded:', data)
      setMechanic(data)
      setLoading(false)
    })
    .catch(error => {
      console.error('Error getting mechanic info:', error)
      setLoading(false)
      // If there's an authentication error, redirect to login
      if (error.message.includes('401')) {
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        localStorage.removeItem('isAdmin')
        navigate('/login')
      }
    })
  }, [navigate])

  // Profile is read-only for mechanics - updates handled by administration

  // Function to load jobs for this mechanic
  const loadJobs = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      navigate('/login')
      return
    }

    setJobsLoading(true)
    try {
      console.log('Loading jobs for mechanic:', mechanic.id)
      
      const response = await fetch(apiUrl(`/mechanics/${mechanic.id}/jobs`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('userType')
          localStorage.removeItem('isAdmin')
          navigate('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const jobsData = await response.json()
      console.log('Jobs loaded:', jobsData)
      setJobs(jobsData)
      
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  // Function to log out
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('isAdmin')
    
    // Dispatch event to update navbar
    window.dispatchEvent(new Event('login-status-change'))
    
    navigate('/login')
  }

  // Show loading message while waiting
  if (loading) {
    return <div className="mechanic-container">Loading...</div>
  }

  // Show login message if not logged in
  if (!mechanic) {
    return (
      <div className="mechanic-container">
        <div className="mechanic-wrapper">
          <h2>Please log in as a mechanic to view this page</h2>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mechanic-container">
      <div className="mechanic-wrapper">
        <h1>Welcome {mechanic.first_name}!</h1>
        <h2>Mechanic Dashboard</h2>
        
        <div className="mechanic-navigation">
          <button 
            className={showProfile ? 'active' : ''}
            onClick={() => setShowProfile(true)}
          >
            My Profile
          </button>
          <button 
            className={!showProfile ? 'active' : ''}
            onClick={() => {
              setShowProfile(false)
              if (jobs.length === 0) {
                loadJobs()
              }
            }}
          >
            My Jobs
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {showProfile ? (
          <div className="profile-section">
            <h3>Profile Information</h3>
            
            <div className="profile-display">
              <div className="form-group">
                <label><strong>First Name:</strong></label>
                <span>{mechanic.first_name}</span>
              </div>
              
              <div className="form-group">
                <label><strong>Last Name:</strong></label>
                <span>{mechanic.last_name}</span>
              </div>
              
              <div className="form-group">
                <label><strong>Email:</strong></label>
                <span>{mechanic.email}</span>
              </div>
              
              <div className="form-group">
                <label><strong>Salary:</strong></label>
                <span>${mechanic.salary}</span>
              </div>
              
              <div className="form-group">
                <label><strong>Address:</strong></label>
                <span>{mechanic.address || "Not provided"}</span>
              </div>
              
              <div className="profile-info-note" style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #e9ecef'}}>
                <p style={{color: '#2196F3', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '16px'}}>
                  📝 Profile Information is Read-Only
                </p>
                <small style={{color: '#666', fontStyle: 'italic', lineHeight: '1.5', display: 'block'}}>
                  For security reasons, profile updates are managed by administration. 
                  If you need to change your personal information, please contact your manager 
                  or HR department.
                </small>
              </div>
            </div>
          </div>
        ) : (
          <div className="jobs-section">
            <h3>My Assigned Jobs</h3>
            
            {jobsLoading ? (
              <div>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div>No jobs assigned yet.</div>
            ) : (
              <div className="jobs-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-card">
                    <h4>Job #{job.id}</h4>
                    <p><strong>Customer:</strong> {job.customer_name}</p>
                    <p><strong>Description:</strong> {job.description}</p>
                    <p><strong>Status:</strong> {job.status}</p>
                    <p><strong>Created:</strong> {new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MechanicsView