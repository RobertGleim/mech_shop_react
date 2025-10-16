import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminView.css";

function AdminView() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const isFetchingRef = useRef(false);
  const fetchAbortRef = useRef(null);
  const navigatedRef = useRef(false);

  const apiBase = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";
  const buildUrl = React.useCallback(
    (path) => {
      if (!path.startsWith("/")) path = `/${path}`;
      return apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : `/api${path}`;
    },
    [apiBase]
  );
  const credentialsMode = apiBase ? "omit" : "include";

  const getAuthToken = () => {
    // Always check 'token' first
    let token = null;
    try {
      token = localStorage.getItem("token");
    } catch {
      // Ignore errors reading localStorage
    }
    if (!token)
      try {
        token = sessionStorage.getItem("token");
      } catch {
        /* Ignore errors reading sessionStorage */
      }
    if (!token) {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (cookieMatch) token = decodeURIComponent(cookieMatch[1]);
    }

    if (!token) {
      const keys = ["access_token", "authToken", "Authorization"];
      for (const k of keys) {
        try {
          token = localStorage.getItem(k);
          if (token) break;
        } catch {
          /* ignore error */
        }
        try {
          token = sessionStorage.getItem(k);
          if (token) break;
        } catch {
          /* ignore error */
        }
      }
    }

    if (!token) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get("token") || urlParams.get("access_token");
      } catch {
        // Ignore errors reading localStorage
      }
    }
    return token;
  };

  const fetchWithAuth = React.useCallback(
    async (path, opts = {}) => {
      const token = getAuthToken();
      if (!token) {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          navigate("/login");
        }
        return Promise.reject(new Error("Token is missing!"));
      }

      const headers = Object.assign({}, opts.headers || {}, {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      });

      let url = buildUrl(path);

      if (apiBase) {
        try {
          const urlObj = new URL(url);
          if (!urlObj.searchParams.get("token")) {
            urlObj.searchParams.set("token", token);
            url = urlObj.toString();
          }
        } catch {
          console.debug("fetchWithAuth: could not append token param");
        }
      }

      const fetchOpts = Object.assign({}, opts, {
        headers,
        credentials: opts.credentials ?? credentialsMode,
        signal: opts.signal,
      });

      console.debug("fetchWithAuth", {
        method: fetchOpts.method || "GET",
        url,
        tokenTail: token ? token.slice(-8) : null,
        credentials: fetchOpts.credentials,
      });

      return fetch(url, fetchOpts);
    },
    [apiBase, credentialsMode, navigate, buildUrl]
  );

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdminProfile, setShowAdminProfile] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [showCustomers, setShowCustomers] = useState(false); // <-- existing
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  const hideCustomers = () => setShowCustomers(false);
  const [editLoading, setEditLoading] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const [editError, setEditError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Mechanics state
  const [mechanics, setMechanics] = useState([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [mechanicsError, setMechanicsError] = useState("");
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [mechanicEditForm, setMechanicEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    salary: "",
    address: "",
    is_admin: false,
  });
  const [mechanicEditLoading, setMechanicEditLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mechanicEditError, setMechanicEditError] = useState("");
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const [showMechanics, setShowMechanics] = useState(false);
  const hideMechanics = () => setShowMechanics(false);

  const [showMechanicRegister, setShowMechanicRegister] = useState(false);
  const [mechanicRegisterForm, setMechanicRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    salary: "",
    address: "",
    is_admin: false,
  });
  const [mechRegLoading, setMechRegLoading] = useState(false);
  const [mechRegError, setMechRegError] = useState("");

  const [showCustomerRegister, setShowCustomerRegister] = useState(false);
  const [customerRegisterForm, setCustomerRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [custRegLoading, setCustRegLoading] = useState(false);
  const [custRegError, setCustRegError] = useState("");

  const openMechanicForm = () => {
    setShowMechanicRegister(true);
    setShowCustomerRegister(false);
    setShowCustomers(false);
    setShowMechanics(false);
    setSelectedCustomer(null);
    setSelectedMechanic(null);
    setEditingCustomer(null);
    setEditingMechanic(null);
    setMechRegError("");
    setCustRegError("");
  };
  const openCustomerForm = () => {
    setShowCustomerRegister(true);
    setShowMechanicRegister(false);
    setShowCustomers(false);
    setShowMechanics(false);
    setSelectedCustomer(null);
    setSelectedMechanic(null);
    setEditingCustomer(null);
    setEditingMechanic(null);
    setMechRegError("");
    setCustRegError("");
  };

  useEffect(() => {
    const token = getAuthToken();
    const userType = localStorage.getItem("userType");

    if (!token) {
      setError("You must be logged in to view this page");
      setLoading(false);
      return;
    }

    if (userType !== "mechanic" && userType !== "admin") {
      setError("You must be logged in as an admin mechanic to view this page");
      setLoading(false);
      return;
    }

    fetchWithAuth("/mechanics/profile")
      .then(async (res) => {
        if (!res.ok) {
          let errBody = null;
          try {
            errBody = await res.json();
          } catch {
            try {
              errBody = await res.text();
            } catch {
              /* ignore error */
            }
          }
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userType");
            localStorage.removeItem("isAdmin");
            window.dispatchEvent(new Event("login-status-change"));
            navigate("/login");
            throw new Error(
              errBody?.message ||
                "Your session has expired. Please log in again."
            );
          }
          throw new Error(
            errBody?.message ||
              `Failed to fetch admin profile: ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        const isAdmin = data?.is_admin || data?.isAdmin || false;
        if (!isAdmin) {
          navigate("/");
          return;
        }
        setAdmin(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Admin profile fetch error:", err);
        setError(err.message || "Failed to load admin profile");
        setLoading(false);
      });
  }, [navigate, fetchWithAuth]);

  const fetchCustomers = () => {
    setCustomersLoading(true);
    setCustomersError("");

    const token = getAuthToken();
    if (!token) {
      setCustomersLoading(false);
      setCustomersError("Not authenticated. Please login.");
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        navigate("/login");
      }
      return;
    }

    fetchWithAuth("/customers/")
      .then(async (res) => {
        let parsed = null;
        try {
          parsed = await res.clone().json();
        } catch {
          try {
            parsed = await res.clone().text();
          } catch {
            parsed = null;
          }
        }
        console.debug(
          "fetchCustomers: response status",
          res.status,
          "parsed body:",
          parsed
        );

        if (!res.ok) {
          let errBody = parsed;
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userType");
            localStorage.removeItem("isAdmin");
            window.dispatchEvent(new Event("login-status-change"));
            if (!navigatedRef.current) {
              navigatedRef.current = true;
              navigate("/login");
            }
            throw new Error(
              errBody?.message || "Session expired. Please log in again."
            );
          }
          throw new Error(
            errBody?.message || `HTTP ${res.status}: ${res.statusText}`
          );
        }

        return parsed;
      })
      .then((data) => {
        let list = [];
        if (!data) {
          list = [];
        } else if (Array.isArray(data)) {
          list = data;
        } else if (data.customers) {
          if (Array.isArray(data.customers)) list = data.customers;
          else if (data.customers.data && Array.isArray(data.customers.data))
            list = data.customers.data;
        } else if (data.data && Array.isArray(data.data)) {
          list = data.data;
        } else {
          list = Array.isArray(data) ? data : [];
        }

        console.debug("fetchCustomers: normalized list length", list.length);
        setCustomers(list);

        setShowCustomers(true);
        setCustomersLoading(false);
      })
      .catch((err) => {
        console.error("Customers fetch error:", err);
        setCustomersError(err.message || "Failed to fetch customers");
        setCustomersLoading(false);
      });
  };

  const deleteCustomer = (customerId) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    const token = getAuthToken();
    if (!token) {
      setCustomersError("Not authenticated. Please login.");
      return;
    }

    fetchWithAuth(`/customers/${customerId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete customer");
        return res.json();
      })
      .then(() => {
        setCustomers(customers.filter((c) => c.id !== customerId));
      })
      .catch((err) => {
        setCustomersError(`Failed to delete customer: ${err.message}`);
      });
  };

  const startEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditingCustomer(customer);
    setEditForm({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditError("");
  };

  const updateCustomer = async () => {
    if (!editingCustomer) return;

    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetchWithAuth(`/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      let parsed = null;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text().catch(() => null);
      }
      if (!res.ok) {
        const msg =
          (parsed &&
            (parsed.message || (typeof parsed === "string" ? parsed : null))) ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      let customerObj = null;
      if (!parsed) {
        customerObj = { ...editingCustomer, ...editForm };
      } else if (Array.isArray(parsed)) {
        customerObj = parsed.find((c) => c.id === editingCustomer.id) ||
          parsed[0] || { ...editingCustomer, ...editForm };
      } else if (parsed.customer) {
        customerObj = parsed.customer;
      } else if (parsed.data && typeof parsed.data === "object") {
        customerObj = parsed.data.id
          ? parsed.data
          : { ...editingCustomer, ...editForm };
      } else {
        customerObj = parsed;
      }

      if (!customerObj.id) customerObj.id = editingCustomer.id;
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? customerObj : c))
      );
      setSelectedCustomer(customerObj);
      setEditingCustomer(null);
    } catch (err) {
      setEditError(`Failed to update customer: ${err.message || err}`);
    } finally {
      setEditLoading(false);
    }
  };

  const fetchMechanics = React.useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setMechanicsLoading(true);

    if (fetchAbortRef.current) {
      try {
        fetchAbortRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    const abortController = new AbortController();
    fetchAbortRef.current = abortController;

    try {
      const token = getAuthToken();
      if (!token) {
        setErrorMessage("Not authenticated. Please login as an admin.");
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          navigate("/login");
        }
        return;
      }

      const resp = await fetchWithAuth("/mechanics/", {
        signal: abortController.signal,
      });

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          localStorage.removeItem("token");
          const msg =
            "Your admin session has expired or you are not authorized. Please login again with an admin account.";
          console.warn("Mechanics fetch auth error:", resp.status, msg);
          setErrorMessage(msg);
          if (!navigatedRef.current) {
            navigatedRef.current = true;
            navigate("/login");
          }
          return;
        }

        const text = await resp
          .text()
          .catch(() => resp.statusText || "Unknown error");
        throw new Error(text || `Request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      setMechanics(data || []);

      setShowMechanics(true);
      setMechanicsLoading(false);
    } catch (err) {
      if (err.name === "AbortError") {
        console.debug("Mechanics fetch aborted");
      } else {
        console.error("Mechanics fetch error:", err);
        if (!errorMessage)
          setErrorMessage(err.message || "Failed to load mechanics.");
      }
    } finally {
      isFetchingRef.current = false;
      fetchAbortRef.current = null;
      setMechanicsLoading(false);
    }
  }, [errorMessage, navigate, fetchWithAuth]);

  const deleteMechanic = (mechanicId) => {
    if (!confirm("Are you sure you want to delete this mechanic?")) return;

    fetchWithAuth(`/mechanics/${mechanicId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          return fetchWithAuth("/mechanics/", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: mechanicId }),
          });
        }
        return res;
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete mechanic");
        return res.json();
      })
      .then(() => {
        setMechanics(mechanics.filter((m) => m.id !== mechanicId));
      })
      .catch((err) => {
        setMechanicsError(`Failed to delete mechanic: ${err.message}`);
      });
  };

  const startMechanicEdit = (mechanic) => {
    setEditingMechanic(mechanic);
    setMechanicEditForm({
      first_name: mechanic.first_name || "",
      last_name: mechanic.last_name || "",
      email: mechanic.email || "",
      salary: mechanic.salary || "",
      address: mechanic.address || "",
      is_admin: mechanic.is_admin || false,
    });
    setMechanicEditError("");
  };

  const updateMechanic = async () => {
    if (!editingMechanic) return;

    setMechanicEditLoading(true);
    setMechanicEditError("");
    try {
      let resp = await fetchWithAuth(`/mechanics/${editingMechanic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mechanicEditForm),
      });

      if (!resp.ok && resp.status === 404) {
        resp = await fetchWithAuth("/mechanics/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...mechanicEditForm, id: editingMechanic.id }),
        });
      }
      let parsed = null;
      try {
        parsed = await resp.json();
      } catch {
        parsed = await resp.text().catch(() => null);
      }
      if (!resp.ok) {
        const msg =
          (parsed &&
            (parsed.message ||
              (typeof parsed === "string"
                ? parsed
                : JSON.stringify(parsed)))) ||
          `HTTP ${resp.status}`;
        throw new Error(msg);
      }

      let mechObj = null;
      if (!parsed) mechObj = { ...editingMechanic, ...mechanicEditForm };
      else if (parsed.mechanic) mechObj = parsed.mechanic;
      else if (parsed.data && typeof parsed.data === "object")
        mechObj = parsed.data.id
          ? parsed.data
          : { ...editingMechanic, ...mechanicEditForm };
      else mechObj = parsed;
      if (!mechObj.id) mechObj.id = editingMechanic.id;
      setMechanics((prev) =>
        prev.map((m) => (m.id === editingMechanic.id ? mechObj : m))
      );
      setSelectedMechanic(mechObj);
      setEditingMechanic(null);
    } catch (err) {
      setMechanicEditError(`Failed to update mechanic: ${err.message || err}`);
    } finally {
      setMechanicEditLoading(false);
    }
  };

  const createMechanic = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMechRegError("");
    setMechRegLoading(true);

    try {
      const body = { ...mechanicRegisterForm };
      if (body.salary === "") delete body.salary;
      else body.salary = Number(body.salary);

      const res = await fetchWithAuth("/mechanics/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let parsed = null;
      try {
        parsed = await res.clone().json();
      } catch {
        parsed = await res
          .clone()
          .text()
          .catch(() => null);
      }

      if (!res.ok) {
        const msg =
          (parsed && (parsed.message || JSON.stringify(parsed))) ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const newMech =
        parsed && typeof parsed === "object" ? parsed : await res.json();
      setMechanics((prev) => (prev ? [...(prev || []), newMech] : [newMech]));
      setShowMechanicRegister(false);

      setMechanicRegisterForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        salary: "",
        address: "",
        is_admin: false,
      });

      try {
        window.alert(
          `Mechanic created successfully${
            newMech?.first_name
              ? `: ${newMech.first_name} ${newMech.last_name || ""}`
              : ""
          }`
        );
      } catch (alertErr) {
        console.debug("Alert failed:", alertErr);
      }
    } catch (err) {
      setMechRegError(err.message || "Failed to create mechanic");

      try {
        window.alert(
          `Failed to create mechanic: ${err.message || "Unknown error"}`
        );
      } catch (alertErr) {
        console.debug("Alert failed:", alertErr);
      }
    } finally {
      setMechRegLoading(false);
    }
  };

  const createCustomer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCustRegError("");
    setCustRegLoading(true);

    try {
      const body = { ...customerRegisterForm };

      const res = await fetchWithAuth("/customers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let parsed = null;
      try {
        parsed = await res.clone().json();
      } catch {
        parsed = await res
          .clone()
          .text()
          .catch(() => null);
      }

      if (!res.ok) {
        const msg =
          (parsed && (parsed.message || JSON.stringify(parsed))) ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const newCust =
        parsed && typeof parsed === "object" ? parsed : await res.json();

      setCustomers((prev) => (prev ? [...(prev || []), newCust] : [newCust]));
      setShowCustomers(true);
      setShowCustomerRegister(false);
      setCustomerRegisterForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
      });

      try {
        window.alert(
          `Customer created successfully${
            newCust?.first_name
              ? `: ${newCust.first_name} ${newCust.last_name || ""}`
              : ""
          }`
        );
      } catch (alertErr) {
        console.debug("Alert failed:", alertErr);
      }
    } catch (err) {
      setCustRegError(err.message || "Failed to create customer");

      try {
        window.alert(
          `Failed to create customer: ${err.message || "Unknown error"}`
        );
      } catch (alertErr) {
        console.debug("Alert failed:", alertErr);
      }
    } finally {
      setCustRegLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-view loading">Loading admin panel...</div>;
  }

  if (error) {
    return <div className="admin-view error">Error: {error}</div>;
  }

  return (
    <div className="admin-view">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-info">
          <h2>
            Welcome, {admin?.first_name} {admin?.last_name}
          </h2>
          <p>Email: {admin?.email}</p>
          <p>Phone: {admin?.phone || "Not provided"}</p>
        </div>

        {admin?.is_admin && (
          <div className="admin-header-actions">
            <a
              href="#add-mechanic"
              className="add-mechanic-link"
              onClick={(e) => {
                e.preventDefault();
                openMechanicForm();
              }}
              aria-expanded={showMechanicRegister}
              title="Add a new mechanic (admin only)"
            >
              Add Mechanic
            </a>

            <a
              href="#add-customer"
              className="add-mechanic-link"
              onClick={(e) => {
                e.preventDefault();
                openCustomerForm();
              }}
              aria-expanded={showCustomerRegister}
              title="Add a new customer (admin only)"
            >
              Add Customer
            </a>
          </div>
        )}
      </div>

      <div className="admin-nav">
        <button
          className={showAdminProfile ? "active" : ""}
          onClick={() => setShowAdminProfile(true)}
        >
          My Profile
        </button>
        <button
          className={!showAdminProfile ? "active" : ""}
          onClick={() => setShowAdminProfile(false)}
        >
          Management
        </button>
      </div>

      {showAdminProfile ? (
        <div className="admin-profile-panel card-base">
          <h3>My Profile</h3>
          <div className="detail-body">
            <div className="detail-row">
              <div className="detail-label">Name</div>
              <div className="detail-value">
                {admin?.first_name} {admin?.last_name}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">{admin?.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Salary</div>
              <div className="detail-value">
                {admin?.salary || "Not provided"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Address</div>
              <div className="detail-value">
                {admin?.address || "Not provided"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Admin</div>
              <div className="detail-value">
                {admin?.is_admin ? "Yes" : "No"}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <small style={{ color: "#aeb6c2" }}>
              Profile edits are managed by administration. Use Management tab to
              manage users.
            </small>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-actions">
            <div className="section">
              <h3>Customer Management</h3>
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <button onClick={fetchCustomers} disabled={customersLoading}>
                  {customersLoading ? "Loading..." : "Load Customers"}
                </button>

                <button
                  aria-label="Hide customers"
                  onClick={hideCustomers}
                  className="inline-close-btn"
                  title="Hide customers"
                >
                  ×
                </button>
              </div>

              {customersError && (
                <div className="error-message">{customersError}</div>
              )}

              {showCustomers && customers.length > 0 && (
                <div className="customers-list">
                  <h4>All Customers ({customers.length})</h4>
                  <div className="customers-grid">
                    {customers.map((customer) => (
                      <div key={customer.id} className="customer-card">
                        <div className="customer-info">
                          <h5 className="card-title">
                            {customer.first_name} {customer.last_name}
                            <span className="card-id">#{customer.id}</span>
                          </h5>
                          <p className="card-subtext">{customer.email}</p>
                        </div>
                        <div className="customer-actions">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setEditingCustomer(null);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedCustomer && (
                    <div className="detail-panel">
                      <div className="detail-header">
                        <h4>
                          Customer Details: {selectedCustomer.first_name}{" "}
                          {selectedCustomer.last_name}{" "}
                          <span className="detail-id">
                            #{selectedCustomer.id}
                          </span>
                        </h4>
                        <button
                          aria-label="Close customer details"
                          onClick={() => setSelectedCustomer(null)}
                          className="close-box"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="detail-body">
                        {editingCustomer &&
                        editingCustomer.id === selectedCustomer.id ? (
                          <form
                            className="inline-edit-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              updateCustomer();
                            }}
                          >
                            <div className="form-group">
                              <label>First Name</label>
                              <input
                                type="text"
                                value={editForm.first_name}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    first_name: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Last Name</label>
                              <input
                                type="text"
                                value={editForm.last_name}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    last_name: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="email"
                                value={selectedCustomer.email}
                                disabled
                                className="disabled-input"
                              />
                            </div>
                            <div className="form-group">
                              <label>Phone</label>
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    phone: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Address</label>
                              <textarea
                                value={editForm.address}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    address: e.target.value,
                                  })
                                }
                                rows="2"
                              />
                            </div>
                            <div className="form-actions">
                              <button
                                type="submit"
                                className="btn"
                                disabled={editLoading}
                              >
                                {editLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                className="btn cancel"
                                onClick={() => setEditingCustomer(null)}
                                disabled={editLoading}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="detail-row">
                              <div className="detail-label">Email</div>
                              <div className="detail-value">
                                {selectedCustomer.email}
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Phone</div>
                              <div className="detail-value">
                                {selectedCustomer.phone || "N/A"}
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Address</div>
                              <div className="detail-value">
                                {selectedCustomer.address || "N/A"}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="detail-actions">
                        {!editingCustomer ||
                        editingCustomer.id !== selectedCustomer.id ? (
                          <>
                            <button
                              onClick={() => startEdit(selectedCustomer)}
                              className="btn"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this customer?")) {
                                  deleteCustomer(selectedCustomer.id);
                                  setSelectedCustomer(null);
                                }
                              }}
                              className="btn delete"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="section">
              <h3>Mechanics Management</h3>
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <button onClick={fetchMechanics} disabled={mechanicsLoading}>
                  {mechanicsLoading ? "Loading..." : "Load Mechanics"}
                </button>
                <button
                  aria-label="Hide mechanics"
                  onClick={hideMechanics}
                  className="inline-close-btn"
                  title="Hide mechanics"
                >
                  ×
                </button>
              </div>

              {mechanicsError && (
                <div className="error-message">{mechanicsError}</div>
              )}

              {showMechanics && mechanics.length > 0 && (
                <div className="mechanics-list">
                  <h4>All Mechanics ({mechanics.length})</h4>
                  <div className="mechanics-grid">
                    {mechanics.map((mechanic) => (
                      <div key={mechanic.id} className="mechanic-card">
                        <div className="mechanic-info">
                          <h5 className="card-title">
                            {mechanic.first_name} {mechanic.last_name}
                            <span className="card-id">#{mechanic.id}</span>
                          </h5>
                          <p className="card-subtext">{mechanic.email}</p>
                        </div>
                        <div className="mechanic-actions">
                          <button
                            onClick={() => {
                              setSelectedMechanic(mechanic);
                              setEditingMechanic(null);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMechanic && (
                    <div className="detail-panel">
                      <div className="detail-header">
                        <h4>
                          Mechanic Details: {selectedMechanic.first_name}{" "}
                          {selectedMechanic.last_name}{" "}
                          <span className="detail-id">
                            #{selectedMechanic.id}
                          </span>
                        </h4>
                        <button
                          aria-label="Close mechanic details"
                          onClick={() => setSelectedMechanic(null)}
                          className="close-box"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="detail-body">
                        {editingMechanic &&
                        editingMechanic.id === selectedMechanic.id ? (
                          <form
                            className="inline-edit-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              updateMechanic();
                            }}
                          >
                            <div className="form-group">
                              <label>First Name</label>
                              <input
                                type="text"
                                value={mechanicEditForm.first_name}
                                onChange={(e) =>
                                  setMechanicEditForm({
                                    ...mechanicEditForm,
                                    first_name: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Last Name</label>
                              <input
                                type="text"
                                value={mechanicEditForm.last_name}
                                onChange={(e) =>
                                  setMechanicEditForm({
                                    ...mechanicEditForm,
                                    last_name: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="email"
                                value={mechanicEditForm.email}
                                onChange={(e) =>
                                  setMechanicEditForm({
                                    ...mechanicEditForm,
                                    email: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Salary</label>
                              <input
                                type="number"
                                step="0.01"
                                value={mechanicEditForm.salary}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setMechanicEditForm({
                                    ...mechanicEditForm,
                                    salary: v === "" ? "" : parseFloat(v),
                                  });
                                }}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Address</label>
                              <textarea
                                value={mechanicEditForm.address}
                                onChange={(e) =>
                                  setMechanicEditForm({
                                    ...mechanicEditForm,
                                    address: e.target.value,
                                  })
                                }
                                rows="2"
                              />
                            </div>
                            <div className="form-group">
                              <div className="admin-checkbox-row">
                                <label className="checkbox-label">
                                  <span className="checkbox-text">Admin</span>
                                  <input
                                    type="checkbox"
                                    checked={mechanicEditForm.is_admin}
                                    onChange={(e) =>
                                      setMechanicEditForm({
                                        ...mechanicEditForm,
                                        is_admin: e.target.checked,
                                      })
                                    }
                                    style={{ marginLeft: 8 }}
                                  />
                                </label>
                                <span className="admin-help">
                                  check this box to make mechanic an admin
                                </span>
                              </div>
                            </div>
                            <div className="form-actions">
                              <button
                                type="submit"
                                className="btn"
                                disabled={mechanicEditLoading}
                              >
                                {mechanicEditLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                className="btn cancel"
                                onClick={() => setEditingMechanic(null)}
                                disabled={mechanicEditLoading}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="detail-row">
                              <div className="detail-label">Email</div>
                              <div className="detail-value">
                                {selectedMechanic.email}
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Salary</div>
                              <div className="detail-value">
                                ${selectedMechanic.salary}
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Address</div>
                              <div className="detail-value">
                                {selectedMechanic.address || "N/A"}
                              </div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Admin</div>
                              <div className="detail-value">
                                {selectedMechanic.is_admin ? "Yes" : "No"}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="detail-actions">
                        {!editingMechanic ||
                        editingMechanic.id !== selectedMechanic.id ? (
                          <>
                            <button
                              onClick={() =>
                                startMechanicEdit(selectedMechanic)
                              }
                              className="btn"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this mechanic?")) {
                                  deleteMechanic(selectedMechanic.id);
                                  setSelectedMechanic(null);
                                }
                              }}
                              className="btn delete"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showMechanicRegister && (
                <div
                  className="modal-overlay"
                  onClick={() => setShowMechanicRegister(false)}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div
                      className="detail-header"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4>Add Mechanic</h4>
                      <button
                        aria-label="Close"
                        className="close-box"
                        onClick={() => setShowMechanicRegister(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <form
                      className="inline-edit-form"
                      onSubmit={createMechanic}
                    >
                      {mechRegError && (
                        <div className="error-message">{mechRegError}</div>
                      )}
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          value={mechanicRegisterForm.first_name}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              first_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          value={mechanicRegisterForm.last_name}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              last_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={mechanicRegisterForm.email}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          value={mechanicRegisterForm.password}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Salary</label>
                        <input
                          type="number"
                          step="0.01"
                          value={mechanicRegisterForm.salary}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              salary: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          value={mechanicRegisterForm.address}
                          onChange={(e) =>
                            setMechanicRegisterForm({
                              ...mechanicRegisterForm,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <div className="admin-checkbox-row">
                          <label className="checkbox-label">
                            <span className="checkbox-text">Admin</span>
                            <input
                              type="checkbox"
                              checked={mechanicRegisterForm.is_admin}
                              onChange={(e) =>
                                setMechanicRegisterForm({
                                  ...mechanicRegisterForm,
                                  is_admin: e.target.checked,
                                })
                              }
                              style={{ marginLeft: 8 }}
                            />
                          </label>
                          <span className="admin-help">
                            check this box to make mechanic an admin
                          </span>
                        </div>
                      </div>
                      <div className="form-actions modal-actions">
                        <button
                          type="submit"
                          className="btn"
                          disabled={mechRegLoading}
                        >
                          {mechRegLoading ? "Creating..." : "Create Mechanic"}
                        </button>
                        <button
                          type="button"
                          className="btn cancel"
                          onClick={() => setShowMechanicRegister(false)}
                          disabled={mechRegLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showCustomerRegister && (
                <div
                  className="modal-overlay"
                  onClick={() => setShowCustomerRegister(false)}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div
                      className="detail-header"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4>Add Customer</h4>
                      <button
                        aria-label="Close"
                        className="close-box"
                        onClick={() => setShowCustomerRegister(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <form
                      className="inline-edit-form"
                      onSubmit={createCustomer}
                    >
                      {custRegError && (
                        <div className="error-message">{custRegError}</div>
                      )}
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          value={customerRegisterForm.first_name}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              first_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          value={customerRegisterForm.last_name}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              last_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={customerRegisterForm.email}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          value={customerRegisterForm.password}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          value={customerRegisterForm.phone}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          value={customerRegisterForm.address}
                          onChange={(e) =>
                            setCustomerRegisterForm({
                              ...customerRegisterForm,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-actions modal-actions">
                        <button
                          type="submit"
                          className="btn"
                          disabled={custRegLoading}
                        >
                          {custRegLoading ? "Creating..." : "Create Customer"}
                        </button>
                        <button
                          type="button"
                          className="btn cancel"
                          onClick={() => setShowCustomerRegister(false)}
                          disabled={custRegLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  );
}

export default AdminView;
