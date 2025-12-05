





import React, { createContext, useContext, useEffect, useState } from "react";
import API, { setAccessToken, clearAccessToken } from "../axios";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logRole = (label, u) => {
    const role = u?.role ?? "(none)";
    const email = u?.email ?? "(unknown email)";
    const id = u?.id ?? u?._id ?? "(no id)";
    // console.log(`[Auth] ${label} → role: ${role} | email: ${email} | id: ${id}`);
  };

  const normalizeUser = (u) => {
    if (!u) return null;
    return { ...u, role: u?.role?.toLowerCase?.() || null };
  };

  // bootstrap from httpOnly refresh cookie
  useEffect(() => {
    (async () => {
      try {
        // console.log("[Auth] Bootstrapping from /api/auth/refresh …");
        const r = await API.post("/api/auth/refresh", {}, { withCredentials: true });
        if (r.data?.accessToken) {
          setAccessToken(r.data.accessToken);
          const me = await API.get("/api/auth/me");
          const u = normalizeUser(me.data?.user ?? me.data ?? null);
          setUser(u);
          logRole("Bootstrap /me", u);
        } else {
          // console.warn("[Auth] Refresh returned no accessToken; clearing session");
          clearAccessToken();
          setUser(null);
        }
      } catch (e) {
        // console.warn("[Auth] Bootstrap failed; clearing session.", e?.response?.data || e?.message || e);
        clearAccessToken();
        setUser(null);
      } finally {
        setReady(true);
        // console.log("[Auth] ready =", true);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // public endpoints
  const register = (payload) => API.post("/api/auth/register", payload);
  const verifyEmail = (payload) => API.post("/api/auth/verify-email", payload);

  // password login
  const login = async ({ email, password, newPassword, deviceName }) => {
    try {
      const { data } = await API.post("/api/auth/login", {
        email,
        password,
        newPassword,
        deviceName,
      });
      setAccessToken(data.accessToken);
      const u = normalizeUser(data.user ?? null);
      setUser(u);
      logRole("login success", u);
      return data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        return { challenge: "NEW_PASSWORD_REQUIRED" };
      }
      throw err;
    }
  };

  const completeNewPassword = async ({ username, session, newPassword }) => {
    const { data } = await API.post(
      "/api/auth/complete-new-password",
      { username, session, newPassword },
      { _noAuthRefresh: true }
    );
    setAccessToken(data.accessToken);
    const u = normalizeUser(data.user ?? null);
    setUser(u);
    logRole("completeNewPassword success", u);
    return data;
  };

  const me = async () => {
    const { data } = await API.get("/api/auth/me");
    const u = normalizeUser(data?.user ?? data ?? null);
    setUser(u);
    logRole("me() response", u);
    return u;
  };

  const logout = async () => {
    try {
      await API.post("/api/auth/logout");
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await API.post("/api/auth/logout-all");
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  useEffect(() => {
    if (!ready) return;
    logRole("state change (ready/user)", user);
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        register,
        verifyEmail,
        login,
        logout,
        completeNewPassword,
        logoutAll,
        me,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
