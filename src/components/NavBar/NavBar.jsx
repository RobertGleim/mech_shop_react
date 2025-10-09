import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import './NavBar.css'
import logo from '../../assets/logo.png' // Adjust path if needed

function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState(null)
  
  // Check login status when component mounts and when localStorage changes
  useEffect(() => {
    // Function to check login status
    function checkLoginStatus() {
      const token = localStorage.getItem('token')
      const type = localStorage.getItem('userType')
      setIsLoggedIn(!!token) // Convert to boolean
      setUserType(type)
    }
    
    // Check immediately on mount
    checkLoginStatus()
    
    // Create a custom event listener for login status changes
    window.addEventListener('storage', checkLoginStatus)
    window.addEventListener('login-status-change', checkLoginStatus)
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus)
      window.removeEventListener('login-status-change', checkLoginStatus)
    }
  }, [])

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    setIsLoggedIn(false)
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('login-status-change'))
    
    // Navigate to home
    window.location.href = '/'
  }

  return (
    <header>
      <div className="left-section">
        <NavLink to="/">
          <img src={logo} alt="Cool X3 Mechanics" className="logo" />
          <h1 className="logo-text">Cool X3 Mechanics</h1>
        </NavLink>
      </div>
      <nav className="nav-links">
        <ul>
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/browse">Services</NavLink></li>
          
          {/* Only show Contact link if NOT a mechanic */}
          {(userType !== 'mechanic') && (
            <li><NavLink to="/contact">Contact</NavLink></li>
          )}
          
          {/* Show appropriate profile link based on user type */}
          {isLoggedIn && userType === 'mechanic' && (
            <li><NavLink to="/mechanic">Profile</NavLink></li>
          )}
          {isLoggedIn && userType === 'customer' && (
            <li><NavLink to="/customer">Profile</NavLink></li>
          )}
          
          {/* Only show login/register when NOT logged in */}
          {!isLoggedIn ? (
            <>
              <li><NavLink to="/login">Login</NavLink></li>
              <li><NavLink to="/register">Register</NavLink></li>
            </>
          ) : (
            <li><NavLink to="/" onClick={handleLogout}>Logout</NavLink></li>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default NavBar