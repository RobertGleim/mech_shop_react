import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import './AdminView.css'

const AdminView = () => {
  const navigate = useNavigate()
  
  // Admin profile state
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Customers state
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

    if (!token) {
      setError('You must be logged in to view this page')
      setLoading(false)
      return
    }
    
    if (userType !== 'mechanic' && userType !== 'admin') {
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
    .catch(() => {
      setError('Failed to load admin profile')
      setLoading(false)
    })
  }, [navigate])

  // Fetch all customers from the API (admin-only)
  const fetchCustomers = () => {
    setCustomersLoading(true)
    setCustomersError('')
    const token = localStorage.getItem('token')
    
    let urlStr
    try {
      urlStr = apiUrl('/customers')
    } catch {
      urlStr = '/api/customers'
    }

    fetch(urlStr, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errorData => {
          throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
        })
      }
      return res.json()
    })
    .then(data => {
      setCustomers(data.customers || data || [])
      setCustomersLoading(false)
    })
    .catch(() => {
      setCustomersError('Failed to fetch customers')
      setCustomersLoading(false)
    })
  }

  // Delete a customer
  const deleteCustomer = (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    const token = localStorage.getItem('token')
    
    fetch(apiUrl(`/customers/${customerId}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete customer')
      return res.json()
    })
    .then(() => {
      setCustomers(customers.filter(c => c.id !== customerId))
    })
    .catch(err => {
      setCustomersError(`Failed to delete customer: ${err.message}`)
    })
  }

  // Start editing a customer
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

  // Update a customer
  const updateCustomer = () => {
    if (!editingCustomer) return
    
    setEditLoading(true)
    setEditError('')
    const token = localStorage.getItem('token')
    
    fetch(apiUrl(`/customers/${editingCustomer.id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update customer')
      return res.json()
    })
    .then(updatedCustomer => {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? updatedCustomer : c
      ))
      setEditingCustomer(null)
      setEditLoading(false)
    })
    .catch(err => {
      setEditError(`Failed to update customer: ${err.message}`)
      setEditLoading(false)
    })
  }

  if (loading) {
    return <div className="admin-view loading">Loading admin panel...</div>
  }

  if (error) {
    return <div className="admin-view error">Error: {error}</div>
  }

  return (
    <div className="admin-view">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-info">
          <h2>Welcome, {admin?.first_name} {admin?.last_name}</h2>
          <p>Email: {admin?.email}</p>
          <p>Phone: {admin?.phone || 'Not provided'}</p>
        </div>
      </div>

      <div className="admin-actions">
        <div className="section">
          <h3>Customer Management</h3>
          <button onClick={fetchCustomers} disabled={customersLoading}>
            {customersLoading ? 'Loading...' : 'Load Customers'}
          </button>
          
          {customersError && (
            <div className="error-message">{customersError}</div>
          )}
          
          {customers.length > 0 && (
            <div className="customers-list">
              <h4>All Customers ({customers.length})</h4>
              <div className="customers-grid">
                {customers.map(customer => (
                  <div key={customer.id} className="customer-card">
                    <div className="customer-info">
                      <h5>{customer.first_name} {customer.last_name}</h5>
                      <p>Email: {customer.email}</p>
                      <p>Phone: {customer.phone || 'N/A'}</p>
                      <p>Address: {customer.address || 'N/A'}</p>
                      <p>ID: {customer.id}</p>
                    </div>
                    <div className="customer-actions">
                      <button onClick={() => startEdit(customer)}>Edit</button>
                      <button 
                        onClick={() => deleteCustomer(customer.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Customer: {editingCustomer.first_name} {editingCustomer.last_name}</h3>
            
            {editError && <div className="error-message">{editError}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); updateCustomer(); }}>
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Address:</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={editLoading}>
                  {editLoading ? 'Updating...' : 'Update Customer'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingCustomer(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminView