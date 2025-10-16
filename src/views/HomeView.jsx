import React from 'react'
import { NavLink } from 'react-router-dom'
import './HomeView.css'

const features = [
  { title: 'Expert Technicians', text: 'Certified professionals with years of experience' },
  { title: 'Quality Parts', text: 'Only the best components for your vehicle' },
  { title: 'Fast Service', text: 'Quick turnaround without compromising quality' }
]

const HomeView = () => (
  <div className="home-container">
    <section className="hero">
      <h1>Welcome to Cool X3 Mechanics</h1>
      <p className="subtitle">Your trusted partner for premium automotive services</p>
      <div className="buttons">
        <NavLink to="/browse" className="browse">Browse Services</NavLink>
        <NavLink to="/contact" className="contact">Contact Us</NavLink>
      </div>
    </section>

    <section className="features-section">
      <h2>Why Choose Us?</h2>
      <div className="features-grid">
        {features.map(f => (
          <div key={f.title} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
)

export default HomeView