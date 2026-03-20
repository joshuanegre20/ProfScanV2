// src/pages/Staff/tabs/MyAttendanceTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

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

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden",
};

const statusStyle = (status: string): React.CSSProperties => {
  const s = status?.toLowerCase();
  return {
    padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
    background: s === "present" ? "#dcfce7" : s === "absent" ? "#fee2e2" : s === "excused" ? "#fff3cd" : "#f3f4f6",
    color:      s === "present" ? "#15803d" : s === "absent" ? "#dc2626" : s === "excused" ? "#856404" : "#6b7280",
  };
};

// Avatar — photo blob or initials fallback
function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (src && !err) {
    return <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e0e7ff" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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

  // Profile modal
  const [profileModal, setProfileModal] = useState<Instructor | null>(null);

  useEffect(() => { fetchInstructors(); }, []);
  useEffect(() => { fetchLogs(); }, [selectedMonth]);

  const fetchInstructors = async () => {
    try {
      const res = await api.get("/admin/instructors");
      const data: Instructor[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setInstructors(data);
      // Fetch photos as blobs
      data.forEach(i => {
        if (i.profile_url) {
          api.get(`/admin/instructors/${i.id}/photo`, { responseType: "blob" })
            .then(r => {
              const url = URL.createObjectURL(r.data);
              setPhotoCache(prev => ({ ...prev, [i.id]: url }));
            })
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

  const getInstructor = (instructorId: string) =>
    instructors.find(i => i.instructor_id === instructorId) ?? null;

  const present = logs.filter(l => l.status?.toLowerCase() === "present").length;
  const absent  = logs.filter(l => l.status?.toLowerCase() === "absent").length;
  const excused = logs.filter(l => l.status?.toLowerCase() === "excused").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "black" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}>Attendance History</h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>All records · click instructor name to view profile</p>
        </div>
        <input type="month" value={selectedMonth} onChange={e => setMonth(e.target.value)}
          style={{ padding: "0.5rem 0.875rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" }} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Present", value: present,    color: "#22c55e" },
          { label: "Absent",  value: absent,     color: "#ef4444" },
          { label: "Excused", value: excused,    color: "#f59e0b" },
          { label: "Total",   value: logs.length, color: "#6366f1" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937" }}>
            Records for {new Date(selectedMonth + "-01").toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
          </h3>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "2.5rem", color: "#9ca3af" }}>
            <div style={{ width: "1rem", height: "1rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            <p style={{ fontSize: "0.875rem" }}>No records for this month</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["#", "Instructor", "Date", "Day", "Subject", "Room", "Time In", "Time Out", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const instr = getInstructor(log.instructor_id);
                  return (
                    <tr key={log.id} style={{ borderTop: "1px solid #f3f4f6" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: "0.75rem" }}>{idx + 1}</td>

                      {/* Instructor cell — clickable */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          onClick={() => instr && setProfileModal(instr)}
                          style={{ background: "none", border: "none", cursor: instr ? "pointer" : "default", padding: 0, display: "flex", alignItems: "center", gap: "0.625rem", textAlign: "left" }}
                        >
                          <Avatar
                            src={instr ? (photoCache[instr.id] ?? null) : null}
                            name={instr?.name ?? log.instructor_id}
                            size={34}
                          />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.8rem", color: instr ? "#4f46e5" : "#1f2937", whiteSpace: "nowrap", textDecoration: instr ? "underline" : "none", textDecorationColor: "#c7d2fe" }}>
                              {instr?.name ?? log.instructor_id}
                            </p>
                            <p style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }}>{log.instructor_id}</p>
                            {instr?.department && (
                              <p style={{ fontSize: "0.68rem", color: "#a5b4fc" }}>{instr.department}</p>
                            )}
                          </div>
                        </button>
                      </td>

                      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{log.date}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {log.day
                          ? <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "#e0e7ff", color: "#4338ca" }}>{log.day}</span>
                          : <span style={{ color: "#9ca3af" }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 500, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.subject || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{log.room || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{log.time_in || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{log.time_out || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={statusStyle(log.status)}>{log.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Profile Modal ── */}
      {profileModal && (
        <div
          onClick={() => setProfileModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "28rem", overflow: "hidden" }}
          >
            {/* Modal header gradient */}
            <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "1.75rem 1.5rem", position: "relative" }}>
              <button
                onClick={() => setProfileModal(null)}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Avatar
                  src={photoCache[profileModal.id] ?? null}
                  name={profileModal.name}
                  size={64}
                />
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{profileModal.name}</h3>
                  <p style={{ color: "#c4b5fd", fontSize: "0.75rem", fontFamily: "monospace", marginTop: "0.2rem" }}>{profileModal.instructor_id}</p>
                  <span style={{
                    marginTop: "0.375rem", display: "inline-block",
                    fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px",
                    background: profileModal.status === "Active" ? "#dcfce7" : "#fee2e2",
                    color: profileModal.status === "Active" ? "#15803d" : "#dc2626",
                  }}>
                    {profileModal.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {[
                  { label: "Email",          value: profileModal.email },
                  { label: "Instructor ID",  value: profileModal.instructor_id },
                  { label: "Department",     value: profileModal.department || "—" },
                  { label: "Specialization", value: profileModal.specialization || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</p>
                    <p style={{ fontSize: "0.875rem", color: "#1f2937", fontWeight: 500, wordBreak: "break-word" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* This month's stats for this instructor */}
              {(() => {
                const instrLogs = logs.filter(l => l.instructor_id === profileModal.instructor_id);
                const p = instrLogs.filter(l => l.status?.toLowerCase() === "present").length;
                const a = instrLogs.filter(l => l.status?.toLowerCase() === "absent").length;
                const e = instrLogs.filter(l => l.status?.toLowerCase() === "excused").length;
                const t = instrLogs.length;
                const rate = t > 0 ? Math.round((p / t) * 100) : 0;
                return (
                  <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #f3f4f6" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                      This Month's Summary
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                      {[
                        { label: "Present", value: p,       color: "#22c55e" },
                        { label: "Absent",  value: a,       color: "#ef4444" },
                        { label: "Excused", value: e,       color: "#f59e0b" },
                        { label: "Rate",    value: `${rate}%`, color: "#4f46e5" },
                      ].map(s => (
                        <div key={s.label}>
                          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: s.color }}>{s.value}</p>
                          <p style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => setProfileModal(null)}
                style={{ marginTop: "1.25rem", width: "100%", padding: "0.625rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
                onMouseLeave={e => (e.currentTarget.style.background = "#4f46e5")}
              >
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