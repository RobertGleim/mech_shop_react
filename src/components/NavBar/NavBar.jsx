import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./NavBar.css";
import logo from "../../assets/logo.png"; // Adjust path if needed

export default function NavBar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // single memoized updater for auth state
  const updateAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(Boolean(token));
    setUserType(localStorage.getItem("userType"));
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  useEffect(() => {
    updateAuth(); // initial check
    window.addEventListener("storage", updateAuth);
    window.addEventListener("login-status-change", updateAuth);
    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("login-status-change", updateAuth);
    };
  }, [updateAuth]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("isAdmin");
    // update local state and notify others
    updateAuth();
    window.dispatchEvent(new Event("login-status-change"));
    navigate("/", { replace: true });
  };

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
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/browse">Services</NavLink>
          </li>

          {/* Only show Contact link if NOT a mechanic */}
          {userType !== "mechanic" && (
            <li>
              <NavLink to="/contact">Contact</NavLink>
            </li>
          )}

          {/* Show appropriate profile link based on user type */}
          {isLoggedIn && userType === "mechanic" && (
            <li>
              <NavLink to="/mechanic">Profile</NavLink>
            </li>
          )}
          {isAdmin && (
            <li>
              <NavLink to="/admin">Admin</NavLink>
            </li>
          )}
          {isLoggedIn && userType === "customer" && (
            <li>
              <NavLink to="/customer">Profile</NavLink>
            </li>
          )}

          {/* Only show login/register when NOT logged in */}
          {!isLoggedIn ? (
            <>
              <li>
                <NavLink to="/login">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register">Register</NavLink>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/" onClick={handleLogout}>
                Logout
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
