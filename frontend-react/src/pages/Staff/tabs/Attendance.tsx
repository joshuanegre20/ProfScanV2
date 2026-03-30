// src/pages/Staff/tabs/MyAttendanceTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface AttendanceLog {
  id: number;
  instructor_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  subject?: string;
  code?: string;
  room?: string;
  day?: string;
}

interface Instructor {
  id: number;
  name: string;
  instructor_id: string;
  department: string;
  specialization: string;
  email: string;
  status: string;
  profile_url: string | null;
}

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const statusStyle = (status: string): React.CSSProperties => {
  const s = status?.toLowerCase();
  return {
    padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
    background: s === "present" ? "#dcfce7" : s === "absent" ? "#fee2e2" : s === "excused" ? "#fff3cd" : "#f1f5f9",
    color:      s === "present" ? "#15803d" : s === "absent" ? "#dc2626" : s === "excused" ? "#856404" : "#475569",
  };
};

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (src && !err) {
    return <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e2e8f0" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #003366, #0055a4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function MyAttendanceTab() {
  const [logs, setLogs]               = useState<AttendanceLog[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [photoCache, setPhotoCache]   = useState<Record<number, string>>({});
  const [loading, setLoading]         = useState(true);
  const [selectedMonth, setMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [profileModal, setProfileModal] = useState<Instructor | null>(null);
  const [search, setSearch] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");

  useEffect(() => { fetchInstructors(); }, []);
  useEffect(() => { fetchLogs(); }, [selectedMonth]);

  useSocket({
    room: "staff",
    onScan:             () => fetchLogs(),
    onAttendanceUpdate: () => fetchLogs(),
  });

  const fetchInstructors = async () => {
    try {
      const res = await api.get("/admin/instructors");
      const data: Instructor[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setInstructors(data);
      data.forEach(i => {
        if (i.profile_url) {
          api.get(`/admin/instructors/${i.id}/photo`, { responseType: "blob" })
            .then(r => { const url = URL.createObjectURL(r.data); setPhotoCache(prev => ({ ...prev, [i.id]: url })); })
            .catch(() => {});
        }
      });
    } catch { setInstructors([]); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/instructor/attendance-logs", { params: { month: selectedMonth } });
      const data: AttendanceLog[] = res.data?.data ?? res.data ?? [];
      setLogs(Array.isArray(data) ? data : []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  const getInstructor = (instructorId: string) => instructors.find(i => i.instructor_id === instructorId) ?? null;

  // Filter logs by search and instructor
  const filteredLogs = logs.filter(log => {
    const instr = getInstructor(log.instructor_id);
    const matchesSearch = !search || 
      instr?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.instructor_id.toLowerCase().includes(search.toLowerCase()) ||
      log.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesInstructor = !selectedInstructor || log.instructor_id === selectedInstructor;
    return matchesSearch && matchesInstructor;
  });

  const present = filteredLogs.filter(l => l.status?.toLowerCase() === "present").length;
  const absent  = filteredLogs.filter(l => l.status?.toLowerCase() === "absent").length;
  const excused = filteredLogs.filter(l => l.status?.toLowerCase() === "excused").length;

  // Get unique instructors for filter
  const instructorOptions = [...new Map(logs.map(log => {
    const instr = getInstructor(log.instructor_id);
    return [log.instructor_id, instr?.name || log.instructor_id];
  })).entries()].map(([id, name]) => ({ id, name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Attendance History</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
            All records · click instructor name to view profile
            <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "999px", padding: "1px 6px" }}>
              Live · Socket
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setMonth(e.target.value)}
            style={{ padding: "0.5rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", background: "#fff", color: "#1e293b" }} 
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search by name, ID, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", background: "#fff", color: "#1e293b" }}
          />
        </div>
        <select
          value={selectedInstructor}
          onChange={(e) => setSelectedInstructor(e.target.value)}
          style={{ padding: "0.5rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", background: "#fff", color: "#1e293b", minWidth: "180px" }}
        >
          <option value="">All Instructors</option>
          {instructorOptions.map(inst => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
        {(search || selectedInstructor) && (
          <button
            onClick={() => { setSearch(""); setSelectedInstructor(""); }}
            style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", color: "#64748b", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Present", value: present, color: "#15803d", icon: "✅" },
          { label: "Absent", value: absent, color: "#dc2626", icon: "❌" },
          { label: "Excused", value: excused, color: "#b45309", icon: "📝" },
          { label: "Total", value: filteredLogs.length, color: "#003366", icon: "📊" },
        ].map(s => (
          <div key={s.label} style={{ ...glassCardStyle, padding: "1.25rem", textAlign: "center", borderBottom: `3px solid ${s.color}` }}>
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.icon} {s.label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Attendance Cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "3rem", color: "#94a3b8" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading attendance records...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ ...glassCardStyle, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#64748b" }}>No attendance records found for {new Date(selectedMonth + "-01").toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
          {filteredLogs.map((log) => {
            const instr = getInstructor(log.instructor_id);
            const status = log.status?.toLowerCase();
            
            return (
              <div
                key={log.id}
                style={{
                  ...glassCardStyle,
                  borderLeft: `4px solid ${status === "present" ? "#22c55e" : status === "absent" ? "#ef4444" : status === "excused" ? "#f59e0b" : "#64748b"}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px -5px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ padding: "1rem" }}>
                  {/* Header with Date and Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        background: "#f1f5f9",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#64748b",
                      }}>
                        📅 {log.date}
                      </span>
                      {log.day && (
                        <span style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: "#e0e7ff",
                          color: "#4338ca",
                        }}>
                          {log.day}
                        </span>
                      )}
                    </div>
                    <span style={statusStyle(log.status)}>
                      {status === "present" ? "✅ Present" : status === "absent" ? "❌ Absent" : status === "excused" ? "📝 Excused" : log.status}
                    </span>
                  </div>

                  {/* Instructor Info */}
                  <div 
                    style={{ marginBottom: "0.75rem", cursor: instr ? "pointer" : "default" }}
                    onClick={() => instr && setProfileModal(instr)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Avatar src={instr ? (photoCache[instr.id] ?? null) : null} name={instr?.name ?? log.instructor_id} size={48} />
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
                          {instr?.name ?? log.instructor_id}
                        </h3>
                        <p style={{ fontSize: "0.7rem", color: "#3b82f6", fontFamily: "monospace" }}>
                          {log.instructor_id}
                        </p>
                        {instr?.department && (
                          <p style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.125rem" }}>
                            {instr.department}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject & Room */}
                  <div style={{ marginBottom: "0.75rem", padding: "0.5rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.25rem" }}>
                      {log.subject || "No subject"}
                    </p>
                    {log.code && (
                      <p style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace", marginBottom: "0.25rem" }}>
                        Code: {log.code}
                      </p>
                    )}
                    {log.room && (
                      <p style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Room {log.room}
                      </p>
                    )}
                  </div>

                  {/* Time Info */}
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0" }}>
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.125rem" }}>Time In</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                        {log.time_in || "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.125rem" }}>Time Out</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                        {log.time_out || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Modal */}
      {profileModal && (
        <div onClick={() => setProfileModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "28rem", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", padding: "1.75rem 1.5rem", position: "relative" }}>
              <button onClick={() => setProfileModal(null)}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Avatar src={photoCache[profileModal.id] ?? null} name={profileModal.name} size={64} />
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{profileModal.name}</h3>
                  <p style={{ color: "#bfdbfe", fontSize: "0.75rem", fontFamily: "monospace", marginTop: "0.2rem" }}>{profileModal.instructor_id}</p>
                  <span style={{ marginTop: "0.375rem", display: "inline-block", fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: profileModal.status === "Active" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", color: profileModal.status === "Active" ? "#4ade80" : "#f87171" }}>
                    {profileModal.status}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {[
                  { label: "Email", value: profileModal.email },
                  { label: "Instructor ID", value: profileModal.instructor_id },
                  { label: "Department", value: profileModal.department || "—" },
                  { label: "Specialization", value: profileModal.specialization || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</p>
                    <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: 500, wordBreak: "break-word" }}>{value}</p>
                  </div>
                ))}
              </div>
              {(() => {
                const instrLogs = logs.filter(l => l.instructor_id === profileModal.instructor_id);
                const p = instrLogs.filter(l => l.status?.toLowerCase() === "present").length;
                const a = instrLogs.filter(l => l.status?.toLowerCase() === "absent").length;
                const e = instrLogs.filter(l => l.status?.toLowerCase() === "excused").length;
                const t = instrLogs.length;
                const rate = t > 0 ? Math.round((p / t) * 100) : 0;
                return (
                  <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>This Month's Summary</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                      {[
                        { label: "Present", value: p, color: "#15803d" },
                        { label: "Absent", value: a, color: "#dc2626" },
                        { label: "Excused", value: e, color: "#b45309" },
                        { label: "Rate", value: `${rate}%`, color: "#003366" },
                      ].map(s => (
                        <div key={s.label}>
                          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: s.color }}>{s.value}</p>
                          <p style={{ fontSize: "0.65rem", color: "#64748b" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <button onClick={() => setProfileModal(null)}
                style={{ marginTop: "1.25rem", width: "100%", padding: "0.625rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
                onMouseLeave={e => (e.currentTarget.style.background = "#003366")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}