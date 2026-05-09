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
  const [originalEmail, setOriginalEmail] = useState("");
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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
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
      setOriginalEmail(res.data.email);
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

  // Send verification email for current email
  const sendVerificationEmail = async () => {
    if (!instructor) {
      alert("No instructor data found. Please refresh the page.");
      return;
    }
    
    if (instructor.is_verified) {
      alert("Your email is already verified!");
      return;
    }
    
    setIsSendingOtp(true);
    setVerificationMessage("");
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);
    
    try {
      const response = await api.post("/auth/send-verification-code", {
        email: instructor.email,
        otp: otp,
      });
      
      if (response.data.success) {
        setVerificationMessage(`✓ Verification code sent to ${instructor.email}! Please check your email.`);
        setResendTimer(60);
        setShowVerificationModal(true);
        setVerificationCode("");
      } else {
        alert(response.data.message || "Failed to send verification code");
      }
    } catch (error: any) {
      console.error("Send verification error:", error);
      alert(error.response?.data?.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend verification code
  const resendVerificationCode = async () => {
    if (resendTimer > 0 || !instructor) return;
    
    setVerificationMessage("");
    setIsSendingOtp(true);
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    setGeneratedOtp(otp);
    
    try {
      const response = await api.post("/auth/resend-verification", {
        email: instructor.email,
        otp: otp,
      });
      
      if (response.data.success) {
        setVerificationMessage("✓ New verification code sent! Please check your email.");
        setResendTimer(60);
      } else {
        setVerificationMessage(response.data.message || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      setVerificationMessage(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify the OTP for current email
  const verifyEmail = async () => {
    if (!instructor) return;
    
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
      const response = await api.post("/auth/verify-email", {
        email: instructor.email,
        otp: parseInt(verificationCode),
      });

      if (response.data.success) {
        setVerificationMessage("✓ Email verified successfully!");
        setTimeout(() => {
          setShowVerificationModal(false);
          setVerificationCode("");
          setGeneratedOtp(null);
          fetchInstructorData();
        }, 1500);
      } else {
        setVerificationMessage(response.data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationMessage(error.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Save profile - FIXED: Use correct endpoint for instructor
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (instructor?.is_verified && form.email !== originalEmail) {
      alert("Email cannot be changed once verified. Please contact administrator for assistance.");
      setForm(prev => ({ ...prev, email: originalEmail }));
      return;
    }

    setSaving(true);
    try {
      // Use the instructor profile endpoint, not staff
      const response = await api.put("/instructor/profile", {
        name: form.name,
        email: form.email,
        department: form.department,
        specialization: form.specialization,
      });
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        setInstructor(updatedUser);
        setOriginalEmail(updatedUser.email);
        setForm({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          department: updatedUser.department || "",
          specialization: updatedUser.specialization || "",
        });
        
        if (form.email !== originalEmail) {
          alert(`Profile updated! Your email has been changed to ${form.email}. Please verify your new email address.`);
        } else {
          alert("Profile updated successfully!");
        }
        
        await fetchInstructorData();
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

  // Change password - FIXED: Use correct endpoint
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
        new_password_confirmation: passwords.confirm,
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
  const emailChanged = form.email !== originalEmail;
  const canEditEmail = !isEmailVerified;

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
                {isEmailVerified && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#16a34a" }}>(Locked - Verified)</span>
                )}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{
                  ...inputStyle,
                  background: canEditEmail ? "#fff" : "#f8fafc",
                  cursor: canEditEmail ? "text" : "not-allowed",
                  color: canEditEmail ? "#1e293b" : "#94a3b8"
                }}
                required
                disabled={!canEditEmail}
              />
              {!canEditEmail && (
                <p style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "0.5rem" }}>
                  ✓ Email is verified and locked. Contact administrator to change it.
                </p>
              )}
              {canEditEmail && emailChanged && (
                <p style={{ fontSize: "0.7rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                  ⚠️ Email changed. You will need to verify this new email address.
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

          {/* Email Verification Section */}
          {!isEmailVerified && (
            <div style={{ 
              marginBottom: "1.5rem", 
              padding: "1rem", 
              background: "#fef3c7",
              borderRadius: "0.5rem",
              border: "1px solid #fde68a"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="20" height="20" fill="none" stroke="#d97706" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span style={{ fontWeight: 600, color: "#d97706" }}>
                      Email Not Verified
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#92400e", marginTop: "0.25rem", marginBottom: 0 }}>
                    Please verify your email address ({instructor.email}) to lock your email and access all features.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={sendVerificationEmail}
                  disabled={isSendingOtp}
                  style={{
                    padding: "0.5rem 1rem",
                    background: isSendingOtp ? "#d1d5db" : "#d97706",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: isSendingOtp ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!isSendingOtp) e.currentTarget.style.background = "#b45309"; }}
                  onMouseLeave={(e) => { if (!isSendingOtp) e.currentTarget.style.background = "#d97706"; }}
                >
                  {isSendingOtp ? (
                    <>
                      <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Verify Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isEmailVerified && (
            <div style={{ 
              marginBottom: "1.5rem", 
              padding: "1rem", 
              background: "#f0fdf4",
              borderRadius: "0.5rem",
              border: "1px solid #bbf7d0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontWeight: 600, color: "#16a34a" }}>
                  Email Verified
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem", marginBottom: 0 }}>
                Your email {instructor.email} has been verified. Email changes are now locked for security.
              </p>
            </div>
          )}

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", color: "black" }}>
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
      {showVerificationModal && instructor && (
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
                Email Verification Required
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                We've sent a 6-digit verification code to
              </p>
              <p style={{ color: "#003366", fontWeight: 500, fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {instructor.email}
              </p>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                Once verified, your email will be locked and cannot be changed.
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
                background: verificationMessage.includes("✓") ? "#f0fdf4" : "#fef2f2",
                border: verificationMessage.includes("✓") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                color: verificationMessage.includes("✓") ? "#166534" : "#991b1b",
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
                onClick={verifyEmail}
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
                disabled={resendTimer > 0 || isSendingOtp}
                style={{
                  background: "none",
                  border: "none",
                  color: "#003366",
                  cursor: (resendTimer > 0 || isSendingOtp) ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  opacity: (resendTimer > 0 || isSendingOtp) ? 0.5 : 1,
                }}
              >
                {isSendingOtp ? "Sending..." : (resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend verification code")}
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