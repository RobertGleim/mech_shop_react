import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminView.css'

function AdminView() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const isFetchingRef = useRef(false)
  const fetchAbortRef = useRef(null)
  const navigatedRef = useRef(false)

  // Use dev proxy when in development; only call VITE_API_URL in production
  const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')
  const buildUrl = React.useCallback((path) => {
    if (!path.startsWith('/')) path = `/${path}`
    return apiBase ? `${apiBase.replace(/\/$/, '')}${path}` : `/api${path}`
  }, [apiBase])
  const credentialsMode = apiBase ? 'omit' : 'include'

  // Helper to read token from multiple possible places and keys
  const getAuthToken = () => {
    // Common keys to check
    const keys = ['token', 'access_token', 'authToken', 'Authorization']
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k)
        if (v) return v
      } catch { /* ignore */ }
      try {
        const v = sessionStorage.getItem(k)
        if (v) return v
      } catch { /* ignore */ }
    }

    // Try cookie named 'token' or 'authToken'
    const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:token|authToken)=([^;]+)/)
    if (cookieMatch) return decodeURIComponent(cookieMatch[1])

    // Try URL query param ?token=...
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const t = urlParams.get('token') || urlParams.get('access_token')
      if (t) return t
    } catch { /* ignore */ }

    return null
  }

  // Unified fetch wrapper: always set Authorization header; if calling external API (apiBase set),
  // also append ?token=... as fallback. If token missing, navigate to login and reject.
  const fetchWithAuth = React.useCallback(async (path, opts = {}) => {
    const token = getAuthToken()
    if (!token) {
      // navigate once and return rejected promise for callers to handle
      if (!navigatedRef.current) {
        navigatedRef.current = true
        navigate('/login')
      }
      return Promise.reject(new Error('Token is missing!'))
    }

    // Merge headers
    const headers = Object.assign({}, opts.headers || {}, {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    })

    // Build URL
    let url = buildUrl(path)

    // If calling external API (full URL), include token as query param as fallback
    if (apiBase) {
      try {
        const urlObj = new URL(url)
        if (!urlObj.searchParams.get('token')) {
          urlObj.searchParams.set('token', token)
          url = urlObj.toString()
        }
      } catch (e) {
        // If URL parsing fails, skip adding param
        console.debug('fetchWithAuth: could not append token param', e)
      }
    }

    const fetchOpts = Object.assign({}, opts, {
      headers,
      credentials: opts.credentials ?? credentialsMode,
      signal: opts.signal
    })

    console.debug('fetchWithAuth', { method: fetchOpts.method || 'GET', url, tokenTail: token ? token.slice(-8) : null, credentials: fetchOpts.credentials })

    return fetch(url, fetchOpts)
  }, [apiBase, credentialsMode, navigate, buildUrl])

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

  // Mechanics state
  const [mechanics, setMechanics] = useState([])
  const [mechanicsLoading, setMechanicsLoading] = useState(false)
  const [mechanicsError, setMechanicsError] = useState('')
  const [editingMechanic, setEditingMechanic] = useState(null)
  const [mechanicEditForm, setMechanicEditForm] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    salary: '', 
    address: '',
    is_admin: false 
  })
  const [mechanicEditLoading, setMechanicEditLoading] = useState(false)
  const [mechanicEditError, setMechanicEditError] = useState('')

  useEffect(() => {
    const token = getAuthToken()
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

    fetchWithAuth('/mechanics/profile')
    .then(async res => {
      if (!res.ok) {
        let errBody = null
        try { errBody = await res.json() } catch { try { errBody = await res.text() } catch { /* ignore error */ } }
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('userType')
          localStorage.removeItem('isAdmin')
          window.dispatchEvent(new Event('login-status-change'))
          navigate('/login')
          throw new Error(errBody?.message || 'Your session has expired. Please log in again.')
        }
        throw new Error(errBody?.message || `Failed to fetch admin profile: ${res.status} ${res.statusText}`)
      }
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
    .catch((err) => {
      console.error('Admin profile fetch error:', err)
      setError(err.message || 'Failed to load admin profile')
      setLoading(false)
    })
  }, [navigate, fetchWithAuth])

  // Fetch all customers from the API (admin-only)
  const fetchCustomers = () => {
    setCustomersLoading(true)
    setCustomersError('')

    const token = getAuthToken()
    if (!token) {
      setCustomersLoading(false)
      setCustomersError('Not authenticated. Please login.')
      if (!navigatedRef.current) {
        navigatedRef.current = true
        navigate('/login')
      }
      return
    }

    fetchWithAuth('/customers')
    .then(async res => {
      if (!res.ok) {
        let errBody = null
        try { errBody = await res.json() } catch { try { errBody = await res.text() } catch { /* ignore error */ } }
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('userType')
          localStorage.removeItem('isAdmin')
          window.dispatchEvent(new Event('login-status-change'))
          if (!navigatedRef.current) {
            navigatedRef.current = true
            navigate('/login')
          }
          throw new Error(errBody?.message || 'Session expired. Please log in again.')
        }
        throw new Error(errBody?.message || `HTTP ${res.status}: ${res.statusText}`)
      }
      return res.json()
    })
    .then(data => {
      setCustomers(data.customers || data || [])
      setCustomersLoading(false)
    })
    .catch((err) => {
      console.error('Customers fetch error:', err)
      setCustomersError(err.message || 'Failed to fetch customers')
      setCustomersLoading(false)
    })
  }

  // Delete a customer
  const deleteCustomer = (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    const token = getAuthToken()
    if (!token) {
      setCustomersError('Not authenticated. Please login.')
      return
    }

    fetchWithAuth(`/customers/${customerId}`, { method: 'DELETE' })
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

    const token = getAuthToken()
    if (!token) {
      setEditError('Not authenticated. Please login.')
      setEditLoading(false)
      return
    }

    fetchWithAuth(`/customers/${editingCustomer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

  const fetchMechanics = React.useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setMechanicsLoading(true)

    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort() } catch { /* ignore */ }
    }
    const abortController = new AbortController()
    fetchAbortRef.current = abortController

    try {
      const token = getAuthToken()
      if (!token) {
        setErrorMessage('Not authenticated. Please login as an admin.')
        if (!navigatedRef.current) {
          navigatedRef.current = true
          navigate('/login')
        }
        return
      }

      const resp = await fetchWithAuth('/mechanics', { signal: abortController.signal })

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          localStorage.removeItem('token')
          const msg = 'Your admin session has expired or you are not authorized. Please login again with an admin account.'
          console.warn('Mechanics fetch auth error:', resp.status, msg)
          setErrorMessage(msg)
          if (!navigatedRef.current) {
            navigatedRef.current = true
            navigate('/login')
          }
          return
        }

        const text = await resp.text().catch(() => resp.statusText || 'Unknown error')
        throw new Error(text || `Request failed with status ${resp.status}`)
      }

      const data = await resp.json()
      setMechanics(data || [])
      setMechanicsLoading(false)
    } catch (err) {
      if (err.name === 'AbortError') {
        console.debug('Mechanics fetch aborted')
      } else {
        console.error('Mechanics fetch error:', err)
        if (!errorMessage) setErrorMessage(err.message || 'Failed to load mechanics.')
      }
    } finally {
      isFetchingRef.current = false
      fetchAbortRef.current = null
      setMechanicsLoading(false)
    }
  }, [errorMessage, navigate, fetchWithAuth])

  // Delete a mechanic
  const deleteMechanic = (mechanicId) => {
    if (!confirm('Are you sure you want to delete this mechanic?')) return

    fetchWithAuth(`/mechanics/${mechanicId}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) {
        // If path-based delete fails, try body-based delete as fallback
        return fetchWithAuth('/mechanics', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: mechanicId })
        })
      }
      return res
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete mechanic')
      return res.json()
    })
    .then(() => {
      setMechanics(mechanics.filter(m => m.id !== mechanicId))
    })
    .catch(err => {
      setMechanicsError(`Failed to delete mechanic: ${err.message}`)
    })
  }

  // Start editing a mechanic
  const startMechanicEdit = (mechanic) => {
    setEditingMechanic(mechanic)
    setMechanicEditForm({
      first_name: mechanic.first_name || '',
      last_name: mechanic.last_name || '',
      email: mechanic.email || '',
      salary: mechanic.salary || '',
      address: mechanic.address || '',
      is_admin: mechanic.is_admin || false
    })
    setMechanicEditError('')
  }

  // Update a mechanic
  const updateMechanic = () => {
    if (!editingMechanic) return
    
    setMechanicEditLoading(true)
    setMechanicEditError('')

    const updateData = { ...mechanicEditForm, id: editingMechanic.id }

    fetchWithAuth(`/mechanics/${editingMechanic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mechanicEditForm)
    })
    .then(res => {
      if (!res.ok && res.status === 404) {
        // If path-based update fails, try body-based update as fallback
        return fetchWithAuth('/mechanics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
      }
      return res
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update mechanic')
      return res.json()
    })
    .then(updatedMechanic => {
      setMechanics(mechanics.map(m => 
        m.id === editingMechanic.id ? updatedMechanic : m
      ))
      setEditingMechanic(null)
      setMechanicEditLoading(false)
    })
    .catch(err => {
      setMechanicEditError(`Failed to update mechanic: ${err.message}`)
      setMechanicEditLoading(false)
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

        <div className="section">
          <h3>Mechanics Management</h3>
          <button onClick={fetchMechanics} disabled={mechanicsLoading}>
            {mechanicsLoading ? 'Loading...' : 'Load Mechanics'}
          </button>
          
          {mechanicsError && (
            <div className="error-message">{mechanicsError}</div>
          )}
          
          {mechanics.length > 0 && (
            <div className="mechanics-list">
              <h4>All Mechanics ({mechanics.length})</h4>
              <div className="mechanics-grid">
                {mechanics.map(mechanic => (
                  <div key={mechanic.id} className="mechanic-card">
                    <div className="mechanic-info">
                      <h5>{mechanic.first_name} {mechanic.last_name}</h5>
                      <p>Email: {mechanic.email}</p>
                      <p>Salary: ${mechanic.salary?.toLocaleString() || 'N/A'}</p>
                      <p>Address: {mechanic.address || 'N/A'}</p>
                      <p>Admin: {mechanic.is_admin ? 'Yes' : 'No'}</p>
                      <p>ID: {mechanic.id}</p>
                    </div>
                    <div className="mechanic-actions">
                      <button onClick={() => startMechanicEdit(mechanic)}>Edit</button>
                      <button 
                        onClick={() => deleteMechanic(mechanic.id)}
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

      {/* Edit Mechanic Modal */}
      {editingMechanic && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Mechanic: {editingMechanic.first_name} {editingMechanic.last_name}</h3>
            
            {mechanicEditError && <div className="error-message">{mechanicEditError}</div>}
            
            <form onSubmit={(e) => { e.preventDefault(); updateMechanic(); }}>
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  value={mechanicEditForm.first_name}
                  onChange={(e) => setMechanicEditForm({...mechanicEditForm, first_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  value={mechanicEditForm.last_name}
                  onChange={(e) => setMechanicEditForm({...mechanicEditForm, last_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={mechanicEditForm.email}
                  onChange={(e) => setMechanicEditForm({...mechanicEditForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Salary:</label>
                <input
                  type="number"
                  step="0.01"
                  value={mechanicEditForm.salary}
                  onChange={(e) => setMechanicEditForm({...mechanicEditForm, salary: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address:</label>
                <textarea
                  value={mechanicEditForm.address}
                  onChange={(e) => setMechanicEditForm({...mechanicEditForm, address: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={mechanicEditForm.is_admin}
                    onChange={(e) => setMechanicEditForm({...mechanicEditForm, is_admin: e.target.checked})}
                  />
                  Admin Privileges
                </label>
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={mechanicEditLoading}>
                  {mechanicEditLoading ? 'Updating...' : 'Update Mechanic'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingMechanic(null)}
                  disabled={mechanicEditLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="error">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default AdminView