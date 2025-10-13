import React, { useEffect, useState } from "react";
import "./ServiceView.css";

/**
 * ServiceView
 * - lists service tickets
 * - create / edit / delete service tickets
 * - uses same visual classes/theme as HomeView.css (hero, buttons, browse, contact, feature-card)
 *
 * Expects optional REACT_APP_API_URL env var, token stored in localStorage under "token".
 */
const API_BASE = process.env.REACT_APP_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ServiceView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const emptyForm = {
    id: null,
    customer_id: "",
    service_description: "",
    price: "",
    vin: "",
    service_date: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/service_ticket`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      customer_id: form.customer_id || null,
      service_description: form.service_description,
      price: parseFloat(form.price) || 0,
      vin: form.vin,
      service_date: form.service_date || undefined,
    };

    try {
      let res;
      if (editing && form.id) {
        res = await fetch(`${API_BASE}/service_ticket/${form.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/service_ticket`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }

      // refresh list and clear form
      await fetchTickets();
      setForm(emptyForm);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this service ticket?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/service_ticket/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Delete failed ${res.status}`);
      }
      await fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(ticket) {
    setForm({
      id: ticket.id,
      customer_id: ticket.customer_id ?? "",
      service_description: ticket.service_description ?? "",
      price: ticket.price ?? "",
      vin: ticket.vin ?? "",
      service_date: ticket.service_date ? ticket.service_date.split("T")[0] : "",
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditing(false);
  }

  return (
    <div className="home-container">
      <section className="hero">
        <h1>Service Tickets</h1>
        <p className="subtitle">
          Create, view, edit, and remove service tickets. Admins and mechanics can
          manage tickets when authenticated.
        </p>

        <div className="buttons" style={{ marginTop: 24 }}>
          <a className="browse" href="#creation">
            New Service Ticket
          </a>
          <button
            className="contact"
            onClick={() => {
              // Admin service button: navigate to admin area or refresh popular tickets
              // If an admin-specific route existed we would navigate — keep simple:
              fetch(`${API_BASE}/service_ticket/popular`, {
                method: "GET",
                headers: { "Content-Type": "application/json", ...authHeaders() },
              })
                .then((r) => r.json())
                .then((d) => {
                  if (Array.isArray(d)) {
                    // show top 3 popular descriptions as cards
                    alert(
                      d
                        .map((t) => `${t.service_description}: ${t.usage_count}`)
                        .join("\n") || "No popular tickets"
                    );
                  } else {
                    alert("No popular data or unauthorized");
                  }
                })
                .catch(() => alert("Failed to fetch popular tickets"));
            }}
          >
            Admin Service
          </button>
        </div>
      </section>

      <section className="features-section" style={{ paddingTop: 20 }}>
        <h2 id="creation">Create / Edit Ticket</h2>

        <div className="feature-card" style={{ maxWidth: 900, margin: "0 auto" }}>
          <form onSubmit={handleSubmit} className="service-form">
            <div className="form-row">
              <label>Customer ID</label>
              <input
                type="text"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                placeholder="optional numeric id"
              />
            </div>

            <div className="form-row">
              <label>Service Description</label>
              <textarea
                required
                value={form.service_description}
                onChange={(e) => setForm({ ...form, service_description: e.target.value })}
                placeholder="What work to perform"
              />
            </div>

            <div className="form-row" style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label>VIN</label>
                <input
                  type="text"
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Service Date</label>
                <input
                  type="date"
                  value={form.service_date}
                  onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {editing && (
                <button type="button" className="contact" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
              <button type="submit" className="browse">
                {editing ? "Save Changes" : "Create Ticket"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 12, color: "#ff6b6b" }}>
                Error: {error}
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="features-section">
        <h2>All Service Tickets</h2>

        {loading ? (
          <p>Loading...</p>
        ) : tickets.length === 0 ? (
          <p>No service tickets found.</p>
        ) : (
          <div className="features-grid">
            {tickets.map((t) => (
              <div className="feature-card" key={t.id}>
                <h3>{t.service_description}</h3>
                <p><strong>ID:</strong> {t.id}</p>
                <p><strong>Customer:</strong> {t.customer_id ?? "N/A"}</p>
                <p><strong>Price:</strong> ${Number(t.price).toFixed(2)}</p>
                <p><strong>VIN:</strong> {t.vin}</p>
                <p><strong>Date:</strong> {t.service_date ? t.service_date.split("T")[0] : "N/A"}</p>

                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                  <button className="contact" onClick={() => startEdit(t)}>
                    Edit
                  </button>
                  <button className="browse" onClick={() => handleDelete(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}