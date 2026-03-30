// src/pages/Instructor/tabs/SettingsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface Instructor {
  id: number;
  name: string;
  email: string;
  instructor_id: string;
  department: string;
  specialization?: string;
  email_verified_at?: string | null; 
  is_verified: boolean;
}

export default function SettingsTab() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    department: "", 
    specialization: "" 
  });
  const [passwords, setPasswords] = useState({ 
    current: "", 
    new_password: "", 
    confirm: "" 
  });
  
  // Email verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationType, setVerificationType] = useState<'verify' | 'change'>('verify');
  
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const fetchInstructorData = async () => {
    try {
      const res = await api.get("/instructor/me");
      setInstructor(res.data);
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        department: res.data.department || "",
        specialization: res.data.specialization || "",
      });
    } catch (error) {
      console.error("Failed to fetch instructor data:", error);
    }
  };

  // Open verification modal and send code
  const openVerificationModal = async (type: 'verify' | 'change', newEmail?: string) => {
    setVerificationType(type);
    setVerificationCode("");
    setVerificationMessage("");
    setShowVerificationModal(true);
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);
    
    try {
      // Use the correct endpoint for sending verification code
      const response = await api.post("/auth/send-verification-code", {
        email: type === 'change' ? (newEmail || form.email) : instructor?.email,
        otp: otp,
      });
      
      if (response.data.success) {
        setVerificationMessage("Verification code sent! Please check your email.");
        setResendTimer(60);
      } else {
        setVerificationMessage(response.data.message || "Failed to send verification code");
      }
    } catch (error: any) {
      console.error("Send verification error:", error);
      setVerificationMessage(error.response?.data?.message || "Failed to send verification code");
      setGeneratedOtp(null);
    }
  };

  const resendVerificationCode = async () => {
    if (resendTimer > 0) return;
    
    setVerificationMessage("");
    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);
    
    try {
      // Use the correct endpoint for resending verification code
      const response = await api.post("/auth/send-verification-code", {
        email: verificationType === 'change' ? form.email : instructor?.email,
        otp: otp,
      });
      
      if (response.data.success) {
        setVerificationMessage("New verification code sent!");
        setResendTimer(60);
      } else {
        setVerificationMessage(response.data.message || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      setVerificationMessage(error.response?.data?.message || "Failed to resend code");
    }
  };

  const verifyAndProcess = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationMessage("Please enter a valid 6-digit code");
      return;
    }

    if (parseInt(verificationCode) !== generatedOtp) {
      setVerificationMessage("Invalid verification code. Please try again.");
      return;
    }

    setIsVerifying(true);
    setVerificationMessage("");

    try {
      if (verificationType === 'verify') {
        // Verify email using the verify endpoint
        const response = await api.post("/auth/verify-email", {
          email: instructor?.email,
          otp: parseInt(verificationCode),
          verified: true,
        });

        if (response.data.success) {
          setVerificationMessage("Email verified successfully!");
          setTimeout(() => {
            setShowVerificationModal(false);
            setVerificationCode("");
            setGeneratedOtp(null);
            fetchInstructorData();
          }, 1500);
        } else {
          setVerificationMessage(response.data.message || "Verification failed");
        }
      } else {
        // First update profile with new email
        const updateResponse = await api.put("/instructor/profile", form);
        
        if (updateResponse.data.success) {
          // Then verify the new email
          const verifyResponse = await api.post("/auth/verify-email", {
            email: form.email,
            otp: parseInt(verificationCode),
            verified: true,
          });
          
          if (verifyResponse.data.success) {
            setVerificationMessage("Email verified and profile updated successfully!");
            setTimeout(() => {
              setShowVerificationModal(false);
              setVerificationCode("");
              setGeneratedOtp(null);
              fetchInstructorData();
            }, 1500);
          } else {
            setVerificationMessage(verifyResponse.data.message || "Verification failed");
          }
        } else {
          setVerificationMessage(updateResponse.data.message || "Failed to update profile");
        }
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationMessage(error.response?.data?.message || "Operation failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email has been changed
    if (form.email !== instructor?.email) {
      // Open modal with change verification type
      await openVerificationModal('change', form.email);
      return;
    }

    // If no email change, save directly
    setSaving(true);
    try {
      const response = await api.put("/instructor/profile", form);
      if (response.data.success) {
        alert("Profile updated successfully!");
        fetchInstructorData();
      } else {
        alert(response.data.message || "Failed to update profile.");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      alert(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      alert("Passwords do not match.");
      return;
    }
    if (passwords.new_password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    setSavingPw(true);
    try {
      await api.post("/instructor/change-password", {
        current_password: passwords.current,
        new_password: passwords.new_password,
      });
      setPasswords({ current: "", new_password: "", confirm: "" });
      alert("Password changed successfully!");
    } catch (error: any) {
      console.error("Password change error:", error);
      alert(error.response?.data?.message || "Failed to change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "0.375rem",
  };

  if (!instructor) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const isEmailVerified = instructor.is_verified;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Profile Information Card */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
        <h3 style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#1e293b",
          margin: "0 0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.75rem"
        }}>
          <svg width="20" height="20" fill="none" stroke="#003366" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile Information
        </h3>

        <form onSubmit={handleProfileSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", color: "black" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>
                Email Address *
                {isEmailVerified ? (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#16a34a" }}>(Verified)</span>
                ) : (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#f59e0b" }}>(Unverified)</span>
                )}
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  required
                />
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={() => openVerificationModal('verify')}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "#f59e0b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Verify Email
                  </button>
                )}
                {isEmailVerified && (
                  <div style={{
                    padding: "0.625rem 1rem",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#16a34a",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
              {form.email !== instructor?.email && (
                <p style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  You'll need to verify this new email address before saving
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <label style={labelStyle}>Specialization</label>
              <input
                type="text"
                value={form.specialization}
                onChange={e => setForm({ ...form, specialization: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Web Development"
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Instructor ID</label>
            <input
              type="text"
              value={instructor.instructor_id}
              disabled
              style={{
                ...inputStyle,
                background: "#f8fafc",
                color: "#64748b",
                fontFamily: "monospace",
                cursor: "not-allowed"
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem" }}>
              Instructor ID is automatically generated and cannot be changed
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.625rem 1.5rem",
                background: "#003366",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#002244"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#003366"}
            >
              {saving && (
                <div style={{
                  width: "1rem",
                  height: "1rem",
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite"
                }} />
              )}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
        <h3 style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#1e293b",
          margin: "0 0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.75rem"
        }}>
          <svg width="20" height="20" fill="none" stroke="#003366" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h3>

        <form onSubmit={handlePasswordSave}>
          <div style={{ marginBottom: "1rem", color: "black" }}>
            <label style={labelStyle}>Current Password *</label>
            <input
              type="password"
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={labelStyle}>New Password *</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                style={inputStyle}
                required
              />
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>Minimum 8 characters</p>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={savingPw}
              style={{
                padding: "0.625rem 1.5rem",
                background: "#003366",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                opacity: savingPw ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#002244"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#003366"}
            >
              {savingPw && (
                <div style={{
                  width: "1rem",
                  height: "1rem",
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite"
                }} />
              )}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div style={{
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
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "1rem",
            padding: "2rem",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                width: "48px",
                height: "48px",
                background: "#eef2ff",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}>
                <svg width="24" height="24" fill="none" stroke="#003366" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600, color: "#1e293b" }}>
                {verificationType === 'verify' ? 'Email Verification Required' : 'Verify New Email Address'}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                We've sent a 6-digit verification code to
              </p>
              <p style={{ color: "#003366", fontWeight: 500, fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {verificationType === 'change' ? form.email : instructor.email}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                style={{
                  ...inputStyle,
                  fontSize: "1.5rem",
                  textAlign: "center",
                  letterSpacing: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: "black",
                }}
                maxLength={6}
                autoFocus
              />
            </div>

            {verificationMessage && (
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: verificationMessage.includes("success") || verificationMessage.includes("sent") ? "#f0fdf4" : "#fef2f2",
                border: verificationMessage.includes("success") || verificationMessage.includes("sent") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                color: verificationMessage.includes("success") || verificationMessage.includes("sent") ? "#166534" : "#991b1b",
                fontSize: "0.875rem",
                textAlign: "center",
              }}>
                {verificationMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationCode("");
                  setVerificationMessage("");
                  setGeneratedOtp(null);
                }}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "#475569",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={verifyAndProcess}
                disabled={isVerifying || verificationCode.length !== 6}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  background: "#003366",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: verificationCode.length === 6 ? "pointer" : "not-allowed",
                  fontWeight: 500,
                  opacity: verificationCode.length === 6 ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <button
                onClick={resendVerificationCode}
                disabled={resendTimer > 0}
                style={{
                  background: "none",
                  border: "none",
                  color: "#003366",
                  cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  opacity: resendTimer > 0 ? 0.5 : 1,
                }}
              >
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : "Resend verification code"}
              </button>
            </div>
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
        input:focus {
          border-color: #003366;
          box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
        }
      `}</style>
    </div>
  );
}