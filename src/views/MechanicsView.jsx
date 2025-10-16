import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MechanicsView.css'
import { apiUrl } from '../lib/api'

export default function MechanicsView() {
	const navigate = useNavigate()
	const [mechanic, setMechanic] = useState(null)
	const [loading, setLoading] = useState(true)
	const [showProfile, setShowProfile] = useState(true)
	const [jobs, setJobs] = useState([])
	const [jobsLoading, setJobsLoading] = useState(false)

	useEffect(() => {
		const init = async () => {
			const token = localStorage.getItem('token')
			const userType = localStorage.getItem('userType')
			if (!token || userType !== 'mechanic') {
				navigate('/login')
				setLoading(false)
				return
			}

			try {
				const resp = await fetch(apiUrl('/mechanics/profile'), {
					headers: { Authorization: `Bearer ${token}` }
				})
				if (resp.status === 401) {
					localStorage.removeItem('token')
					localStorage.removeItem('userType')
					localStorage.removeItem('isAdmin')
					navigate('/login')
					return
				}
				if (!resp.ok) throw new Error(`Failed (${resp.status})`)
				const data = await resp.json()
				setMechanic(data)
			} catch {
				localStorage.removeItem('token')
				localStorage.removeItem('userType')
				localStorage.removeItem('isAdmin')
				navigate('/login')
			} finally {
				setLoading(false)
			}
		}
		init()
	}, [navigate])

	const loadJobs = async () => {
		const token = localStorage.getItem('token')
		if (!token || !mechanic?.id) {
			navigate('/login')
			return
		}
		setJobsLoading(true)
		try {
			const resp = await fetch(apiUrl(`/mechanics/${mechanic.id}/jobs`), {
				headers: { Authorization: `Bearer ${token}` }
			})
			if (resp.status === 401) {
				localStorage.removeItem('token')
				localStorage.removeItem('userType')
				localStorage.removeItem('isAdmin')
				navigate('/login')
				return
			}
			if (!resp.ok) throw new Error(`Failed (${resp.status})`)
			const data = await resp.json()
			setJobs(data)
		} catch {
			// keep lightweight: errors are ignored here
		} finally {
			setJobsLoading(false)
		}
	}

	const handleLogout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('userType')
		localStorage.removeItem('isAdmin')
		window.dispatchEvent(new Event('login-status-change'))
		navigate('/login')
	}

	if (loading) return <div className="mechanic-container">Loading...</div>

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
				<div className="mechanic-navigation">
					<button className={showProfile ? 'active' : ''} onClick={() => setShowProfile(true)}>
						My Profile
					</button>
					<button
						className={!showProfile ? 'active' : ''}
						onClick={() => {
							setShowProfile(false)
							if (jobs.length === 0) loadJobs()
						}}
					>
						My Jobs
					</button>
					<button onClick={handleLogout} className="logout-btn">Logout</button>
				</div>

				{showProfile ? (
					<div className="profile-section">
						<h3>Profile</h3>
						<div className="profile-display">
							<div className="form-group">
								<label>First Name:</label>
								<span>{mechanic.first_name}</span>
							</div>
							<div className="form-group">
								<label>Last Name:</label>
								<span>{mechanic.last_name}</span>
							</div>
							<div className="form-group">
								<label>Email:</label>
								<span>{mechanic.email}</span>
							</div>
							<div className="form-group">
								<label>Salary:</label>
								<span>${mechanic.salary}</span>
							</div>
							<div className="form-group">
								<label>Address:</label>
								<span>{mechanic.address || 'Not provided'}</span>
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
								{jobs.map((job) => (
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