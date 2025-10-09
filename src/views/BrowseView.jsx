import React, { useState } from 'react'
import './BrowseView.css'

// Arrow function component
const BrowseView = () => {
  // State to track which images failed to load
  const [imageErrors, setImageErrors] = useState({});

  // Function that runs when an image fails to load
  const handleImageError = (cardId) => {
    // Update state to mark this image as failed
    setImageErrors({...imageErrors, [cardId]: true});
  };

  // Function to get the correct image source
  const getImageSrc = (cardId, originalSrc) => {
    // If this image had an error, show placeholder instead
    if (imageErrors[cardId]) {
      return "https://via.placeholder.com/800x600/2C2C2C/F5F5F5?text=Service+Image";
    }
    // Otherwise show the original image
    return originalSrc;
  };

  // Main component render
  return (
    <div className="browse-container">
      <div className="wrap">
        
        {/* Card 1: Diagnostics */}
        <article className="card">
          <div className="card-image">
            <img 
              src={getImageSrc('card1', '/Car_computer.jpg')}
              alt="Computer diagnostics equipment"
              onError={() => handleImageError('card1')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Diagnostics</div>
            <h3>Computer Diagnostics & Troubleshooting</h3>
            <p>We run full ECU and systems diagnostics to find electrical faults, sensor failures, and performance bottlenecks — fast and accurately.</p>
          </div>
        </article>

        {/* Card 2: Maintenance */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card2', '/Car.jpg')} 
              alt="Tools and wrench"
              onError={() => handleImageError('card2')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Maintenance</div>
            <h3>Oil Change & Routine Maintenance</h3>
            <p>Oil, filters, fluids and routine inspections to keep your vehicle running smoothly and extend its lifespan.</p>
          </div>
        </article>

        {/* Card 3: Repair */}
        <article className="card">
          <div className="card-image">
            <img 
              src={getImageSrc('card3', '/Engine.jpg')} 
              alt="Engine repair"
              onError={() => handleImageError('card3')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Repair</div>
            <h3>Engine & Transmission Repair</h3>
            <p>From minor repairs to major overhauls our certified technicians restore performance and reliability with precision.</p>
          </div>
        </article>

        {/* Card 4: Safety */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card4', '/Brakes.jpg')} 
              alt="Brake service"
              onError={() => handleImageError('card4')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Safety</div>
            <h3>Brake Service & Wheel Alignment</h3>
            <p>Pad replacement, rotor resurfacing, fluid flush and precision wheel alignment to ensure safe stopping and stable handling.</p>
          </div>
        </article>

        {/* Card 5: Electrical */}
        <article className="card">
          <div className="card-image">
            <img 
              src={getImageSrc('card5', '/Battery.jpg')} 
              alt="Car battery"
              onError={() => handleImageError('card5')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Electrical</div>
            <h3>Battery, Alternator & Electrical Systems</h3>
            <p>Starting and charging system checks plus wiring repair to avoid those unexpected breakdowns.</p>
          </div>
        </article>

        {/* Card 6: Comfort */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card6', '/Ac.jpg')} 
              alt="AC service"
              onError={() => handleImageError('card6')}
              loading="lazy"
            />
          </div>
          <div className="card-text">
            <div className="eyebrow">Comfort</div>
            <h3>AC & Heating Service</h3>
            <p>Full climate system inspection: refrigerant service, compressor checks, heater core and blower repairs — comfortable drives guaranteed.</p>
          </div>
        </article>
      </div>
    </div>
  )
}

export default BrowseView