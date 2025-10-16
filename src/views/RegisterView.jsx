import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegisterView.css'
import { apiUrl } from '../lib/api'

export default function RegisterView() {
	const navigate = useNavigate()
	const [form, setForm] = useState({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		phone: '',
		address: ''
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const handleChange = (e) => {
		const { name, value } = e.target
		setForm((f) => ({ ...f, [name]: value }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			const resp = await fetch(apiUrl('/customers/'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			})
			if (!resp.ok) {
				const body = await resp.json().catch(() => null)
				setError((body && (body.message || JSON.stringify(body))) || `Failed (${resp.status})`)
				return
			}
			setSuccess(true)
			setTimeout(() => navigate('/login'), 1200)
		} catch (err) {
			setError(err?.message || 'Network error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="contact-container">
			<div className="contact-wrapper">
				<div className="contact-card">
					<h3>Create an Account</h3>

					{success ? (
						<div className="success-message">Account created. Redirecting to login...</div>
					) : (
						<form onSubmit={handleSubmit}>
							{error && <div className="error-message">{error}</div>}

							<input name="first_name" placeholder="First name" value={form.first_name} onChange={handleChange} required />
							<input name="last_name" placeholder="Last name" value={form.last_name} onChange={handleChange} required />
							<input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
							<input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
							<input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} />
							<input name="address" placeholder="Address (optional)" value={form.address} onChange={handleChange} />

							<button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
						</form>
					)}
				</div>
			</div>
		</div>
	)
}