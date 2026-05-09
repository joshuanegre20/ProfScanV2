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
  const [dominantColor, setDominantColor] = useState<string>("#003366");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loginBackground, setLoginBackground] = useState<string | null>(null);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetTimer, setResetTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (resetTimer > 0) {
      const timer = setTimeout(() => setResetTimer(resetTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetTimer]);

  // Fetch logo and login background
  useEffect(() => {
    // Fetch logo
    axios.get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setLogoUrl(url);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData) {
            let r = 0, g = 0, b = 0;
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const pixelCount = data.length / 4;
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            setDominantColor(`rgb(${r}, ${g}, ${b})`);
          }
        };
        img.src = url;
      })
      .catch(() => {});

    // Fetch login background
    fetchLoginBackground();
  }, []);

  const fetchLoginBackground = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/login-images`);
      if (response.data.success && response.data.active) {
        setLoginBackground(response.data.active);
      }
    } catch (error) {
      console.error("Failed to fetch login background:", error);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    setErrors(null);

    try {
      const response = await api.post("/login", { email, password });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role",  response.data.role);
      localStorage.setItem("name",  response.data.name ?? "");
      localStorage.setItem("email", response.data.email ?? "");
      localStorage.setItem("instructor_id", response.data.instructor_id ?? "");
      localStorage.setItem("staff_id",      response.data.staff_id ?? "");

      const role = response.data.role;
      if (role === "admin")           navigate("/admin/dashboard");
      else if (role === "staff")      navigate("/staff/dashboard");
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

  // Send OTP for password reset
  const sendResetOtp = async () => {
    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }

    setIsSendingOtp(true);
    setResetError("");
    setResetMessage("");

    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);

    try {
      const response = await api.post("/auth/send-reset-otp", {
        email: resetEmail,
        otp: otp,
      });

      if (response.data.success) {
        setResetMessage(`Verification code sent to ${resetEmail}! Please check your email.`);
        setResetStep('otp');
        setResetTimer(60);
      } else {
        setResetError(response.data.message || "Failed to send verification code");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      setResetError(error.response?.data?.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyResetOtp = async () => {
    if (!resetOtp || resetOtp.length !== 6) {
      setResetError("Please enter a valid 6-digit code");
      return;
    }

    if (parseInt(resetOtp) !== generatedOtp) {
      setResetError("Invalid verification code. Please try again.");
      return;
    }

    setResetError("");
    setResetMessage("");

    try {
      const response = await api.post("/auth/verify-reset-otp", {
        email: resetEmail,
        otp: parseInt(resetOtp),
      });

      if (response.data.success) {
        setResetToken(response.data.token);
        setResetStep('password');
        setResetMessage("Verification successful! Please enter your new password.");
      } else {
        setResetError(response.data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      setResetError(error.response?.data?.message || "Verification failed");
    }
  };

  // Reset password
  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetError("");
    setResetMessage("");

    try {
      const response = await api.post("/auth/reset-password", {
        email: resetEmail,
        token: resetToken,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.data.success) {
        setResetMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetStep('email');
          setResetEmail("");
          setResetOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setResetToken(null);
          setGeneratedOtp(null);
          setResetMessage("");
          setResetError("");
        }, 2000);
      } else {
        setResetError(response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      setResetError(error.response?.data?.message || "Failed to reset password");
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (resetTimer > 0) return;
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);
    setIsSendingOtp(true);
    setResetError("");
    setResetMessage("");

    try {
      const response = await api.post("/auth/send-reset-otp", {
        email: resetEmail,
        otp: otp,
      });

      if (response.data.success) {
        setResetMessage(`New verification code sent to ${resetEmail}!`);
        setResetTimer(60);
      } else {
        setResetError(response.data.message || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      setResetError(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Close forgot password modal
  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('email');
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken(null);
    setGeneratedOtp(null);
    setResetMessage("");
    setResetError("");
    setResetTimer(0);
  };

  // Background style - use custom image if available, otherwise use gradient
  const backgroundStyle: React.CSSProperties = loginBackground
    ? {
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "1rem" : "1.5rem",
        boxSizing: "border-box" as const,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }
    : {
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        background: `linear-gradient(135deg, ${dominantColor} 0%, ${dominantColor}CC 50%, ${dominantColor}99 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "1rem" : "1.5rem",
        boxSizing: "border-box" as const,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      };

  return (
    <div style={backgroundStyle}>
      {/* Dark overlay for better text visibility when using background image */}
      {loginBackground && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.65)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Subtle Pattern Overlay (only when no custom background) */}
      {!loginBackground && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 40%, rgba(255,255,255,0.08) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(255,215,0,0.08) 0%, transparent 50%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Background seal (only when no custom background) */}
      {!loginBackground && logoUrl && (
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            right: "2rem",
            width: "120px",
            height: "120px",
            opacity: 0.12,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <img
            src={logoUrl}
            alt="College Seal"
            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </div>
      )}

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "440px" : "1100px",
          background: "#ffffff",
          borderRadius: isMobile ? "20px" : "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          zIndex: 2,
          position: "relative",
        }}
      >
        {/* ── Branding panel ── */}
        <div
          style={{
            flex: isMobile ? "none" : 1,
            background: `linear-gradient(135deg, ${dominantColor} 0%, ${dominantColor}DD 100%)`,
            padding: isMobile ? "2rem 1.75rem 1.5rem" : "3rem",
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "flex-start",
            justifyContent: isMobile ? "flex-start" : "center",
            gap: isMobile ? "1rem" : "0",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative bottom fade */}
          <div
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: "100px",
              background: "linear-gradient(to top, rgba(255,255,255,0.05), transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          {logoUrl && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: "-10px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${dominantColor}40 0%, transparent 70%)`,
                }}
              />
              <img
                src={logoUrl}
                alt="Trinidad Municipal College"
                style={{
                  width: isMobile ? "60px" : "90px",
                  height: isMobile ? "60px" : "90px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  padding: "4px",
                  position: "relative",
                  display: "block",
                  marginBottom: isMobile ? "0" : "1.5rem",
                }}
              />
            </div>
          )}

          {/* Text block */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: isMobile ? "1.1rem" : "2rem",
                fontWeight: 600,
                marginBottom: isMobile ? "0.2rem" : "0.75rem",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Trinidad Municipal College
            </h1>

            <p
              style={{
                fontSize: isMobile ? "0.75rem" : "1rem",
                color: "rgba(255,255,255,0.95)",
                fontStyle: "italic",
                borderLeft: "3px solid #ffd700",
                paddingLeft: "0.75rem",
                margin: 0,
              }}
            >
              A Tradition of Excellence
            </p>

            {/* Hide description & footer on mobile to keep branding bar compact */}
            {!isMobile && (
              <>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.85)",
                    marginTop: "2rem",
                    lineHeight: 1.6,
                  }}
                >
                  Access the ProfScan system to manage student attendance,<br />
                  track academic progress, and streamline classroom<br />
                  management with our comprehensive platform.
                </p>
                <div
                  style={{
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
                    © {new Date().getFullYear()} Trinidad Municipal College
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Form panel ── */}
        <div
          style={{
            flex: isMobile ? "none" : 1,
            padding: isMobile ? "1.75rem" : "3rem",
            background: "#ffffff",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: isMobile ? "1.375rem" : "1.75rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "0.4rem",
                letterSpacing: "-0.01em",
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Sign in to access your faculty dashboard
            </p>
          </div>

          {/* Error */}
          {errors && (
            <div
              style={{
                background: "#fef2f2",
                borderLeft: `4px solid ${dominantColor}`,
                padding: "0.875rem",
                borderRadius: "8px",
                marginBottom: "1.25rem",
              }}
            >
              <p style={{ color: "#991b1b", fontSize: "0.875rem", margin: 0 }}>{errors}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "#334155",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="professor@tmc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = dominantColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${dominantColor}20`;
                  e.currentTarget.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "#334155",
                }}
              >
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
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = dominantColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${dominantColor}20`;
                  e.currentTarget.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.375rem" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                }}
                style={{ fontSize: "0.75rem", color: dominantColor, textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={processing}
              style={{
                width: "100%",
                background: dominantColor,
                color: "#ffffff",
                border: "none",
                padding: "0.875rem",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.9375rem",
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.6 : 1,
                transition: "all 0.2s ease",
                marginTop: "0.25rem",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.background = `${dominantColor}DD`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${dominantColor}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = dominantColor;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {processing ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            {isMobile && (
              <p style={{ fontSize: "0.7rem", color: "rgba(100,116,139,0.7)", marginBottom: "0.5rem" }}>
                © {new Date().getFullYear()} Trinidad Municipal College
              </p>
            )}
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
              Need help? Contact IT Support at{" "}
              <a
                href="mailto:it@tmc.edu.ph"
                style={{ color: dominantColor, textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                it@tmc.edu.ph
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
            color: "black"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForgotPassword();
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "450px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#eef2ff",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <svg width="24" height="24" fill="none" stroke="#003366" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600, color: "#1e293b" }}>
                Reset Password
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                {resetStep === 'email' && "Enter your email to receive a verification code"}
                {resetStep === 'otp' && "Enter the 6-digit code sent to your email"}
                {resetStep === 'password' && "Create a new password for your account"}
              </p>
            </div>

            {/* Reset steps content - keep as is from original */}
            {resetStep === 'email' && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      width: "100%",
                      padding: "0.625rem 1rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    autoFocus
                  />
                </div>

                {resetError && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef2f2", borderRadius: "0.5rem", color: "#991b1b", fontSize: "0.875rem" }}>
                    {resetError}
                  </div>
                )}

                {resetMessage && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", color: "#166534", fontSize: "0.875rem" }}>
                    {resetMessage}
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button
                    onClick={closeForgotPassword}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: "#475569",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendResetOtp}
                    disabled={isSendingOtp}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: isSendingOtp ? "#cbd5e1" : dominantColor,
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: isSendingOtp ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: isSendingOtp ? 0.6 : 1,
                    }}
                  >
                    {isSendingOtp ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </>
            )}

            {resetStep === 'otp' && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    style={{
                      width: "100%",
                      padding: "0.625rem 1rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      textAlign: "center",
                      letterSpacing: "0.5rem",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      outline: "none",
                    }}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                  <button
                    onClick={resendOtp}
                    disabled={resetTimer > 0 || isSendingOtp}
                    style={{
                      background: "none",
                      border: "none",
                      color: dominantColor,
                      cursor: (resetTimer > 0 || isSendingOtp) ? "not-allowed" : "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      opacity: (resetTimer > 0 || isSendingOtp) ? 0.5 : 1,
                    }}
                  >
                    {isSendingOtp ? "Sending..." : (resetTimer > 0 ? `Resend code in ${resetTimer}s` : "Resend code")}
                  </button>
                </div>

                {resetError && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef2f2", borderRadius: "0.5rem", color: "#991b1b", fontSize: "0.875rem" }}>
                    {resetError}
                  </div>
                )}

                {resetMessage && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", color: "#166534", fontSize: "0.875rem" }}>
                    {resetMessage}
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button
                    onClick={() => setResetStep('email')}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: "#475569",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyResetOtp}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: dominantColor,
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Verify
                  </button>
                </div>
              </>
            )}

            {resetStep === 'password' && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{
                      width: "100%",
                      padding: "0.625rem 1rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                  <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>Minimum 8 characters</p>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{
                      width: "100%",
                      padding: "0.625rem 1rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>

                {resetError && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef2f2", borderRadius: "0.5rem", color: "#991b1b", fontSize: "0.875rem" }}>
                    {resetError}
                  </div>
                )}

                {resetMessage && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", color: "#166534", fontSize: "0.875rem" }}>
                    {resetMessage}
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button
                    onClick={() => setResetStep('otp')}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      color: "#475569",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={resetPassword}
                    style={{
                      flex: 1,
                      padding: "0.625rem",
                      background: dominantColor,
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Reset Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}