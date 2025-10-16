import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterView.css";
import { apiUrl } from "../lib/api";

export default function RegisterView() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(apiUrl("/customers/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        setError(
          (body && (body.message || JSON.stringify(body))) ||
            `Failed (${resp.status})`
        );
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-header">
            <h1>Create an Account</h1>
            <h2>Join Cool X3 Mechanics</h2>
          </div>

          {success ? (
            <div className="alert alert-success">
              Account created. Redirecting to login...
            </div>
          ) : (
            <form className="register-form" onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    name="first_name"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    name="last_name"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    name="address"
                    placeholder="Address (optional)"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="register-footer" style={{ marginTop: 16 }}>
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="login-link"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
