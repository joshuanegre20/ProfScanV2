// src/pages/Admin/tabs/AddStaffTab.tsx
import React, { useState, useRef } from "react";
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

const defaultForm = {
  name: "", email: "", password: "", password_confirmation: "",
  contact_no: "", address: "", age: "", gender: "", birth_date: "",
};

export default function AddStaffTab() {
  const [form, setForm]               = useState(defaultForm);
  const [photo, setPhoto]             = useState("/images/default-avatar.png");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [processing, setProcessing]   = useState(false);
  const [success, setSuccess]         = useState<{ name: string; email: string } | null>(null);

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return alert("File size must be less than 2MB");
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "") formData.append(key, value);
      });
      formData.append("role", "staff");
      if (selectedFile) formData.append("photo", selectedFile);

      await api.post("/staff", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess({ name: form.name, email: form.email });
      setForm(defaultForm);
      setPhoto("/images/default-avatar.png");
      setSelectedFile(null);

    } catch (err: any) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      else alert(err.message ?? "Failed to add staff. Please check all fields.");
    } finally {
      setProcessing(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.12)", border: "1px solid #f3f4f6", padding: "2.5rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.25rem" }}>Staff Added!</h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
            <strong>{success.name}</strong> has been registered successfully.
          </p>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "1.5rem" }}>{success.email}</p>
          <button onClick={() => setSuccess(null)}
            style={{ padding: "0.625rem 1.5rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}>
            Add Another
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem", textAlign: "center" }}>
          <img src="/images/tmclogo2.png" alt="TMC" style={{ width: "3rem", height: "3rem", objectFit: "contain" }} onError={e => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Portal</h1>
            <p style={{ color: "#fecaca", fontSize: "0.8rem" }}>Add New Staff Member</p>
          </div>
        </div>
        
      </div>

      {/* Form Card */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden" }}>

        {/* Avatar Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "6rem", height: "6rem", borderRadius: "50%", overflow: "hidden", border: "4px solid #fee2e2", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <img src={photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setPhoto("/images/default-avatar.png")} />
            </div>
            <label
              style={{ position: "absolute", bottom: "-2px", right: "-2px", background: "#dc2626", color: "#fff", padding: "0.375rem", borderRadius: "50%", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
              onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
            </label>
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>Staff Information</h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>Fill in the details to create a new staff account</p>
            {selectedFile && <p style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "0.25rem" }}>✓ {selectedFile.name}</p>}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Account Details */}
          <section>
            <h3 style={{ fontSize: "0.7rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Account Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {[
                { key: "name",                  label: "Full Name *",          placeholder: "John Doe",        required: true },
                { key: "email",                 label: "Email Address *",      placeholder: "john@tmc.edu.ph", type: "email", required: true },
                { key: "contact_no",            label: "Contact Number",       placeholder: "09XX-XXX-XXXX" },
                { key: "password",              label: "Temporary Password *", placeholder: "••••••••",        type: "password", required: true },
                { key: "password_confirmation", label: "Confirm Password *",   placeholder: "••••••••",        type: "password", required: true },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={(form as any)[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {errors[field.key] && <p style={errorStyle}>{errors[field.key]}</p>}
                </div>
              ))}
            </div>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6" }} />

          {/* Personal Info */}
          <section>
            <h3 style={{ fontSize: "0.7rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input type="number" value={form.age} onChange={e => set("age", e.target.value)}
                  placeholder="Enter age" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)")}
                  onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
                {errors.age && <p style={errorStyle}>{errors.age}</p>}
              </div>
              <div>
                <label style={labelStyle}>Birth Date</label>
                <input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)")}
                  onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
                {errors.birth_date && <p style={errorStyle}>{errors.birth_date}</p>}
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                  {["Male", "Female"].map(g => (
                    <label key={g} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151", cursor: "pointer" }}>
                      <input type="radio" name="gender" value={g} checked={form.gender === g}
                        onChange={e => set("gender", e.target.value)} style={{ accentColor: "#dc2626" }} />
                      {g}
                    </label>
                  ))}
                </div>
                {errors.gender && <p style={errorStyle}>{errors.gender}</p>}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="Enter complete address" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)")}
                  onBlur={e => (e.currentTarget.style.boxShadow = "none")} />
                {errors.address && <p style={errorStyle}>{errors.address}</p>}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button"
              onClick={() => { setForm(defaultForm); setPhoto("/images/default-avatar.png"); setSelectedFile(null); }}
              style={{ padding: "0.625rem 1.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={processing}
              style={{ padding: "0.625rem 1.5rem", background: processing ? "#fecaca" : "#dc2626", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
              onMouseEnter={e => !processing && (e.currentTarget.style.background = "#b91c1c")}
              onMouseLeave={e => !processing && (e.currentTarget.style.background = "#dc2626")}>
              {processing
                ? <><div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creating...</>
                : "Add Staff Member →"}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}