import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerView.css";
import { apiUrl } from "../lib/api";

export default function CustomerView() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");
      if (!token || userType !== "customer") {
        navigate("/login");
        return;
      }

      try {
        const resp = await fetch(apiUrl("/customers/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          // on auth failure or other error, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("userType");
          localStorage.removeItem("isAdmin");
          navigate("/login");
          return;
        }
        const data = await resp.json();
        setCustomer({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        });
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleScheduleService = () => {
    if (!customer) return navigate("/contact");
    navigate("/contact", {
      state: {
        customerData: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          isLoggedInCustomer: true,
        },
      },
    });
  };

  const capitalizeName = (first, last) => {
    const cap = (s) =>
      typeof s === "string" && s.length
        ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
        : "";
    return [cap(first), cap(last)].filter(Boolean).join(" ");
  };

  if (loading) return <div className="customer-container">Loading...</div>;
  if (!customer)
    return <div className="customer-container">Please log in first</div>;

  return (
    <div className="customer-container">
      <div className="customer-wrapper">
        <h1>
          Welcome {capitalizeName(customer.firstName, customer.lastName)}!
        </h1>
        <h2>Your Profile</h2>

        <div className="customer-card-profile">
          <h3>Customer Information</h3>

          <div className="info-section">
            <p>
              <strong>Name:</strong> {customer.firstName} {customer.lastName}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>
            <p>
              <strong>Address:</strong> {customer.address}
            </p>
          </div>

          <div className="buttons-section">
            <button className="customer-btn" onClick={handleScheduleService}>
              Schedule Service
            </button>
            <button
              className="customer-btn"
              onClick={() => navigate("/history")}
            >
              View History
            </button>
          </div>

          <div className="profile-info-note">
            <p className="profile-note-title">
              📝 Profile Information is Read-Only
            </p>
            <small className="profile-note-text">
              For security reasons, profile updates are managed by
              administration. If you need to change your personal information,
              please contact your manager or support.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
