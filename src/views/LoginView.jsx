import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./LoginView.css";

// IMPORTANT: Set VITE_API_URL in your frontend environment to your backend base URL (not /api)
// Example for Render backend: VITE_API_URL=https://mech-shop-api.onrender.com
const apiBase = import.meta.env.VITE_API_URL || ""; // Use VITE_API_URL always
const buildUrl = (path) => {
  if (!path.startsWith("/")) path = `/${path}`;
  // If apiBase is set, use it; otherwise fallback to relative /api
  return apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : `/api${path}`;
};
const credentialsMode = apiBase ? "omit" : "include";

export default function LoginView() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("mechanic");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const id = (emailOrUsername || "").trim();
    const pwd = (password || "").trim();
    if (!id) return setErrorMessage("Please enter your email or username.");
    if (!pwd) return setErrorMessage("Please enter your password.");

    const payload = { password: pwd };
    if (id.includes("@")) payload.email = id;
    else payload.username = id;

    setLoading(true);
    try {
      const endpoint =
        userType === "customer" ? "/customers/login" : "/mechanics/login";
      const url = buildUrl(endpoint);
      console.log("Login endpoint:", url); // <-- Added
      console.log("Login payload:", payload); // <-- Added

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: credentialsMode,
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        console.log("Error parsing JSON response:", jsonErr); // <-- Added
        data = null;
      }

      if (!resp.ok) {
        console.log("Login failed response:", resp); // <-- Added
        console.log("Login failed data:", data); // <-- Added
        const msg =
          data?.message || data?.error || `Login failed (${resp.status})`;
        setErrorMessage(msg);
        return;
      }

      const token = data?.token || data?.access_token || data?.accessToken;
      if (!token) {
        console.log("No token returned from server:", data); // <-- Added
        setErrorMessage("No token returned from server.");
        return;
      }

      try {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
        localStorage.setItem("authToken", token);

        sessionStorage.setItem("token", token);

        document.cookie = `token=${encodeURIComponent(token)};path=/;max-age=${
          7 * 24 * 60 * 60
        }`;
      } catch (storageErr) {
        console.log("Error storing token:", storageErr); // <-- Added
      }

      if (typeof data.id !== "undefined")
        localStorage.setItem("userId", String(data.id));

      if (userType === "customer") {
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("userType", "customer");
      } else {
        const isAdmin = !!data.is_admin;
        localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
        localStorage.setItem("userType", isAdmin ? "admin" : "mechanic");
      }

      window.dispatchEvent(new Event("login-status-change"));

      const role = localStorage.getItem("userType");
      if (role === "admin") navigate("/admin");
      else if (role === "customer") navigate("/");
      else navigate("/");
    } catch (err) {
      console.log("Network/login error:", err); // <-- Added
      setErrorMessage(err?.message || "Network error during login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <h2>Sign in to your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {errorMessage && <div className="error">{errorMessage}</div>}

            <div className="user-type-switch">
              <button
                type="button"
                className={`switch-btn ${
                  userType === "customer" ? "active" : ""
                }`}
                onClick={() => setUserType("customer")}
              >
                Customer
              </button>
              <button
                type="button"
                className={`switch-btn ${
                  userType === "mechanic" ? "active" : ""
                }`}
                onClick={() => setUserType("mechanic")}
              >
                Mechanic
              </button>
            </div>

            <div className="form-group">
              <label>Email or Username</label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? "Signing In..."
                : `Sign In as ${
                    userType === "customer" ? "Customer" : "Mechanic"
                  }`}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <NavLink to="/register">Sign up here</NavLink>
            </p>
            <NavLink to="/forgot-password">Forgot your password?</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
