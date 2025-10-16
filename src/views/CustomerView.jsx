import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

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
        const resp = await apiFetch("/customers/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // treat 403 like 401 (clear auth & redirect)
        if (resp.status === 401 || resp.status === 403 || !resp.ok) {
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
      } catch (err) {
        // apiFetch will have logged attempts; fallback to login on failure
         
        console.error("Failed to load profile:", err);
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

  // Embedded CSS (previously in CustomerView.css) to avoid import resolution errors during build
  const customerViewCss = `
.customer-container {
  background-color: #121212;
  color: #f5f5f5;
}

.customer-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.customer-wrapper h1 {
  font-size: 2.5rem;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f5f5f5 0%, #a0d8f8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.customer-wrapper h2 {
  font-size: 1.2rem;
  color: #b0b0b0;
  margin-bottom: 40px;
}

.customer-card-profile {
  display: flex;
  flex-direction: column;
  background-color: #2c2c2c;
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #3d3d3d;
  text-align: left;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.info-section strong {
  color: #a0d8f8;
  margin-right: 8px;
}

.buttons-section {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.customer-btn {
  padding: 10px 18px;
}

.profile-info-note {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 24px;

  border-radius: 10px;
  background: linear-gradient(180deg, #360909 0%, #232323 100%);
  border: 1px solid rgba(160, 216, 248, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  width: calc(100% - 40px);
  max-width: 800px;
  box-sizing: border-box;
  z-index: 1200;
  margin: 0;
}

.profile-info-note > * {
  position: relative;
  margin-left: 14px;
  justify-content: center;
  display: flex;
  align-content: center;
  flex-wrap: wrap;
  text-align: center;
}

@media (max-width: 768px) {
  .customer-card {
    padding: 20px;
    min-height: 320px;
  }

  .profile-info-note {
    padding: 12px;
    margin-top: 14px;
  }

  .buttons-section {
    flex-direction: column;
    align-items: stretch;
  }

  .customer-btn {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .profile-info-note {
    left: 50%;
    transform: translateX(-50%);
    bottom: 12px;
    width: calc(100% - 20px);
    max-width: 680px;
    padding: 10px;
    font-size: 0.95rem;
    line-height: 1.3;
    max-height: 40vh;
    overflow: auto;
  }
}
`;

  if (loading) return <div className="customer-container">Loading...</div>;
  if (!customer)
    return <div className="customer-container">Please log in first</div>;

  return (
    <div className="customer-container">
      {/* Inject styles inline to avoid external CSS import resolution errors */}
      <style>{customerViewCss}</style>

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
