import React, { useState } from "react";
import "./BrowseView.css";

// Arrow function component
const BrowseView = () => {
  // State to track which images failed to load
  const [imageErrors, setImageErrors] = useState({});

  // Function that runs when an image fails to load
  const handleImageError = (id) => {
    // Update state to mark this image as failed
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Function to get the correct image source
  const getImageSrc = (id, src) => {
    // If this image had an error, show placeholder instead
    return imageErrors[id]
      ? "https://via.placeholder.com/800x600/2C2C2C/F5F5F5?text=Service+Image"
      : src;
  };

  // Array of card data
  const cards = [
    {
      id: "card1",
      eyebrow: "Diagnostics",
      title: "Computer Diagnostics & Troubleshooting",
      text: "We run full ECU and systems diagnostics to find electrical faults, sensor failures, and performance bottlenecks — fast and accurately.",
      img: "/Car_computer.jpg",
      alt: "Computer diagnostics equipment",
    },
    {
      id: "card2",
      eyebrow: "Maintenance",
      title: "Oil Change & Routine Maintenance",
      text: "Oil, filters, fluids and routine inspections to keep your vehicle running smoothly and extend its lifespan.",
      img: "/Car.jpg",
      alt: "Tools and wrench",
      reverse: true,
    },
    {
      id: "card3",
      eyebrow: "Repair",
      title: "Engine & Transmission Repair",
      text: "From minor repairs to major overhauls our certified technicians restore performance and reliability with precision.",
      img: "/Engine.jpg",
      alt: "Engine repair",
    },
    {
      id: "card4",
      eyebrow: "Safety",
      title: "Brake Service & Wheel Alignment",
      text: "Pad replacement, rotor resurfacing, fluid flush and precision wheel alignment to ensure safe stopping and stable handling.",
      img: "/Brakes.jpg",
      alt: "Brake service",
      reverse: true,
    },
    {
      id: "card5",
      eyebrow: "Electrical",
      title: "Battery, Alternator & Electrical Systems",
      text: "Starting and charging system checks plus wiring repair to avoid those unexpected breakdowns.",
      img: "/Battery.jpg",
      alt: "Car battery",
    },
    {
      id: "card6",
      eyebrow: "Comfort",
      title: "AC & Heating Service",
      text: "Full climate system inspection: refrigerant service, compressor checks, heater core and blower repairs — comfortable drives guaranteed.",
      img: "/Ac.jpg",
      alt: "AC service",
      reverse: true,
    },
  ];

  // Main component render
  return (
    <div className="browse-container">
      <div className="wrap">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`card${card.reverse ? " reverse" : ""}`}
          >
            <div className="card-image">
              <img
                src={getImageSrc(card.id, card.img)}
                alt={card.alt}
                onError={() => handleImageError(card.id)}
                loading="lazy"
              />
            </div>
            <div className="card-text">
              <div className="eyebrow">{card.eyebrow}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BrowseView;
