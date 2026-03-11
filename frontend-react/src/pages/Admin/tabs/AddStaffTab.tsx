// src/pages/Admin/tabs/AddStaffTab.tsx
import React, { useState, useRef } from "react";
import api from "../../../api/axios";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1f2937",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const errorStyle: React.CSSProperties = {
  color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem",
};

export default function AddStaffTab() {
  const [form, setForm] = useState({ name: "", email: "", contact_no: "" });
  const [photo, setPhoto]           = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState<{ name: string; email: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const formData = new FormData();
    formData.append("name",       form.name);
    formData.append("email",      form.email);
    formData.append("contact_no", form.contact_no);
    if (photo) formData.append("photo", photo);

    try {
      await api.post("/staff", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess({ name: form.name, email: form.email });
      setForm({ name: "", email: "", contact_no: "" });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: "32rem", margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ width: "4rem", height: "4rem", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <svg width="28" height="28" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f2937" }}>Staff Added!</h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.375rem" }}>{success.name} — {success.email}</p>
        <button
          onClick={() => setSuccess(null)}
          style={{ marginTop: "1.5rem", padding: "0.625rem 1.5rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
          Add Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "36rem", margin: "0 auto", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Add Staff</h1>
        <p style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.25rem" }}>Register a new staff member</p>
      </div>

      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", padding: "1.5rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width: "6rem", height: "6rem", borderRadius: "50%", border: "2px dashed #c7d2fe", background: "#f5f3ff", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {photoPreview ? (
                <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <svg width="28" height="28" fill="none" stroke="#a5b4fc" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ fontSize: "0.75rem", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {photoPreview ? "Change Photo" : "Upload Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>

          <div>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required style={inputStyle}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required style={inputStyle}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div>
            <label style={labelStyle}>Contact No</label>
            <input type="text" value={form.contact_no} onChange={e => set("contact_no", e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
            {errors.contact_no && <p style={errorStyle}>{errors.contact_no}</p>}
          </div>

          <button type="submit" disabled={processing}
            style={{ padding: "0.75rem", background: processing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            onMouseEnter={e => !processing && (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={e => !processing && (e.currentTarget.style.background = "#4f46e5")}>
            {processing
              ? <><div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Adding...</>
              : "Add Staff Member"
            }
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}