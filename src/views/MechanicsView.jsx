import React, { useState, useEffect } from 'react'
import './MechanicsView.css'

function MechanicsView() {
  // Set up our navigation
  
  // All of our state variables
  const [mechanic, setMechanic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [salary, setSalary] = useState("")
  const [address, setAddress] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [showProfile, setShowProfile] = useState(true)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  // This runs when the page loads
  useEffect(() => {
    // Check if mechanic is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'mechanic') {
      setLoading(false)
      return
    }

    // Get mechanic info from the server
    fetch('https://mech-shop-api.onrender.com/mechanics/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        alert('Could not get your profile!')
        throw new Error('Failed to fetch mechanic data')
      }
      return response.json()
    })
    .then(data => {
      console.log("Got mechanic data:", data);
      
      // Save the data we got
      setMechanic(data)
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setEmail(data.email)
      setSalary(data.salary)
      setAddress(data.address)
      setLoading(false)
      
      // Now get the jobs too
      getJobs(token);
    })
    .catch(error => {
      console.log('Error getting mechanic data:', error)
      setLoading(false)
    })
  }, []) // Empty array means this only runs once when the page loads
  
  // Function to get assigned jobs
  function getJobs(token) {
    setJobsLoading(true);
    
    fetch('https://mech-shop-api.onrender.com/mechanics/jobs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        alert('Could not get your jobs!')
        throw new Error('Failed to fetch assigned jobs')
      }
      return response.json()
    })
    .then(data => {
      console.log("Got jobs:", data);
      // Save the jobs we got
      setJobs(data.jobs || []);
      setJobsLoading(false);
    })
    .catch(error => {
      console.log('Error getting jobs:', error);
      setJobsLoading(false);
    });
  }

  // Function to handle saving profile changes
  function handleSaveProfile(e) {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess(false)
    
    // Make sure all fields have values
    if (!firstName || !lastName || !address) {
      setUpdateError('Please fill out all required fields')
      return
    }

    const token = localStorage.getItem('token')
    
    // Send the updated info to the server
    fetch('https://mech-shop-api.onrender.com/mechanics/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        address: address
      })
    })
    .then(response => {
      if (!response.ok) {
        alert('Could not update your profile!')
        throw new Error('Failed to update profile')
      }
      return response.json()
    })
    .then(data => {
      console.log("Profile updated:", data);
      
      // Update our local data
      setMechanic({
        ...mechanic,
        first_name: firstName,
        last_name: lastName,
        address: address
      })
      
      // Show success message and exit edit mode
      setUpdateSuccess(true)
      setEditMode(false)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    })
    .catch(error => {
      console.log('Error updating profile:', error)
      setUpdateError('Could not save your profile. Please try again.')
    })
  }

  // Function to update job status
  function updateJobStatus(jobId, newStatus) {
    const token = localStorage.getItem('token');
    
    fetch(`https://mech-shop-api.onrender.com/mechanics/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
      if (!response.ok) {
        alert('Could not update job status!')
        throw new Error('Failed to update job status')
      }
      return response.json()
    })
    .then(data => {
      console.log("Job status updated:", data);
      
      // Update job in our list
      let newJobs = [...jobs];
      for (let i = 0; i < newJobs.length; i++) {
        if (newJobs[i].id === jobId) {
          newJobs[i].status = newStatus;
          break;
        }
      }
      setJobs(newJobs);
      
      alert(`Job status updated to ${newStatus}!`);
    })
    .catch(error => {
      console.log('Error updating job status:', error);
      alert('Could not update job status. Please try again.');
    });
  }

  // Show loading message while waiting
  if (loading) {
    return <div className="mechanic-container">Loading...</div>
  }

  // Show login message if not logged in
  if (!mechanic) {
    return <div className="mechanic-container">Please log in first as a mechanic</div>
  }

  return (
    <div className="mechanic-container">
      <div className="mechanic-wrapper">
        <h1>Welcome {mechanic.first_name}!</h1>
        <h2>Mechanic Dashboard</h2>

        {/* Success message */}
        {updateSuccess && (
          <div className="success-message">
            Your information has been updated successfully!
          </div>
        )}

        {/* Tab buttons */}
        <div className="tab-navigation">
          <button 
            className={showProfile ? "tab-button active" : "tab-button"}
            onClick={() => setShowProfile(true)}
          >
            Profile
          </button>
          <button 
            className={!showProfile ? "tab-button active" : "tab-button"}
            onClick={() => setShowProfile(false)}
          >
            My Jobs
          </button>
        </div>

        {/* Profile tab */}
        {showProfile && (
          <div className="mechanic-card">
            <h3>Mechanic Information</h3>
            
            {!editMode ? (
              // Show profile info
              <>
                <div className="info-section">
                  <p><strong>Name:</strong> {mechanic.first_name} {mechanic.last_name}</p>
                  <p><strong>Email:</strong> {mechanic.email}</p>
                  <p><strong>Salary:</strong> ${mechanic.salary}</p>
                  <p><strong>Address:</strong> {mechanic.address}</p>
                </div>

                <div className="buttons-section">
                  <button 
                    className="mechanic-btn edit-btn" 
                    onClick={() => setEditMode(true)}
                  >
                    Update Profile
                  </button>
                </div>
              </>
            ) : (
              // Show edit form
              <form onSubmit={handleSaveProfile} className="update-form">
                {updateError && <div className="error-message">{updateError}</div>}
                
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email"
                    value={email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>
                
                <div className="form-group">
                  <label>Salary</label>
                  <input 
                    type="text"
                    value={salary}
                    disabled
                    className="disabled-input"
                  />
                  <small>Salary is set by management</small>
                </div>
                
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-buttons">
                  <button type="submit" className="mechanic-btn save-btn">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="mechanic-btn cancel-btn"
                    onClick={() => {
                      setEditMode(false);
                      setFirstName(mechanic.first_name);
                      setLastName(mechanic.last_name);
                      setAddress(mechanic.address);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Jobs tab */}
        {!showProfile && (
          <div className="mechanic-card">
            <h3>Your Assigned Jobs</h3>
            
            {jobsLoading ? (
              <div className="loading-jobs">Loading your jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="no-jobs">You don't have any jobs assigned right now.</div>
            ) : (
              <div className="jobs-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-item">
                    <div className="job-header">
                      <h4>Job #{job.id}</h4>
                      <span className="job-status">
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="job-details">
                      <p><strong>Customer:</strong> {job.customer_name}</p>
                      <p><strong>Vehicle:</strong> {job.vehicle}</p>
                      <p><strong>Service:</strong> {job.service_type}</p>
                      <p><strong>Description:</strong> {job.description}</p>
                      <p><strong>Date:</strong> {new Date(job.scheduled_date).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="job-actions">
                      {job.status === 'PENDING' && (
                        <button 
                          className="job-btn start-btn"
                          onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                        >
                          Start Job
                        </button>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && (
                        <button 
                          className="job-btn complete-btn"
                          onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                        >
                          Complete Job
                        </button>
                      )}
                      
                      {job.status === 'COMPLETED' && (
                        <div className="job-completed-message">
                          Job completed!
                        </div>
                      )}
                    </div>
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