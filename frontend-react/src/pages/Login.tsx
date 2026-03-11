// src/pages/Login.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setLogoUrl(url);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    setErrors(null);

    try {
      const response = await api.post("/login", { email, password });

localStorage.setItem("token", response.data.token);
localStorage.setItem("role", response.data.role); // ← save role too

// redirect based on role
const role = response.data.role;
if (role === "admin")        navigate("/admin/dashboard");
else if (role === "staff")   navigate("/staff/dashboard");
else if (role === "instructor") navigate("/instructor/dashboard");
else navigate("/");
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrors(err.response.data.message);
      } else {
        setErrors("Login failed. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(to bottom, #1e3a8a, #312e81, #000)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        boxSizing: "border-box",
        color: "#fff",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          padding: "2rem",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Trinidad Municipal College"
              style={{ width: "5rem", display: "block", margin: "0 auto 0.75rem auto" }}
            />
          ) : (
            <div
              style={{
                width: "5rem",
                height: "5rem",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                margin: "0 auto 0.75rem auto",
              }}
            />
          )}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Trinidad Municipal College
          </h2>
          <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "#bfdbfe", marginTop: "0.25rem" }}>
            A Tradition of Excellence
          </p>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: "1.5rem" }}>
          ProfScan Login
        </h1>

        {/* Error Message */}
        {errors && (
          <p style={{ color: "#f87171", fontSize: "0.875rem", textAlign: "center", marginBottom: "1rem" }}>
            {errors}
          </p>
        )}

        {/* Login Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="example@tmc.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 2px #60a5fa")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 2px #60a5fa")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            onMouseEnter={e => !processing && (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "0.625rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.5 : 1,
              transition: "background 0.2s ease",
            }}
          >
            {processing ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#93c5fd", marginTop: "1.5rem" }}>
          © {new Date().getFullYear()} Trinidad Municipal College
        </p>
      </div>
    </div>
  );
}