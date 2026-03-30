// src/pages/Admin/tabs/AddInstructorTab.tsx
import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import QRCode from "qrcode";
import api from "../../../api/axios";

interface Subject {
  id: number;
  subject: string;
  subject_code: string;
  department: string;
}

interface Department {
  id: number;
  degree_program: string;
  college: string;
  created_at: string;
}

const defaultForm = {
  name: "", email: "", password: "", password_confirmation: "",
  employee_id: "", address: "", age: "", gender: "", contact_no: "",
  birth_date: "", department: "", specialization: "",
};

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e2e8f0",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1e293b",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const errorStyle: React.CSSProperties = {
  color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem",
};

export default function AddInstructorTab() {
  const [form, setForm] = useState(defaultForm);
  const [photo, setPhoto] = useState("/images/default-avatar.png");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<{
    qrBase64: string;
    instructorName: string;
    employeeId: string;
  } | null>(null);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (form.department) {
      const filtered = subjects.filter(s => s.department === form.department);
      setFilteredSubjects(filtered);
      if (form.specialization) {
        const currentSubject = subjects.find(s => s.subject === form.specialization);
        if (currentSubject && currentSubject.department !== form.department) {
          setForm(prev => ({ ...prev, specialization: "" }));
        }
      }
    } else {
      setFilteredSubjects([]);
    }
  }, [form.department, subjects]);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await api.get("/admin/departments");
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await api.get("/admin/subjects");
      if (Array.isArray(response.data)) {
        setSubjects(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setSubjects(response.data.data);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
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
    setSuccessData(null);

    try {
      // FIX: Generate QR code with SMALL data (just the employee ID)
      // Don't store the QR image, store the plain text/ID instead
      const qrPayload = form.employee_id; // Just the employee ID, not the QR image
      
      // Generate QR code image for display only
      const qrBase64 = await QRCode.toDataURL(form.employee_id, {
        width: 300,
        margin: 2,
        color: { dark: "#003366", light: "#ffffff" },
        errorCorrectionLevel: 'L' // Low error correction for more capacity
      });

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "") formData.append(key, value);
      });
      if (selectedFile) formData.append("photo", selectedFile);
      
      // Store the simple payload (employee ID) instead of the QR image
      formData.append("qr_payload", qrPayload);

      await api.post("/admin/instructors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessData({
        qrBase64,
        instructorName: form.name,
        employeeId: form.employee_id,
      });

      setForm(defaultForm);
      setPhoto("/images/default-avatar.png");
      setSelectedFile(null);

    } catch (err: any) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      else alert(err.message ?? "Failed to add instructor. Please check all fields.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadQR = () => {
    if (!successData) return;
    const link = document.createElement("a");
    link.href = successData.qrBase64;
    link.download = `qr-${successData.employeeId}.png`;
    link.click();
  };

  const subjectsByDepartment = subjects.reduce((acc, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  if (successData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ ...glassCardStyle, padding: "2.5rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="24" height="24" fill="none" stroke="#15803d" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>Instructor Added!</h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
            QR code generated for <strong>{successData.instructorName}</strong>
          </p>
          <p style={{ fontSize: "0.75rem", color: "#003366", background: "#eef2ff", borderRadius: "0.375rem", padding: "0.25rem 0.75rem", display: "inline-block", marginBottom: "1.5rem", fontWeight: 600 }}>
            {successData.employeeId}
          </p>
          <div style={{ display: "inline-block", padding: "1rem", background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: "0.75rem", marginBottom: "1rem" }}>
            <img src={successData.qrBase64} alt="Instructor QR Code" style={{ width: "200px", height: "200px", display: "block" }} />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1.5rem" }}>Scan to retrieve Employee ID · Saved to instructor's profile</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button onClick={handleDownloadQR} style={{ padding: "0.625rem 1.25rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
              onMouseLeave={e => (e.currentTarget.style.background = "#003366")}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR
            </button>
            <button onClick={() => setSuccessData(null)} style={{ padding: "0.625rem 1.25rem", background: "none", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem", textAlign: "center" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
            👨‍🏫
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Portal</h1>
            <p style={{ color: "#bfdbfe", fontSize: "0.8rem" }}>Add New Instructor</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div style={glassCardStyle}>

        {/* Avatar Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "6rem", height: "6rem", borderRadius: "50%", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <img src={photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setPhoto("/images/default-avatar.png")} />
            </div>
            <label style={{ position: "absolute", bottom: "-2px", right: "-2px", background: "#003366", color: "#fff", padding: "0.375rem", borderRadius: "50%", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
              onMouseLeave={e => (e.currentTarget.style.background = "#003366")}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
            </label>
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Instructor Information</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>Fill in the details to create a new instructor account</p>
            {selectedFile && <p style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: "0.25rem" }}>✓ {selectedFile.name}</p>}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Account Details */}
          <section>
            <h3 style={{ fontSize: "0.7rem", fontWeight: 700, color: "#003366", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Account Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {[
                { key: "employee_id", label: "Employee ID *", placeholder: "TMC-2024-001", required: true },
                { key: "name", label: "Full Name *", placeholder: "Prof. John Smith", required: true },
                { key: "email", label: "Email Address *", placeholder: "john@tmc.edu.ph", type: "email", required: true },
                { key: "contact_no", label: "Contact Number *", placeholder: "09XX-XXX-XXXX", required: true },
                { key: "password", label: "Temporary Password *", placeholder: "••••••••", type: "password", required: true },
                { key: "password_confirmation", label: "Confirm Password *", placeholder: "••••••••", type: "password", required: true },
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
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,51,102,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {errors[field.key] && <p style={errorStyle}>{errors[field.key]}</p>}
                </div>
              ))}
            </div>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} />

          {/* Academic Info */}
          <section>
            <h3 style={{ fontSize: "0.7rem", fontWeight: 700, color: "#003366", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Academic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              
              <div>
                <label style={labelStyle}>
                  Department *
                  {loadingDepartments && <span style={{ marginLeft: "0.5rem", color: "#94a3b8", fontSize: "0.7rem" }}>(Loading...)</span>}
                </label>
                <select 
                  value={form.department} 
                  onChange={e => set("department", e.target.value)} 
                  required 
                  style={inputStyle}
                  disabled={loadingDepartments}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.degree_program}>
                      {dept.degree_program} — {dept.college}
                    </option>
                  ))}
                  {departments.length === 0 && !loadingDepartments && (
                    <option value="" disabled>No departments available</option>
                  )}
                </select>
                {errors.department && <p style={errorStyle}>{errors.department}</p>}
              </div>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Specialization (Subject) *
                  {loadingSubjects && <span style={{ marginLeft: "0.5rem", color: "#94a3b8", fontSize: "0.7rem" }}>(Loading...)</span>}
                  {!form.department && <span style={{ marginLeft: "0.5rem", color: "#f59e0b", fontSize: "0.7rem" }}>Select department first</span>}
                </label>
                
                {form.department ? (
                  <select
                    value={form.specialization}
                    onChange={e => set("specialization", e.target.value)}
                    required
                    style={inputStyle}
                    disabled={loadingSubjects}
                  >
                    <option value="">Select a subject specialization</option>
                    {filteredSubjects.map(subject => (
                      <option key={subject.id} value={subject.subject}>
                        {subject.subject_code} — {subject.subject}
                      </option>
                    ))}
                    {filteredSubjects.length === 0 && !loadingSubjects && (
                      <option value="" disabled>No subjects available for this department</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={e => set("specialization", e.target.value)}
                    placeholder="Please select a department first"
                    disabled
                    style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }}
                  />
                )}
                {errors.specialization && <p style={errorStyle}>{errors.specialization}</p>}
              </div>
            </div>
          </section>

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} />

          {/* Personal Info */}
          <section>
            <h3 style={{ fontSize: "0.7rem", fontWeight: 700, color: "#003366", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Age *</label>
                <input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="Enter age" required style={inputStyle} />
                {errors.age && <p style={errorStyle}>{errors.age}</p>}
              </div>
              <div>
                <label style={labelStyle}>Birth Date *</label>
                <input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} required style={inputStyle} />
                {errors.birth_date && <p style={errorStyle}>{errors.birth_date}</p>}
              </div>
              <div>
                <label style={labelStyle}>Gender *</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                  {["Male", "Female"].map(g => (
                    <label key={g} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#1e293b", cursor: "pointer" }}>
                      <input type="radio" name="gender" value={g} checked={form.gender === g}
                        onChange={e => set("gender", e.target.value)} style={{ accentColor: "#003366" }} />
                      {g}
                    </label>
                  ))}
                </div>
                {errors.gender && <p style={errorStyle}>{errors.gender}</p>}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address *</label>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Enter complete address" required style={inputStyle} />
                {errors.address && <p style={errorStyle}>{errors.address}</p>}
              </div>
            </div>
          </section>

          {/* Info Notice */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#eef2ff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.875rem 1rem" }}>
            <svg width="16" height="16" fill="none" stroke="#003366" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "0.125rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: "0.8rem", color: "#003366", lineHeight: 1.5 }}>
              A QR code encoding the <strong>Employee ID</strong> will be automatically generated and saved to the instructor's profile after creation.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" onClick={() => { setForm(defaultForm); setPhoto("/images/default-avatar.png"); setSelectedFile(null); }}
              style={{ padding: "0.625rem 1.5rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              Cancel
            </button>
            <button type="submit" disabled={processing}
              style={{ padding: "0.625rem 1.5rem", background: processing ? "#cbd5e1" : "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "background 0.2s" }}
              onMouseEnter={e => !processing && (e.currentTarget.style.background = "#004c99")}
              onMouseLeave={e => !processing && (e.currentTarget.style.background = "#003366")}>
              {processing ? (
                <>
                  <div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Creating...
                </>
              ) : "Add Instructor →"}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}