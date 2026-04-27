import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../store/slices/authSlice";
import { authAPI } from "../api/auth.api";

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const res = await authAPI.login({ email: form.email, password: form.password });
        const { user, accessToken } = res.data;
        dispatch(loginSuccess({ user, token: accessToken }));
        navigate("/dashboard");
      } else {
        if (!form.name || form.password.length < 8) {
          setError("Name is required and password must be at least 8 characters.");
          return;
        }
        await authAPI.register({ name: form.name, email: form.email, password: form.password, role: form.role });
        setMode("login");
        setError("");
        setForm((p) => ({ ...p, name: "" }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", background: "#f9fafb",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg,#0a0f1e 0%,#1e1b4b 50%,#0a0f1e 100%)" }}>
      {/* Left Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>B</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>BobbaExpress</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Logistics Platform</div>
          </div>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
          Manage your<br />logistics smarter
        </h1>
        <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, maxWidth: 400 }}>
          Track pickups, parcels, shipments and customers all in one place. Role-based access for Admin, Staff, and Agents.
        </p>
        <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[["Pickups","Real-time"],["Parcels","Tracked"],["Shipments","Managed"]].map(([l,s]) => (
            <div key={l}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>{s}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Auth Card */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 44px", width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.4)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 32 }}>
            {["login","register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", textTransform: "capitalize",
                  background: mode === m ? "#fff" : "transparent",
                  color:      mode === m ? "#111" : "#6b7280",
                  boxShadow:  mode === m ? "0 1px 6px rgba(0,0,0,.12)" : "none",
                }}>{m === "login" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 28px" }}>
            {mode === "login" ? "Sign in to your account to continue" : "Register a new staff or agent account"}
          </p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Full Name *</label>
                <input style={inp} type="text" placeholder="John Doe" value={form.name} onChange={set("name")} required />
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address *</label>
              <input style={inp} type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password *</label>
              <input style={inp} type="password" placeholder={mode === "register" ? "Min 8 characters" : "Enter your password"} value={form.password} onChange={set("password")} required />
            </div>

            {mode === "register" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Role</label>
                <select style={inp} value={form.role} onChange={set("role")}>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop: 8, padding: "13px", border: "none", borderRadius: 12,
                background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#6366f1)",
                color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(79,70,229,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit",
              }}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Please wait…</>
                : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
