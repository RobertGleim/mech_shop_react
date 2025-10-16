import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MechanicsView.css";
import { apiUrl } from "../lib/api";

export default function MechanicsView() {
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const clearAuthAndRedirect = React.useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      const userType = localStorage.getItem("userType");
      if (!token || userType !== "mechanic") {
        navigate("/login");
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch(apiUrl("/mechanics/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 401) {
          clearAuthAndRedirect();
          return;
        }
        if (!resp.ok) throw new Error(`Failed (${resp.status})`);
        const data = await resp.json();
        setMechanic(data);
      } catch {
        clearAuthAndRedirect();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, clearAuthAndRedirect]);

  const loadJobs = async () => {
    const token = localStorage.getItem("token");
    if (!token || !mechanic?.id) {
      navigate("/login");
      return;
    }
    setJobsLoading(true);
    try {
      const resp = await fetch(apiUrl(`/mechanics/${mechanic.id}/jobs`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401) {
        clearAuthAndRedirect();
        return;
      }
      if (!resp.ok) throw new Error(`Failed (${resp.status})`);
      const data = await resp.json();
      setJobs(data);
    } catch {
      // ignore errors
    } finally {
      setJobsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthAndRedirect();
    window.dispatchEvent(new Event("login-status-change"));
  };

  // small helper to mask password when shown in profile
  const maskedPassword = (pw) => (pw ? "••••••" : "Not set");

  // helper to capitalize first letter of a string
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  if (loading) return <div className="mechanic-container">Loading...</div>;

  if (!mechanic) {
    return (
      <div className="mechanic-container">
        <div className="mechanic-wrapper">
          <h2>Please log in as a mechanic to view this page</h2>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mechanic-container">
      <div className="mechanic-wrapper">
        <h1>Welcome {capitalize(mechanic.first_name)}!</h1>
        <div className="mechanic-navigation">
          {/* <button className={showProfile ? 'active' : ''} onClick={() => setShowProfile(true)}>
						My Profile
					</button> */}
          {/* <button
						className={!showProfile ? 'active' : ''}
						onClick={() => {
							setShowProfile(false)
							if (jobs.length === 0) loadJobs()
						}}
					>
						My Jobs
					</button> */}
          {/* <button onClick={handleLogout} className="logout-btn">Logout</button> */}
        </div>

        {showProfile ? (
          // Profile card updated to follow swagger: name, email, password, salary, address
          <div className="customer-card-profile">
            <h3>Profile Information</h3>

            <div className="info-section">
              <p>
                <strong>Name:</strong> {mechanic.first_name}{" "}
                {mechanic.last_name}
              </p>
              <p>
                <strong>Email:</strong> {mechanic.email}
              </p>
              <p>
                <strong>Password:</strong> {maskedPassword(mechanic.password)}
              </p>
              <p>
                <strong>Salary:</strong> ${mechanic.salary}
              </p>
              <p>
                <strong>Address:</strong> {mechanic.address || "Not provided"}
              </p>
            </div>

            <div className="buttons-section" style={{ marginTop: 12 }}>
              <button
                className="mechanic-btn"
                onClick={() => {
                  setShowProfile(false);
                  loadJobs();
                }}
              >
                View Jobs
              </button>
              <button className="mechanic-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <div className="profile-info-note" style={{ marginTop: 16 }}>
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
        ) : (
          <div className="jobs-section">
            <h3>My Assigned Jobs</h3>

            {/* Back to profile button so mechanic can return to profile view */}
            <div className="buttons-section" style={{ marginTop: 12 }}>
              <button
                className="mechanic-btn"
                onClick={() => setShowProfile(true)}
              >
                Back to Profile
              </button>
            </div>

            {jobsLoading ? (
              <div>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div>No jobs assigned yet.</div>
            ) : (
              <div className="jobs-list">
                {jobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <h4>Job #{job.id}</h4>
                    <p>
                      <strong>Customer:</strong> {job.customer_name}
                    </p>
                    <p>
                      <strong>Description:</strong> {job.description}
                    </p>
                    <p>
                      <strong>Status:</strong> {job.status}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
