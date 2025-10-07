import React, { useState } from 'react'
import './BrowseView.css'

const BrowseView = () => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (cardId) => {
    setImageErrors(prev => ({...prev, [cardId]: true}));
  };

  const getImageSrc = (cardId, originalSrc) => {
    if (imageErrors[cardId]) {
      return `https://via.placeholder.com/800x600/2C2C2C/F5F5F5?text=Service+Image`;
    }
    return originalSrc;
  };
  return (
    <div className="browse-container">
      <div className="wrap">
        
        {/* Card 1: image left */}
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

        {/* Card 2: image right (reverse) */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card2', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop&crop=center')} 
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

        {/* Card 3: image left */}
        <article className="card">
          <div className="card-image">
            <img 
              src={getImageSrc('card3', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop&crop=center')} 
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

        {/* Card 4: image right (reverse) */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card4', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center')} 
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

        {/* Card 5: image left */}
        <article className="card">
          <div className="card-image">
            <img 
              src={getImageSrc('card5', 'https://images.unsplash.com/photo-1609964692698-e5bc8edbc941?w=800&h=600&fit=crop&crop=center')} 
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

        {/* Card 6: image right (reverse) */}
        <article className="card reverse">
          <div className="card-image">
            <img 
              src={getImageSrc('card6', 'https://images.unsplash.com/photo-1615906655593-ad0386982805?w=800&h=600&fit=crop&crop=center')} 
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