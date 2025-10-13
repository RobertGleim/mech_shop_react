import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminView.css'
import { apiUrl } from '../lib/api'

function AdminView() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState('')
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'mechanic') {
      setError('You must be logged in as an admin mechanic to view this page')
      setLoading(false)
      return
    }

  fetch(apiUrl('/mechanics/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch admin profile')
      return res.json()
    })
    .then(data => {
      const isAdmin = data?.is_admin || data?.isAdmin || false
      if (!isAdmin) {
        navigate('/')
        return
      }
      setAdmin(data)
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setError('Failed to load admin profile')
      setLoading(false)
    })
  }, [navigate])

  // Fetch all customers from the API (admin-only)
  const fetchCustomers = () => {
    setCustomersLoading(true)
    setCustomersError('')
    const token = localStorage.getItem('token')
    // include pagination if desired (defaults used here)
    let urlStr = apiUrl('/customers')
    try {
      const url = new URL(urlStr, window.location.origin)
      url.searchParams.set('page', 1)
      url.searchParams.set('per_page', 50)
      urlStr = url.toString()
    } catch (err) {
      console.warn('Could not build absolute URL for customers, falling back to relative URL. Error:', err)
      const params = new URLSearchParams({ page: 1, per_page: 50 })
      urlStr += (urlStr.includes('?') ? '&' : '?') + params.toString()
    }

    fetch(urlStr, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch customers')
      }
      return res.json()
    })
    .then(data => {
      // Swagger indicates GET /customers returns a list
      // Some backends return { customers: [...] } with pagination
      const list = Array.isArray(data) ? data : (data.customers || data.items || [])
      setCustomers(list)
      setCustomersLoading(false)
    })
    .catch(err => {
      console.error('Error fetching customers:', err)
      setCustomersError('Unable to load customers')
      setCustomersLoading(false)
    })
  }

  const startEdit = (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || '',
      address: customer.address || ''
    })
    setEditError('')
  }

  // Delete a customer (admin)
  const handleDeleteCustomer = (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return
    const token = localStorage.getItem('token')
  fetch(apiUrl(`/customers/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete customer')
      // Remove from UI
      setCustomers(prev => prev.filter(c => c.id !== id))
    })
    .catch(err => {
      console.error('Delete customer error:', err)
      setCustomersError('Could not delete customer')
    })
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    const token = localStorage.getItem('token')
    const payload = { ...editForm, id: editingCustomer.id }

  fetch(apiUrl(`/customers/${editingCustomer.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editForm)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update customer')
      return res.json()
    })
    .then(() => {
      // Update customer in local list (backend might return updated object)
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? ({ ...c, ...payload }) : c))
      setEditingCustomer(null)
      setEditLoading(false)
    })
    .catch(err => {
      console.error('Update customer error:', err)
      setEditError('Could not update customer')
      setEditLoading(false)
    })
  }

  if (loading) return <div className="admin-container">Loading...</div>
  if (error) return <div className="admin-container error">{error}</div>

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        <h1>Admin Dashboard</h1>
        <h3>Welcome, {admin.first_name} {admin.last_name}</h3>

        <div className="admin-cards">
          <div className="admin-card">
            <h4>Customers</h4>
            <p>View and manage all customers</p>
            <button onClick={() => fetchCustomers()}>Manage</button>
          </div>

          <div className="admin-card">
            <h4>Mechanics</h4>
            <p>View and manage mechanics</p>
            <button onClick={() => navigate('/mechanics')}>Manage</button>
          </div>

          <div className="admin-card">
            <h4>Service Tickets</h4>
            <p>View and manage service tickets</p>
            <button onClick={() => navigate('/service_ticket')}>Manage</button>
          </div>
        </div>
        {customersLoading && (
          <div className="admin-loading">Loading customers...</div>
        )}

        {customersError && (
          <div className="admin-error">{customersError}</div>
        )}

        {customers.length > 0 && (
          <div className="customers-list">
            <h3>Customers ({customers.length})</h3>
            <div className="customers-grid">
              {customers.map(c => (
                <div className="customer-card" key={c.id}>
                  <div className="customer-info">
                    <p className="customer-name">{c.first_name} {c.last_name}</p>
                    <p className="customer-email">{c.email}</p>
                    <p className="customer-phone">{c.phone || '-'}</p>
                    <p className="customer-address">{c.address || '-'}</p>
                  </div>
                  <div className="customer-actions">
                    <button className="btn" onClick={() => startEdit(c)}>Update</button>
                    <button className="btn delete" onClick={() => handleDeleteCustomer(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit form */}
            {editingCustomer && (
              <div className="edit-panel">
                <h4>Update Customer: {editingCustomer.first_name} {editingCustomer.last_name}</h4>
                {editError && <div className="admin-error">{editError}</div>}
                <form onSubmit={(e) => handleSaveEdit(e)} className="edit-form">
                  <div className="form-row">
                    <label>First Name</label>
                    <input value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <label>Last Name</label>
                    <input value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <label>Phone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                  <div className="form-row">
                    <label>Address</label>
                    <input value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn save" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                    <button type="button" className="btn cancel" onClick={() => { setEditingCustomer(null); setEditError('') }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminView
