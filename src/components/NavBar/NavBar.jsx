import React from 'react'
import { NavLink } from 'react-router-dom'
import './NavBar.css'
import logo from '../../assets/logo.png'

const NavBar = () => {
  return (
    <header>
        <div className='left-section'>
            <img src={logo} className='logo' alt="Cool X3 Mechanics" />
            <h1 className='logo-text'>Cool X3 Mechanics </h1>
        </div>

        <div className='nav-links'> 
        <ul>
            <NavLink to="/">HOME</NavLink>
            <NavLink to="/Login">LOGIN</NavLink>
            <NavLink to="/Register">REGISTER</NavLink>
        </ul>
        </div>
    </header>
    
  )
}

export default NavBar