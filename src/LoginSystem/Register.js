import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // ← adjust path if needed
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi"; // 👁️ icons

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 visibility state
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const payload = {
        name: (form.name || "").trim(),
        email: (form.email || "").trim().toLowerCase(),
        password: form.password || "",
      };

      await register(payload);
      setMsg("Registered! Check your email to verify.");
      navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Registration failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h2 className="h4 mb-3 text-center">Create your account</h2>
              <p className="text-muted text-center mb-4">
                Start your learning journey today.
              </p>

              {msg && (
                <div className="alert alert-success py-2" role="alert">
                  {msg}
                </div>
              )}
              {err && (
                <div className="alert alert-danger py-2" role="alert">
                  {err}
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-control"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="regEmail" className="form-label">
                    Email
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="regPassword" className="form-label">
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="regPassword"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="create a strong password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: "2.75rem" }} // space for eye button
                    />
                    <button
                      type="button"
                      className="btn  border-0 p-0 position-absolute top-50 end-0 translate-middle-y me-2 d-inline-flex align-items-center justify-content-center"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                      style={{ width: "2rem", height: "2rem", marginTop:"-1px" }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="form-text">Password should contain 8 characters include:uppercase (A–Z),lowercase (a–z),number (0–9), and one special character (like @, #, $, !)</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <div className="text-center mt-3">
                <span className="text-muted">Already have an account?</span>{" "}
                <Link to="/login" className="link-primary">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-muted mt-3 mb-0 small">
            We’ll send a verification code to your email.
          </p>
        </div>
      </div>
    </div>
  );
}
