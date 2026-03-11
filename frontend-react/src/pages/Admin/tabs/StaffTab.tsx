// src/pages/Admin/tabs/StaffTab.tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../api/axios";

interface Staff {
  id: number;
  name: string;
  email: string;
  contact_no: string | null;
  status: string;
  profile_url: string | null;
}

export default function StaffTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [avatars, setAvatars]   = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get("/staff", { params: { search } });
      setStaff(res.data);
      // Load avatars for staff with photos
      res.data.forEach(async (s: Staff) => {
        if (s.profile_url && !avatars[s.id]) {
          try {
            const img = await api.get(`/staff/${s.id}/photo`, { responseType: "blob" });
            setAvatars(prev => ({ ...prev, [s.id]: URL.createObjectURL(img.data) }));
          } catch {}
        }
      });
    } catch {}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/staff/${id}`);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/staff/${id}/status`, { status: newStatus });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch {}
  };

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937" }}>Staff</h1>
          <p style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.125rem" }}>{staff.length} member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text" placeholder="Search staff..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "0.5rem 1rem 0.5rem 2.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", width: "200px" }}
            />
            <svg style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)" }} width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
            </svg>
          </div>
          <button onClick={() => setActiveTab("add-staff")}
            style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "2rem", height: "2rem", border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "1rem", border: "1px dashed #e5e7eb" }}>
          <p style={{ fontWeight: 600, color: "#1f2937" }}>No staff found</p>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.375rem" }}>Click Add Staff to register a new member.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {staff.map(s => (
            <div key={s.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", overflow: "hidden", background: "#eef2ff", border: "2px solid #e0e7ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {avatars[s.id] ? (
                    <img src={avatars[s.id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="#a5b4fc" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.email}</p>
                </div>
              </div>

              {/* Contact */}
              {s.contact_no && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="13" height="13" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.contact_no}</span>
                </div>
              )}

              {/* Status + role */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#eef2ff", color: "#4f46e5", textTransform: "uppercase" }}>Staff</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: s.status === "Active" ? "#dcfce7" : "#f3f4f6", color: s.status === "Active" ? "#16a34a" : "#9ca3af", textTransform: "uppercase" }}>
                  {s.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
                <button onClick={() => handleToggleStatus(s.id, s.status)}
                  style={{ flex: 1, padding: "0.4rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", color: "#374151", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                  {s.status === "Active" ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(s.id, s.name)} disabled={deleting === s.id}
                  style={{ padding: "0.4rem 0.75rem", border: "1px solid #fecaca", borderRadius: "0.5rem", background: "#fff", color: "#dc2626", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                  {deleting === s.id ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}