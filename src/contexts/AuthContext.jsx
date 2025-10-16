import React, { createContext, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const storage = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        if (v == null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch {
        /* ignore errors */
      }
    },
  };

  const persist = (tkn, type, adminFlag = false) => {
    storage.set("token", tkn || null);
    storage.set("userType", type || null);
    storage.set("isAdmin", adminFlag ? "1" : "");
  };

  const clearAuth = () => {
    setToken(null);
    setUserType(null);
    setProfile(null);
    setIsAdmin(false);
    persist(null, null, false);
    window.dispatchEvent(new Event("login-status-change"));
  };

  const fetchProfile = async (tkn, type) => {
    if (!tkn || !type) return null;
    const endpoint =
      type === "customer" ? "/customers/profile" : "/mechanics/profile";
    try {
      const res = await fetch(apiUrl(endpoint), {
        headers: { Authorization: `Bearer ${tkn}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setIsAdmin(Boolean(data?.is_admin || data?.isAdmin));
      return data;
    } catch {
      clearAuth();
      return null;
    }
  };

  useEffect(() => {
    const storedToken = storage.get("token");
    const storedType = storage.get("userType");
    if (storedToken && storedType) {
      setToken(storedToken);
      setUserType(storedType);
      fetchProfile(storedToken, storedType).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password, type: desiredType } = {}) => {
    const payload = { email, password };
    if (desiredType) payload.user_type = desiredType;
    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);

    const tkn = body?.token || body?.access_token || body?.data?.token;
    const returnedType =
      desiredType ||
      body?.userType ||
      body?.user_type ||
      body?.data?.userType ||
      body?.data?.user_type;
    const adminFlag = Boolean(
      body?.is_admin || body?.isAdmin || body?.data?.is_admin
    );

    if (!tkn) throw new Error("No token returned");

    setToken(tkn);
    setUserType(returnedType);
    persist(tkn, returnedType, adminFlag);
    await fetchProfile(tkn, returnedType || desiredType);
    window.dispatchEvent(new Event("login-status-change"));
    return { ok: true };
  };

  const loginWithToken = async (tkn, type) => {
    if (!tkn) throw new Error("Token required");
    setToken(tkn);
    setUserType(type);
    persist(tkn, type);
    await fetchProfile(tkn, type);
    window.dispatchEvent(new Event("login-status-change"));
  };

  const value = {
    token,
    userType,
    profile,
    isAdmin,
    loading,
    login,
    loginWithToken,
    logout: clearAuth,
    clearAuth,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
