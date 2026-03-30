// src/pages/Admin/tabs/AddDepartmentTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface Department {
  id: number;
  degree_program: string;
  college: string;
  created_at: string;
}

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

export default function AddDepartmentTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState<number | null>(null);
  const [form, setForm] = useState({ degree_program: "", college: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors: Record<string, string> = {};
    if (!form.degree_program.trim()) {
      validationErrors.degree_program = "Degree program is required";
    }
    if (!form.college.trim()) {
      validationErrors.college = "College name is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setProcessing(true);
    try {
      await api.post("/admin/departments", form);
      await fetchDepartments();
      setForm({ degree_program: "", college: "" });
      setShowModal(false);
      setSuccess("Department added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message ?? "Failed to add department.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    setDeleteProcessing(id);
    try {
      await api.delete(`/admin/departments/${id}`);
      await fetchDepartments();
    } catch (err) {
      console.error("Failed to delete department:", err);
      alert("Failed to delete department.");
    } finally {
      setDeleteProcessing(null);
    }
  };

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem", textAlign: "center" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
            🏛️
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Portal</h1>
            <p style={{ color: "#bfdbfe", fontSize: "0.8rem" }}>Manage Departments</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", padding: "0.375rem 0.875rem", borderRadius: "9999px", fontSize: "0.75rem" }}>
          <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "#4ade80" }} />
          Admin Access
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="20" height="20" fill="none" stroke="#15803d" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span style={{ color: "#15803d", fontSize: "0.875rem" }}>{success}</span>
        </div>
      )}

      {/* Main Card */}
      <div style={glassCardStyle}>
        
        {/* Card Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Departments List</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
              Manage all academic departments and colleges
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: "#003366", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
            onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            Add Department
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ width: "2rem", height: "2rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <svg width="48" height="48" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ margin: "0 auto 1rem" }}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No departments found</p>
            <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.25rem" }}>Click "Add Department" to create one</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Degree Program</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>College</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Created</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "right", fontWeight: 600, color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={dept.id} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "0.75rem 1.5rem", color: "#64748b", fontFamily: "monospace", fontSize: "0.75rem" }}>#{dept.id}</td>
                    <td style={{ padding: "0.75rem 1.5rem", fontWeight: 600, color: "#1e293b" }}>{dept.degree_program}</td>
                    <td style={{ padding: "0.75rem 1.5rem", color: "#1e293b" }}>{dept.college}</td>
                    <td style={{ padding: "0.75rem 1.5rem", color: "#64748b", fontSize: "0.75rem" }}>
                      {new Date(dept.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        disabled={deleteProcessing === dept.id}
                        style={{
                          padding: "0.375rem 0.75rem",
                          border: "1px solid #fecaca",
                          borderRadius: "0.375rem",
                          background: deleteProcessing === dept.id ? "#fee2e2" : "#fff",
                          color: deleteProcessing === dept.id ? "#94a3b8" : "#ef4444",
                          fontSize: "0.75rem",
                          cursor: deleteProcessing === dept.id ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          transition: "all 0.2s",
                        }}
                      >
                        {deleteProcessing === dept.id ? (
                          <>
                            <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid #e2e8f0", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748b" }}>
              <span>Total departments: <strong>{departments.length}</strong></span>
              <button
                onClick={fetchDepartments}
                style={{ background: "none", border: "none", color: "#003366", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "28rem" }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Add New Department</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Degree Program *</label>
                  <input
                    type="text"
                    value={form.degree_program}
                    onChange={e => setForm({ ...form, degree_program: e.target.value })}
                    placeholder="e.g., CCS, CBA, CTE"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,51,102,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {errors.degree_program && (
                    <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.degree_program}</p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>College Name *</label>
                  <input
                    type="text"
                    value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g., College of Computer Studies"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,51,102,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {errors.college && (
                    <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.college}</p>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: "0.5rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#64748b", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    style={{ padding: "0.5rem 1.25rem", background: processing ? "#cbd5e1" : "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: processing ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => { if (!processing) e.currentTarget.style.background = "#004c99"; }}
                    onMouseLeave={e => { if (!processing) e.currentTarget.style.background = "#003366"; }}
                  >
                    {processing ? "Adding..." : "Add Department"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}