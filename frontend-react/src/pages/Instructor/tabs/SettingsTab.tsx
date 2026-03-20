// src/pages/Instructor/tabs/SettingsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface Instructor {
  id: number;
  name: string;
  email: string;
  instructor_id: string;
  department?: string;
  specialization?: string;
}

export default function SettingsTab() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [form, setForm] = useState({ name: "", email: "", department: "", specialization: "" });
  const [passwords, setPasswords] = useState({ current: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get("/instructor/me").then(res => {
      setInstructor(res.data);
      setForm({
        name:           res.data.name || "",
        email:          res.data.email || "",
        department:     res.data.department || "",
        specialization: res.data.specialization || "",
      });
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/instructor/profile", form);
      alert("Profile updated!");
    } catch {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) return alert("Passwords do not match.");
    if (passwords.new_password.length < 8) return alert("Password must be at least 8 characters.");
    setSavingPw(true);
    try {
      await api.post("/instructor/change-password", {
        current_password: passwords.current,
        new_password: passwords.new_password,
      });
      setPasswords({ current: "", new_password: "", confirm: "" });
      alert("Password changed!");
    } catch {
      alert("Failed to change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem",
    fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
  };

  if (!instructor) {
    return <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 640 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)", borderRadius: "0.75rem", padding: "1.5rem", color: "#fff", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: "0.875rem", color: "#c4b5fd", marginTop: "0.25rem", marginBottom: 0 }}>Manage your profile and account security</p>
      </div>

      {/* Profile Info */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem", margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile Information
        </h3>

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Specialization</label>
              <input type="text" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Instructor ID</label>
            <input
              type="text" value={instructor.instructor_id} disabled
              style={{ ...inputStyle, background: "#f9fafb", color: "#9ca3af", fontFamily: "monospace", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>Instructor ID cannot be changed</p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving} style={{
              padding: "0.5rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              {saving && <div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem", margin: "0 0 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h3>

        <form onSubmit={handlePasswordSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Current Password *</label>
            <input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} style={inputStyle} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>New Password *</label>
              <input type="password" value={passwords.new_password} onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} style={inputStyle} required />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={savingPw} style={{
              padding: "0.5rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              opacity: savingPw ? 0.6 : 1, display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              {savingPw && <div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}