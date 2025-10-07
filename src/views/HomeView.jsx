import React from 'react'
import { NavLink } from 'react-router-dom'
import './HomeView.css'

const HomeView = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to Cool X3 Mechanics</h1>
        <p className="hero-subtitle">Your trusted partner for premium automotive services</p>
        <div className="buttons">
          <NavLink to="/browse" className="browse">Browse Services</NavLink>
          <NavLink to="/contact" className="contact">Contact Us</NavLink>
        </div>
      </section>
      
      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Expert Technicians</h3>
            <p>Certified professionals with years of experience</p>
          </div>
          <div className="feature-card">
            <h3>Quality Parts</h3>
            <p>Only the best components for your vehicle</p>
          </div>
          <div className="feature-card">
            <h3>Fast Service</h3>
            <p>Quick turnaround without compromising quality</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomeView