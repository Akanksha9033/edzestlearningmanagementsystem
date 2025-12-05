// src/MockTest/protectedroutes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, ready } = useAuth();

  // wait for auth bootstrap to finish so we don't mis-route
  if (!ready) return null; // or render a loader

  // not signed in
  if (!user) return <Navigate to="/" replace />;

  // role check (case-insensitive)
  if (allowedRoles?.length) {
    const ok = allowedRoles
      .map((r) => r.toLowerCase())
      .includes((user.role || "").toLowerCase());
    if (!ok) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}