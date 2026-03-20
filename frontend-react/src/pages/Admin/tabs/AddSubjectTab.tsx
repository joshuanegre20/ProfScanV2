// src/pages/Admin/tabs/AddSubjectTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

// Remove the hardcoded departments array

interface SubjectRow {
  id: string;
  subject: string;
  subject_code: string;
  department: string;
  errors: { subject?: string; subject_code?: string; department?: string };
}

interface SavedSubject {
  id: number;
  subject: string;
  subject_code: string;
  department: string;
  created_at: string;
}

interface Department {
  id: number;
  degree_program: string;
  college: string;
  created_at: string;
}

function makeRow(): SubjectRow {
  return {
    id:           Math.random().toString(36).slice(2),
    subject:      "",
    subject_code: "",
    department:   "",
    errors:       {},
  };
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%", padding: "0.625rem 1rem",
  border: `1px solid ${hasError ? "#fca5a5" : "#e5e7eb"}`,
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1f2937",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  background: hasError ? "#fff7f7" : "#fff",
  transition: "border-color 0.15s",
});

export default function AddSubjectTab() {
  const [rows, setRows] = useState<SubjectRow[]>([makeRow()]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [savedSubjects, setSavedSubjects] = useState<SavedSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState<number | null>(null);
  
  // New state for departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch subjects and departments on component mount
  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await api.get("/admin/subjects");
      console.log("Subjects API Response:", response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setSavedSubjects(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setSavedSubjects(response.data.data);
      } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
        setSavedSubjects(response.data.subjects);
      } else {
        console.error("Unexpected response structure:", response.data);
        setSavedSubjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setSavedSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await api.get("/admin/departments");
      console.log("Departments API Response:", response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        setDepartments(response.data.departments);
      } else {
        console.error("Unexpected departments response structure:", response.data);
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const update = (id: string, key: keyof SubjectRow, value: string) => {
    setRows(prev => prev.map(r =>
      r.id === id
        ? { ...r, [key]: value, errors: { ...r.errors, [key]: undefined } }
        : r
    ));
  };

  const addRow = () => setRows(prev => [...prev, makeRow()]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const validate = (): boolean => {
    let valid = true;
    setRows(prev => prev.map(r => {
      const errors: SubjectRow["errors"] = {};
      if (!r.subject.trim()) { errors.subject = "Required"; valid = false; }
      if (!r.subject_code.trim()) { errors.subject_code = "Required"; valid = false; }
      if (!r.department) { errors.department = "Required"; valid = false; }
      return { ...r, errors };
    }));
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);
    try {
      if (rows.length === 1) {
        // Single subject
        await api.post("/admin/subjects", {
          subject: rows[0].subject.trim(),
          subject_code: rows[0].subject_code.trim().toUpperCase(),
          department: rows[0].department,
        });
      } else {
        // Multiple subjects - use bulk endpoint
        await api.post("/admin/subjects/bulk", {
          subjects: rows.map(r => ({
            subject: r.subject.trim(),
            subject_code: r.subject_code.trim().toUpperCase(),
            department: r.department,
          }))
        });
      }
      
      setSuccess(rows.length);
      setRows([makeRow()]);
      await fetchSubjects(); // Refresh the list
    } catch (err: any) {
      console.error("Submit error:", err);
      
      if (err.response?.data?.errors) {
        if (err.response.data.errors.subjects) {
          alert("Some subjects failed validation. Check your input.");
        } else {
          setRows(prev => prev.map((r, i) =>
            i === 0 ? { ...r, errors: err.response.data.errors } : r
          ));
        }
      } else {
        alert(err.response?.data?.message ?? err.message ?? "Failed to save subjects.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    setDeleteProcessing(id);
    try {
      await api.delete(`/admin/subjects/${id}`);
      setSavedSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete subject:", err);
      alert("Failed to delete subject.");
    } finally {
      setDeleteProcessing(null);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (success !== null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", padding: "2.5rem", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
            {success} Subject{success !== 1 ? "s" : ""} Added!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
            All subjects have been saved successfully.
          </p>
          <button
            onClick={() => setSuccess(null)}
            style={{ padding: "0.625rem 1.5rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f46e5")}
          >
            Add More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem", textAlign: "center" }}>
          <img src="/images/tmclogo2.png" alt="TMC" style={{ width: "3rem", height: "3rem", objectFit: "contain" }} onError={e => (e.currentTarget.style.display = "none")} />
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Portal</h1>
            <p style={{ color: "#a5b4fc", fontSize: "0.8rem" }}>Add Subjects</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", padding: "0.375rem 0.875rem", borderRadius: "9999px", fontSize: "0.75rem" }}>
          <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "#4ade80" }} />
          Admin Access
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: "2rem" }}>

        {/* Card header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>Add New Subjects</h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>
              Add one or more subjects at once. Click <strong>+ Add Row</strong> to add more.
            </p>
          </div>
          <span style={{ fontSize: "0.75rem", background: "#eef2ff", color: "#4f46e5", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontWeight: 600 }}>
            {rows.length} row{rows.length !== 1 ? "s" : ""}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 200px 40px", gap: "0.75rem", padding: "0.75rem 1.5rem 0.5rem", borderBottom: "1px solid #f9fafb" }}>
            {["Subject Name", "Subject Code", "Department", ""].map(h => (
              <p key={h} style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((row, idx) => (
              <div
                key={row.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 200px 40px",
                  gap: "0.75rem", padding: "0.625rem 1.5rem",
                  background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "start",
                }}
              >
                {/* Subject name */}
                <div>
                  <input
                    type="text"
                    value={row.subject}
                    onChange={e => update(row.id, "subject", e.target.value)}
                    placeholder="e.g., Web Development"
                    style={inputStyle(!!row.errors.subject)}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {row.errors.subject && <p style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "0.2rem" }}>{row.errors.subject}</p>}
                </div>

                {/* Subject code */}
                <div>
                  <input
                    type="text"
                    value={row.subject_code}
                    onChange={e => update(row.id, "subject_code", e.target.value)}
                    placeholder="e.g., CS101"
                    style={{ ...inputStyle(!!row.errors.subject_code), fontFamily: "monospace", textTransform: "uppercase" }}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                  />
                  {row.errors.subject_code && <p style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "0.2rem" }}>{row.errors.subject_code}</p>}
                </div>

                {/* Department - Now from database */}
                <div>
                  <select
                    value={row.department}
                    onChange={e => update(row.id, "department", e.target.value)}
                    style={{ ...inputStyle(!!row.errors.department), color: row.department ? "#1f2937" : "#9ca3af" }}
                    onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                    onBlur={e => (e.currentTarget.style.boxShadow = "none")}
                    disabled={loadingDepartments}
                  >
                    <option value="">
                      {loadingDepartments ? "Loading departments..." : "Select department"}
                    </option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.degree_program}>
                        {dept.degree_program} — {dept.college.replace(/College of /, "")}
                      </option>
                    ))}
                    {departments.length === 0 && !loadingDepartments && (
                      <option value="" disabled>No departments available</option>
                    )}
                  </select>
                  {row.errors.department && <p style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "0.2rem" }}>{row.errors.department}</p>}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  style={{
                    width: "32px", height: "38px", border: "1px solid #fecaca",
                    borderRadius: "0.5rem", background: rows.length === 1 ? "#f9fafb" : "#fff",
                    color: rows.length === 1 ? "#d1d5db" : "#dc2626",
                    cursor: rows.length === 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onClick={addRow}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", border: "1px dashed #c7d2fe", borderRadius: "0.5rem", background: "#fafafe", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fafafe")}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} strokeLinecap="round" />
              </svg>
              Add Row
            </button>

            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button
                type="button"
                onClick={() => setRows([makeRow()])}
                style={{ padding: "0.625rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}
              >
                Clear All
              </button>
              <button
                type="submit"
                disabled={processing}
                style={{ padding: "0.625rem 1.5rem", background: processing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                onMouseEnter={e => !processing && (e.currentTarget.style.background = "#4338ca")}
                onMouseLeave={e => !processing && (e.currentTarget.style.background = "#4f46e5")}
              >
                {processing
                  ? <><div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Saving...</>
                  : `Save ${rows.length} Subject${rows.length !== 1 ? "s" : ""} →`
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Subjects List Section */}
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>Existing Subjects</h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>
              List of all subjects in the system
            </p>
          </div>
          <button
            onClick={fetchSubjects}
            style={{ padding: "0.375rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", fontSize: "0.75rem", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loadingSubjects ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ width: "2rem", height: "2rem", border: "2px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading subjects...</p>
          </div>
        ) : !savedSubjects || savedSubjects.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <svg width="48" height="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: "0 auto 1rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No subjects found</p>
            <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>Add subjects using the form above</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Code</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Name</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Created</th>
                  <th style={{ padding: "0.75rem 1.5rem", textAlign: "right", fontWeight: 600, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedSubjects.map((subject, idx) => {
                  // Find the department name for display
                  const dept = departments.find(d => d.degree_program === subject.department);
                  return (
                    <tr key={subject.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "0.75rem 1.5rem", color: "#6b7280", fontFamily: "monospace", fontSize: "0.75rem" }}>#{subject.id}</td>
                      <td style={{ padding: "0.75rem 1.5rem", fontWeight: 600, color: "#1f2937", fontFamily: "monospace" }}>{subject.subject_code}</td>
                      <td style={{ padding: "0.75rem 1.5rem", color: "#374151" }}>{subject.subject}</td>
                      <td style={{ padding: "0.75rem 1.5rem" }}>
                        <span style={{ background: "#eef2ff", color: "#4f46e5", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                          {dept ? dept.college : subject.department}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1.5rem", color: "#6b7280", fontSize: "0.75rem" }}>
                        {new Date(subject.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          disabled={deleteProcessing === subject.id}
                          style={{
                            padding: "0.375rem 0.75rem",
                            border: "1px solid #fecaca",
                            borderRadius: "0.375rem",
                            background: deleteProcessing === subject.id ? "#fee2e2" : "#fff",
                            color: deleteProcessing === subject.id ? "#9ca3af" : "#dc2626",
                            fontSize: "0.75rem",
                            cursor: deleteProcessing === subject.id ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {deleteProcessing === subject.id ? (
                            <>
                              <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #dc2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
                  );
                })}
              </tbody>
            </table>
            
            {/* Table footer with count */}
            <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#6b7280" }}>
              <span>Total subjects: <strong>{savedSubjects.length}</strong></span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}