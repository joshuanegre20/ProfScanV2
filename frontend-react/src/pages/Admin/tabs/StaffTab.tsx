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

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

export default function StaffTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [avatars, setAvatars] = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadAvatar = useCallback(async (s: Staff) => {
    if (!s.profile_url) return;
    setAvatars(prev => {
      if (prev[s.id]) return prev;
      return prev;
    });
    try {
      const res = await api.get(`/staff/${s.id}/photo`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      setAvatars(prev => ({ ...prev, [s.id]: url }));
    } catch {}
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get("/staff", { params: { search } });
      setStaff(res.data);
      res.data.forEach((s: Staff) => {
        if (s.profile_url) loadAvatar(s);
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, loadAvatar]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/staff/${id}`);
      setStaff(prev => prev.filter(s => s.id !== id));
      if (avatars[id]) {
        URL.revokeObjectURL(avatars[id]);
        setAvatars(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/staff/${id}/status`, { status: newStatus });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch {}
  };

  const Avatar = ({ s }: { s: Staff }) => (
    <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg, #003366, #0055a4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {avatars[s.id] ? (
        <img
          src={avatars[s.id]}
          alt={s.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <svg width="20" height="20" fill="none" stroke="#ffd700" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1e293b" }}>Staff</h1>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.125rem" }}>
            {staff.length} member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text" placeholder="Search staff..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "0.5rem 1rem 0.5rem 2.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", width: "200px", background: "#fff", color: "#1e293b" }}
            />
            <svg style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)" }} width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
            </svg>
          </div>
          <button onClick={() => setActiveTab("add-staff")}
            style={{ padding: "0.5rem 1rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
            onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
          >
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
          <div style={{ width: "2rem", height: "2rem", border: "3px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "1rem", border: "1px dashed #e2e8f0" }}>
          <p style={{ fontWeight: 600, color: "#1e293b" }}>No staff found</p>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.375rem" }}>
            Click Add Staff to register a new member.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {staff.map(s => (
            <div key={s.id} style={{ ...glassCardStyle, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <Avatar s={s} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.email}</p>
                </div>
              </div>

              {/* Contact */}
              {s.contact_no && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="13" height="13" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "#475569" }}>{s.contact_no}</span>
                </div>
              )}

              {/* Status + role */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#eef2ff", color: "#003366", textTransform: "uppercase" }}>
                  Staff
                </span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: s.status === "Active" ? "#dcfce7" : "#f1f5f9", color: s.status === "Active" ? "#15803d" : "#64748b", textTransform: "uppercase" }}>
                  {s.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
               
                <button onClick={() => handleDelete(s.id, s.name)} disabled={deleting === s.id}
                  style={{ padding: "0.4rem 0.75rem", border: "1px solid #fecaca", borderRadius: "0.5rem", background: "#fff", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
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