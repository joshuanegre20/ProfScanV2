// src/pages/Staff/tabs/ProfileTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface StaffProfile {
  id: number;
  name: string;
  email: string;
  staff_id: string;
  contact_no?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  age?: number;
  status: string;
  role: string;
  created_at: string;
  profile_url?: string | null;
}

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
  borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

export default function ProfileTab() {
  const [profile, setProfile]   = useState<StaffProfile | null>(null);
  const [photo, setPhoto]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]         = useState<Partial<StaffProfile>>({});
  const [success, setSuccess]   = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff/me");
      const data: StaffProfile = res.data?.data ?? res.data;
      setProfile(data);
      setForm(data ?? {});

      // Fetch photo as blob if profile_url exists
      if (data?.profile_url) {
        api.get("/staff/photo/me", { responseType: "blob" })
          .then(r => setPhoto(URL.createObjectURL(r.data)))
          .catch(() => setPhoto(null));
      } else {
        setPhoto(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please upload an image file.");
    if (file.size > 2 * 1024 * 1024) return alert("Max file size is 2MB.");

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      await api.post("/staff/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Re-fetch profile to get new photo
      fetchProfile();
    } catch {
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/staff/profile", {
        name:       form.name,
        email:      form.email,
        contact_no: form.contact_no,
        address:    form.address,
        gender:     form.gender,
      });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "S";

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Loading profile...</div>;

  if (!profile) return (
    <div style={{ ...card, padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
      <p>Profile not found.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {success && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.875rem 1.25rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <svg width="16" height="16" fill="none" stroke="#15803d" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 600 }}>Profile updated successfully!</span>
        </div>
      )}

      <div style={card}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>

          {/* Avatar with upload */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {photo ? (
              <img src={photo} alt="Profile"
                style={{ width: "5rem", height: "5rem", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
            ) : (
              <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "#fff", border: "3px solid rgba(255,255,255,0.3)" }}>
                {initials}
              </div>
            )}
            {/* Upload overlay */}
            {!uploading ? (
              <label style={{ position: "absolute", bottom: 0, right: 0, background: "#4f46e5", border: "2px solid #fff", borderRadius: "50%", width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="Change photo">
                <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              </label>
            ) : (
              <div style={{ position: "absolute", bottom: 0, right: 0, background: "#4f46e5", border: "2px solid #fff", borderRadius: "50%", width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{profile.name}</h2>
            <p style={{ color: "#a5b4fc", fontSize: "0.875rem", marginTop: "0.25rem" }}>{profile.email}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                {profile.staff_id}
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: profile.status === "Active" ? "#dcfce7" : "#fee2e2", color: profile.status === "Active" ? "#15803d" : "#dc2626" }}>
                {profile.status}
              </span>
            </div>
          </div>

          <button onClick={() => { setEditing(!editing); if (editing) setForm(profile); }}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Details */}
        <div style={{ padding: "1.5rem 2rem" }}>
          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", color:'black' }}>
              {[
                { label: "Full Name",  key: "name",       type: "text" },
                { label: "Email",      key: "email",      type: "email" },
                { label: "Contact No", key: "contact_no", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender ?? ""} onChange={e => setForm({ ...form, gender: e.target.value })} style={inputStyle}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <textarea value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button onClick={() => { setEditing(false); setForm(profile); }} style={{ padding: "0.5rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#6b7280" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: "0.5rem 1.25rem", background: saving ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              {[
                { label: "Staff ID",    value: profile.staff_id },
                { label: "Email",       value: profile.email },
                { label: "Contact No",  value: profile.contact_no || "—" },
                { label: "Gender",      value: profile.gender || "—" },
                { label: "Birth Date",  value: profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : "—" },
                { label: "Age",         value: profile.age ? String(profile.age) : "—" },
                { label: "Member Since",value: new Date(profile.created_at).toLocaleDateString("en-PH", { month: "long", year: "numeric" }) },
                { label: "Address",     value: profile.address || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ ...labelStyle, marginBottom: "0.2rem" }}>{label}</p>
                  <p style={{ fontSize: "0.875rem", color: "#1f2937", fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}