// src/pages/Admin/tabs/InstructorsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import * as XLSX from "xlsx";

interface Props {
  setActiveTab: (tab: string) => void;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  instructor_id: string;
  profile_url: string | null;
  department: string;
  specialization: string;
  join_date: string;
  contact_no?: string;
  address?: string;
  age?: number;
  gender?: string;
}

interface Schedule {
  id: number;
  subject: string;
  subject_code: string;
  day: string;
  time: string;
  end_time?: string;
  room?: string;
  status: string;
  device_id?: number | null;
}

interface AttendanceLog {
  id: number;
  date: string;
  time: string;
  end_time?: string;
  subject: string;
  subject_code: string;
  room: string;
  status: string;
  duration?: string;
  day: string;
}

const departments = [
  { value: "CCS", label: "College of Computer Studies (CCS)" },
  { value: "CBA", label: "College of Business Administration (CBA)" },
  { value: "CTE", label: "College of Teacher Education (CTE)" },
  { value: "CCJ", label: "College of Criminal Justice (CCJ)" },
  { value: "CHM", label: "College of Hospitality Management (CHM)" },
  { value: "CAS", label: "College of Arts and Sciences (CAS)" },
];

const DAY_ORDER = ["MWF", "TTH", "SAT", "SUN", "SAT-SUN"];

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
};

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF:       { bg: "#e0e7ff", color: "#4338ca" },
  TTH:       { bg: "#f3e8ff", color: "#7e22ce" },
  SAT:       { bg: "#ffedd5", color: "#c2410c" },
  SUN:       { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

function useProtectedImage(url: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) { setSrc(null); return; }
    const path = url.replace(/^.*\/api\//, "/");
    api.get(path, { responseType: "blob" })
      .then(res => setSrc(URL.createObjectURL(res.data)))
      .catch(() => setSrc(null));
  }, [url]);
  return src;
}

function InstructorAvatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const src = useProtectedImage(url);
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",  }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #003366, #0055a4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size * 0.5} height={size * 0.5} fill="none" stroke="#ffd700" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

// ── Export to Excel Function ─────────────────────────────────────
const exportToExcel = (logs: AttendanceLog[], instructorName: string) => {
  const excelData = logs.map(log => ({
    'Date': new Date(log.date).toLocaleDateString('en-PH'),
    'Subject': log.subject,
    'Subject Code': log.subject_code,
    'Room': log.room || '—',
    'Time In': log.time?.substring(0, 5) || '—',
    'Time Out': log.end_time?.substring(0, 5) || '—',
    'Duration': log.duration || '—',
    'Status': log.status
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const colWidths = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Logs');
  const fileName = `${instructorName.replace(/\s+/g, '_')}_attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ── Attendance Logs Modal ─────────────────────────────────────────────────
function AttendanceLogsModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    api.get(`/admin/instructors/${instructor.id}/attendance-logs`)
      .then(res => {
        const allLogs = res.data.data || (Array.isArray(res.data) ? res.data : []);
        setLogs(allLogs);
      })
      .catch(err => console.error("Failed to fetch attendance logs:", err))
      .finally(() => setLoading(false));
  }, [instructor.id]);

  const totalScans = logs.length;
  const presentCount = logs.filter(log => log.status === "Present" || log.status === "Attended").length;
  const absentCount = logs.filter(log => log.status === "Absent").length;
  const attendanceRate = totalScans > 0 ? Math.round((presentCount / totalScans) * 100) : 0;

  const filteredLogs = logs.filter(log => {
    const matchMonth = !filterMonth || log.date.startsWith(filterMonth);
    const matchStatus = !filterStatus || log.status === filterStatus;
    return matchMonth && matchStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleExport = () => {
    exportToExcel(filteredLogs, instructor.name);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: "64rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ position: "relative", background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "1.25rem 1.25rem 0 0", padding: "1.5rem" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <InstructorAvatar url={instructor.profile_url} name={instructor.name} size={64} />
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{instructor.name}</h2>
              <p style={{ color: "#bfdbfe", fontSize: "0.875rem" }}>{instructor.instructor_id} · {instructor.department}</p>
              <p style={{ color: "#bfdbfe", fontSize: "0.75rem", marginTop: "0.25rem" }}>Showing only successful scans</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Total Successful Scans", value: totalScans, color: "#003366" },
              { label: "Present", value: presentCount, color: "#22c55e" },
              { label: "Absent", value: absentCount, color: "#ef4444" },
              { label: "Attendance Rate", value: `${attendanceRate}%`, color: "#ffd700" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#f8fafc", borderRadius: "0.75rem", padding: "1rem", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>{stat.label}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters and Export */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <input
                type="month"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                placeholder="Filter by month"
                style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", background: "#fff", color: "#1e293b" }}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", background: "#fff", color: "#1e293b" }}
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Attended">Attended</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            
            <button
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              style={{
                background: filteredLogs.length === 0 ? "#e2e8f0" : "#003366",
                color: "#fff",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: filteredLogs.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => { if (filteredLogs.length > 0) e.currentTarget.style.background = "#004c99"; }}
              onMouseLeave={e => { if (filteredLogs.length > 0) e.currentTarget.style.background = "#003366"; }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to Excel
            </button>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <div style={{ width: "2rem", height: "2rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "0.75rem" }}>
              <svg width="48" height="48" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ margin: "0 auto 1rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No successful scan logs found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "0.75rem" }}>
              <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date/Time</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Day</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Subject</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Code</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Room</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Time</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "0.75rem 1rem", color: "#1e293b" }}>{formatDate(log.date)}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: dayColors[log.day]?.bg || "#eef2ff", color: dayColors[log.day]?.color || "#003366" }}>
                          {log.day}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#1e293b" }}>{log.subject}</td>
                      <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#64748b" }}>{log.subject_code}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{log.room || "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                        {log.time}{log.end_time ? ` – ${log.end_time}` : ""}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, background: statusColors[log.status]?.bg || "#f1f5f9", color: statusColors[log.status]?.color || "#475569" }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #e2e8f0", background: "#fafafa", fontSize: "0.75rem", color: "#64748b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Showing {filteredLogs.length} of {logs.length} successful scans</span>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => { setFilterMonth(""); setFilterStatus(""); }}
                    style={{ background: "none", border: "none", color: "#003366", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Clear Filters
                  </button>
                  {filteredLogs.length > 0 && (
                    <span style={{ color: "#22c55e" }}>✓ Ready to export</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────
function InstructorProfileModal({ instructor, onClose, onViewAttendance }: { instructor: Instructor; onClose: () => void; onViewAttendance: () => void }) {
  const avatarSrc = useProtectedImage(instructor.profile_url);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSched, setLoadingSched] = useState(true);

  useEffect(() => {
    api.get("/admin/schedules", { params: { instructor_id: instructor.instructor_id } })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const mine = all.filter((s: any) => s.instructor_id === instructor.instructor_id);
        setSchedules(mine);
      })
      .catch(() => {})
      .finally(() => setLoadingSched(false));
  }, [instructor.instructor_id]);

  const sortedSchedules = [...schedules].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  const info = [
    { label: "Employee ID", value: instructor.instructor_id },
    { label: "Email", value: instructor.email },
    { label: "Department", value: instructor.department },
    { label: "Specialization", value: instructor.specialization },
    { label: "Contact No", value: instructor.contact_no ?? "—" },
    { label: "Gender", value: instructor.gender ?? "—" },
    { label: "Age", value: instructor.age ? String(instructor.age) : "—" },
    { label: "Join Date", value: instructor.join_date },
    { label: "Address", value: instructor.address ?? "—" },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: "42rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>

        {/* Banner */}
        <div style={{ position: "relative", background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "1.25rem 1.25rem 0 0", padding: "1.5rem 1.5rem 3.5rem" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", border: "3px solid #ffd700", overflow: "hidden", background: "#eef2ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {avatarSrc
                ? <img src={avatarSrc} alt={instructor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <svg width="36" height="36" fill="none" stroke="#ffd700" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
            </div>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>{instructor.name}</h2>
              <p style={{ color: "#bfdbfe", fontSize: "0.8rem", marginTop: "0.25rem" }}>{instructor.specialization}</p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "rgba(255,255,255,0.2)", color: "#ffd700" }}>
                  {instructor.department}
                </span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: instructor.status === "Active" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", color: instructor.status === "Active" ? "#4ade80" : "#f87171" }}>
                  {instructor.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "-1rem" }}>

          <button
            onClick={onViewAttendance}
            style={{
              background: "#003366",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              transition: "background 0.15s"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
            onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            View Attendance Logs
          </button>

          {/* Basic Info Card */}
          <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="15" height="15" fill="none" stroke="#003366" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>Basic Information</h3>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              {info.map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                  <p style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 500, marginTop: "0.2rem", wordBreak: "break-word" }}>{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Schedules Card */}
          <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="15" height="15" fill="none" stroke="#003366" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <polyline points="12 6 12 12 16 14" strokeWidth={2} />
              </svg>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>Schedules</h3>
              <span style={{ marginLeft: "auto", fontSize: "0.7rem", background: "#eef2ff", color: "#003366", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>
                {schedules.length} class{schedules.length !== 1 ? "es" : ""}
              </span>
            </div>

            {loadingSched ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : sortedSchedules.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>No schedules assigned</div>
            ) : (
              <div style={{ padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {sortedSchedules.map(sched => (
                  <div key={sched.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.625rem", border: "1px solid #e2e8f0" }}>
                    <div style={{ minWidth: "3.5rem", textAlign: "center", background: dayColors[sched.day]?.bg ?? "#eef2ff", borderRadius: "0.5rem", padding: "0.3rem 0.5rem" }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: dayColors[sched.day]?.color ?? "#003366", textTransform: "uppercase" }}>{sched.day}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.825rem", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sched.subject}
                        <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace", marginLeft: "0.4rem" }}>({sched.subject_code})</span>
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.125rem" }}>
                        {sched.time}{sched.end_time ? ` – ${sched.end_time}` : ""}
                        {sched.room && <span> · {sched.room}</span>}
                      </p>
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "9999px", background: statusColors[sched.status]?.bg ?? "#f1f5f9", color: statusColors[sched.status]?.color ?? "#64748b", whiteSpace: "nowrap" }}>
                      {sched.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: "0.5rem 1rem", border: "1px solid #e2e8f0",
  borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", fontFamily: "inherit",
  background: "#fff", color: "#1e293b",
};

export default function InstructorsTab({ setActiveTab }: Props) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Instructor | null>(null);
  const [showAttendanceLogs, setShowAttendanceLogs] = useState(false);

  const fetchInstructors = () => {
    setLoading(true);
    api.get("/admin/instructors")
      .then(res => setInstructors(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInstructors(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this instructor?")) return;
    try {
      await api.delete(`/admin/instructors/${id}`);
      fetchInstructors();
    } catch { alert("Failed to delete instructor."); }
  };

  const handleToggleStatus = async (instructor: Instructor) => {
    const newStatus = instructor.status === "Active" ? "Inactive" : "Active";
    if (!confirm(`Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} this instructor?`)) return;
    try {
      await api.patch(`/admin/instructors/${instructor.id}/status`, { status: newStatus });
      fetchInstructors();
    } catch { alert("Failed to update status."); }
  };

  const filtered = instructors.filter(i => {
    const matchSearch = search === "" ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.instructor_id?.toLowerCase().includes(search.toLowerCase());
    const matchDept = departmentFilter === "" || i.department === departmentFilter;
    return matchSearch && matchDept;
  });

  return (
    <div style={glassCardStyle}>

      {selected && !showAttendanceLogs && (
        <InstructorProfileModal 
          instructor={selected} 
          onClose={() => {
            setSelected(null);
            setShowAttendanceLogs(false);
          }}
          onViewAttendance={() => setShowAttendanceLogs(true)}
        />
      )}

      {selected && showAttendanceLogs && (
        <AttendanceLogsModal
          instructor={selected}
          onClose={() => {
            setSelected(null);
            setShowAttendanceLogs(false);
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", padding: "1.5rem 1.5rem 0 1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Instructors List</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
            {filtered.length} of {instructors.length} instructors
          </p>
        </div>
        <button
          onClick={() => setActiveTab("add-instructor")}
          style={{ background: "#003366", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
          onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Instructor
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", padding: "0 1.5rem" }}>
        <input 
          type="text" 
          placeholder="Search by name, email, or ID..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ ...inputStyle, flex: 1, minWidth: "200px" }} 
        />
        <select value={departmentFilter} onChange={e => setDeptFilter(e.target.value)} style={inputStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem", color: "#94a3b8", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading instructors...
        </div>
      ) : (
        <div style={{ overflowX: "auto", padding: "0 1.5rem 1.5rem 1.5rem" }}>
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {["Profile", "Instructor ID", "Name", "Email", "Department", "Specialization", "Status", "Join Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(instructor => (
                <tr
                  key={instructor.id}
                  style={{ borderBottom: "1px solid #e2e8f0", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setSelected(instructor)}
                >
                  <td style={{ padding: "0.75rem 1rem" }} onClick={e => e.stopPropagation()}>
                    <InstructorAvatar url={instructor.profile_url} name={instructor.name} size={36} />
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{instructor.instructor_id || "N/A"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {instructor.name}
                      <svg width="12" height="12" fill="none" stroke="#003366" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{instructor.email}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{instructor.department}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{instructor.specialization}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, background: instructor.status === "Active" ? "#dcfce7" : "#fee2e2", color: instructor.status === "Active" ? "#15803d" : "#dc2626" }}>
                      {instructor.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>{instructor.join_date}</td>
                  <td style={{ padding: "0.75rem 1rem" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                    
                      <button
                        onClick={() => handleDelete(instructor.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem", color: "#ef4444" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8", fontSize: "0.875rem" }}>
                    No instructors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}