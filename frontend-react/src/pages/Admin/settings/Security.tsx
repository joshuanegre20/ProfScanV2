// src/pages/Admin/tabs/ProfileTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1f2937",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const errorStyle: React.CSSProperties = {
  color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem",
};

interface AdminInfo {
  name: string;
  email: string;
  role: string;
  profile_url: string | null;
}

export default function ProfileTab() {
  const [adminInfo, setAdminInfo]         = useState<AdminInfo>({ name: "", email: "", role: "", profile_url: null });
  const [loadingInfo, setLoadingInfo]     = useState(true);
  const [isEditing, setIsEditing]         = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl]               = useState<string | null>(null);
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const [avatarSuccess, setAvatarSuccess]       = useState("");

  // Profile form
  const [profileForm, setProfileForm]               = useState({ name: "", email: "" });
  const [profileErrors, setProfileErrors]           = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess]         = useState("");
  const [profileProcessing, setProfileProcessing]   = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "", new_password: "", new_password_confirmation: "",
  });
  const [passwordErrors, setPasswordErrors]         = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess]       = useState("");
  const [passwordProcessing, setPasswordProcessing] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadAvatar = async () => {
    try {
      const res = await api.get("/admin/photo", { responseType: "blob" });
      setAvatarUrl(URL.createObjectURL(res.data));
    } catch {
      setAvatarUrl(null);
    }
  };

  useEffect(() => {
    api.get("/admin/me")
      .then(res => {
        setAdminInfo(res.data);
        setProfileForm({ name: res.data.name, email: res.data.email });
        if (res.data.profile_url) loadAvatar();
      })
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return alert("File size must be less than 2MB");

    setAvatarProcessing(true);
    setAvatarSuccess("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      await api.post("/admin/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadAvatar();
      setAvatarSuccess("Profile picture updated!");
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setAvatarProcessing(false);
      e.target.value = "";
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileProcessing(true);
    setProfileErrors({});
    setProfileSuccess("");

    try {
      await api.put("/admin/profile", profileForm);
      setAdminInfo(prev => ({ ...prev, name: profileForm.name, email: profileForm.email }));
      setProfileSuccess("Profile updated successfully!");
      setIsEditing(false);
      localStorage.setItem("name", profileForm.name);
    } catch (err: any) {
      if (err.response?.data?.errors) setProfileErrors(err.response.data.errors);
      else if (err.response?.data?.message) setProfileErrors({ email: err.response.data.message });
    } finally {
      setProfileProcessing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordProcessing(true);
    setPasswordErrors({});
    setPasswordSuccess("");

    try {
      await api.post("/admin/change-password", passwordForm);
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err: any) {
      if (err.response?.data?.errors) setPasswordErrors(err.response.data.errors);
      else if (err.response?.data?.message) setPasswordErrors({ current_password: err.response.data.message });
    } finally {
      setPasswordProcessing(false);
    }
  };

  const setPasswordField = (key: string, value: string) =>
    setPasswordForm(prev => ({ ...prev, [key]: value }));

  const setProfileField = (key: string, value: string) =>
    setProfileForm(prev => ({ ...prev, [key]: value }));

  const PasswordInput = ({
    field, label, show, onToggle,
  }: {
    field: keyof typeof passwordForm;
    label: string;
    show: boolean;
    onToggle: () => void;
  }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={passwordForm[field]}
          onChange={e => setPasswordField(field, e.target.value)}
          placeholder="••••••••"
          required
          style={{ ...inputStyle, paddingRight: "2.5rem" }}
          onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
          onBlur={e => (e.currentTarget.style.boxShadow = "none")}
        />
        <button
          type="button" onClick={onToggle}
          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}
        >
          {show ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {passwordErrors[field] && <p style={errorStyle}>{passwordErrors[field]}</p>}
    </div>
  );

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", maxWidth: "48rem", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>My Profile</h1>
          <p style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.25rem" }}>Manage your profile information and password</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "50%", padding: "0.75rem", display: "flex" }}>
          <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", marginBottom: "1.5rem", overflow: "hidden" }}>

        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Profile Information</h2>
          </div>

          {!loadingInfo && (
            <button
              onClick={() => {
                setIsEditing(p => !p);
                setProfileErrors({});
                setProfileSuccess("");
                if (isEditing) setProfileForm({ name: adminInfo.name, email: adminInfo.email });
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: isEditing ? "none" : "#eef2ff", border: isEditing ? "1px solid #e5e7eb" : "none", color: isEditing ? "#6b7280" : "#4f46e5", borderRadius: "0.5rem", padding: "0.375rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              {isEditing ? (
                <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
              ) : (
                <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>Edit Profile</>
              )}
            </button>
          )}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {loadingInfo ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
              <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : (
            <>
              {/* ── Avatar Section ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", overflow: "hidden", border: "3px solid #e0e7ff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", background: "#f3f4f6" }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2ff" }}>
                        <svg width="32" height="32" fill="none" stroke="#a5b4fc" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <label
                    style={{ position: "absolute", bottom: "-2px", right: "-2px", background: avatarProcessing ? "#c7d2fe" : "#4f46e5", color: "#fff", padding: "0.3rem", borderRadius: "50%", cursor: avatarProcessing ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex" }}
                    onMouseEnter={e => !avatarProcessing && (e.currentTarget.style.background = "#4338ca")}
                    onMouseLeave={e => !avatarProcessing && (e.currentTarget.style.background = "#4f46e5")}
                  >
                    {avatarProcessing ? (
                      <div style={{ width: "14px", height: "14px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} disabled={avatarProcessing} />
                  </label>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{adminInfo.name || "Admin"}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.125rem" }}>Click the pencil icon to change photo</p>
                  <p style={{ fontSize: "0.7rem", color: "#d1d5db", marginTop: "0.125rem" }}>JPG, PNG, WEBP — max 2MB</p>
                  {avatarSuccess && (
                    <p style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "0.25rem", fontWeight: 500 }}>✓ {avatarSuccess}</p>
                  )}
                </div>
              </div>

              {/* ── Edit Form or View Mode ── */}
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileField("name", e.target.value)} required style={inputStyle}
                      onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                      onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
                    {profileErrors.name && <p style={errorStyle}>{profileErrors.name}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileField("email", e.target.value)} required style={inputStyle}
                      onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                      onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
                    {profileErrors.email && <p style={errorStyle}>{profileErrors.email}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Role</label>
                    <div style={{ ...inputStyle, background: "#f9fafb", color: "#9ca3af", display: "flex", alignItems: "center" }}>
                      {adminInfo.role || "Admin"}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button type="button"
                      onClick={() => { setIsEditing(false); setProfileForm({ name: adminInfo.name, email: adminInfo.email }); }}
                      style={{ padding: "0.625rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={profileProcessing}
                      style={{ padding: "0.625rem 1.25rem", background: profileProcessing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: profileProcessing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                      onMouseEnter={e => !profileProcessing && (e.currentTarget.style.background = "#4338ca")}
                      onMouseLeave={e => !profileProcessing && (e.currentTarget.style.background = "#4f46e5")}>
                      {profileProcessing ? (
                        <><div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Saving...</>
                      ) : (
                        <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {profileSuccess && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.625rem 1rem" }}>
                      <svg width="15" height="15" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      <p style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 500 }}>{profileSuccess}</p>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{adminInfo.name || "—"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{adminInfo.email || "—"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4f46e5", background: "#eef2ff", borderRadius: "9999px", padding: "0.2rem 0.75rem", display: "inline-block", width: "fit-content" }}>
                        {adminInfo.role || "Admin"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Change Password Card ── */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <PasswordInput field="current_password"          label="Current Password *"     show={showCurrent} onToggle={() => setShowCurrent(p => !p)} />
          <PasswordInput field="new_password"              label="New Password *"          show={showNew}     onToggle={() => setShowNew(p => !p)} />
          <PasswordInput field="new_password_confirmation" label="Confirm New Password *" show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "0.5rem", padding: "0.75rem 1rem" }}>
            <svg width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "0.125rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.5 }}>
              Password must be at least <strong>8 characters</strong> long.
            </p>
          </div>

          {passwordSuccess && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.75rem 1rem" }}>
              <svg width="16" height="16" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500 }}>{passwordSuccess}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={passwordProcessing}
              style={{ padding: "0.625rem 1.5rem", background: passwordProcessing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: passwordProcessing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "background 0.15s" }}
              onMouseEnter={e => !passwordProcessing && (e.currentTarget.style.background = "#4338ca")}
              onMouseLeave={e => !passwordProcessing && (e.currentTarget.style.background = "#4f46e5")}>
              {passwordProcessing ? (
                <><div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Updating...</>
              ) : (
                <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}