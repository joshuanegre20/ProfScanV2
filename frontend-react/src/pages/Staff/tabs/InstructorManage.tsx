// src/pages/Staff/tabs/InstructorManagerTab.tsx (Fixed - Black text version)
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import * as XLSX from "xlsx";
import { useSocket } from "../../../hooks/useSocket";

interface Instructor {
  id: number;
  name: string;
  email: string;
  instructor_id: string;
  department: string;
  specialization: string;
  status: string;
  profile_url: string | null;
}

interface Department {
  id: number;
  degree_program: string;
  college: string;
}

interface AttendanceLog {
  id: number;
  instructor_id: string;
  date: string;
  day: string | null;
  subject: string | null;
  code: string | null;
  room: string | null;
  time_in: string | null;
  time_out: string | null;
  status: string | null;
  block?: string | null;
}

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const statusStyle = (status: string | null): React.CSSProperties => {
  const s = status?.toLowerCase() ?? "";
  return {
    padding: "0.2rem 0.625rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600,
    background: s === "present" ? "#dcfce7" : s === "absent" ? "#fee2e2" : s === "excused" ? "#fff3cd" : "#f1f5f9",
    color:      s === "present" ? "#15803d" : s === "absent" ? "#dc2626" : s === "excused" ? "#856404" : "#475569",
  };
};

function Avatar({ src, name, size = 40, fontSize = "1rem" }: { src: string | null; name: string; size?: number; fontSize?: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => { setImgError(false); }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0,}}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #003366, #0055a4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function InstructorManagerTab() {
  const [instructors, setInstructors]   = useState<Instructor[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [photoCache, setPhotoCache]     = useState<Record<number, string>>({});
  const [search, setSearch]             = useState("");
  const [deptFilter, setDeptFilter]     = useState("");
  const [selected, setSelected]         = useState<Instructor | null>(null);
  const [logs, setLogs]                 = useState<AttendanceLog[]>([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingLogs, setLoadingLogs]   = useState(false);
  const [monthFilter, setMonthFilter]   = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (selected) fetchLogs(selected.instructor_id); }, [selected, monthFilter]);

  useSocket({
    room: "staff",
    onInstructorUpdate: (data) => {
      if (data.action === "created" || data.action === "updated" || data.action === "deleted") {
        fetchAll();
      }
    },
  });

  const fetchAll = async () => {
    setLoadingList(true);
    try {
      const [instrRes, deptRes] = await Promise.allSettled([
        api.get("/admin/instructors"),
        api.get("/admin/departments"),
      ]);

      if (instrRes.status === "fulfilled") {
        const data: Instructor[] = Array.isArray(instrRes.value.data)
          ? instrRes.value.data
          : instrRes.value.data?.data ?? [];
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setInstructors(sorted);

        sorted.forEach(i => {
          if (i.profile_url) {
            api.get(`/admin/instructors/${i.id}/photo`, { responseType: "blob" })
              .then(res => {
                const blobUrl = URL.createObjectURL(res.data);
                setPhotoCache(prev => ({ ...prev, [i.id]: blobUrl }));
              })
              .catch(() => {});
          }
        });
      }

      if (deptRes.status === "fulfilled") {
        const d = deptRes.value.data?.data ?? deptRes.value.data ?? [];
        setDepartments(Array.isArray(d) ? d : []);
      }
    } catch {}
    finally { setLoadingList(false); }
  };

  const fetchLogs = async (instructorId: string) => {
    setLoadingLogs(true);
    try {
      const res = await api.get("/instructor/attendance-logs", {
        params: { month: monthFilter },
      });
      const all: AttendanceLog[] = res.data?.data ?? res.data ?? [];
      setLogs(all.filter(l => l.instructor_id === instructorId));
    } catch { setLogs([]); }
    finally { setLoadingLogs(false); }
  };

  const handleExport = () => {
    if (!selected || logs.length === 0) return;

    const rows = logs.map(l => ({
      "Date":     l.date     ?? "—",
      "Day":      l.day      ?? "—",
      "Subject":  l.subject  ?? "—",
      "Code":     l.code     ?? "—",
      "Room":     l.room     ?? "—",
      "Block":    l.block    ?? "—",
      "Time In":  l.time_in  ?? "—",
      "Time Out": l.time_out ?? "—",
      "Status":   l.status   ?? "—",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 14 }, { wch: 10 }, { wch: 36 }, { wch: 12 },
      { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const present = logs.filter(l => l.status?.toLowerCase() === "present").length;
    const absent  = logs.filter(l => l.status?.toLowerCase() === "absent").length;
    const excused = logs.filter(l => l.status?.toLowerCase() === "excused").length;
    const total   = logs.length;
    const rate    = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

    const summary = [
      { "Field": "Instructor Name",  "Value": selected.name },
      { "Field": "Instructor ID",    "Value": selected.instructor_id },
      { "Field": "Department",       "Value": selected.department },
      { "Field": "Specialization",   "Value": selected.specialization },
      { "Field": "Period",           "Value": monthFilter },
      { "Field": "Total Records",    "Value": total },
      { "Field": "Present",          "Value": present },
      { "Field": "Absent",           "Value": absent },
      { "Field": "Excused",          "Value": excused },
      { "Field": "Attendance Rate",  "Value": `${rate}%` },
    ];

    const ws2 = XLSX.utils.json_to_sheet(summary);
    ws2["!cols"] = [{ wch: 20 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    XLSX.writeFile(wb, `attendance_${selected.instructor_id}_${monthFilter}.xlsx`);
  };

  const deptOptions = [
    ...new Set([
      ...departments.map(d => d.degree_program).filter(Boolean),
      ...instructors.map(i => i.department).filter(Boolean),
    ])
  ].sort();

  const filtered = instructors.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      i.name.toLowerCase().includes(q) ||
      i.instructor_id.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.department?.toLowerCase().includes(q);
    const matchDept = !deptFilter || i.department === deptFilter;
    return matchSearch && matchDept;
  });

  const present = logs.filter(l => l.status?.toLowerCase() === "present").length;
  const absent  = logs.filter(l => l.status?.toLowerCase() === "absent").length;
  const excused = logs.filter(l => l.status?.toLowerCase() === "excused").length;
  const total   = logs.length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Instructor Manager</h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
          Click an instructor to view their attendance logs
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* Left: Instructor list */}
        <div style={{ ...glassCardStyle, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.875rem", borderBottom: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input
              type="text" placeholder="🔍 Search name, ID..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.8rem", outline: "none", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1e293b" }}
            />
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.8rem", outline: "none", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1e293b" }}>
              <option value="">All Departments</option>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {loadingList ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem" }}>
                <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>No instructors found</div>
            ) : filtered.map(i => {
              const isSelected = selected?.id === i.id;
              return (
                <button key={i.id} onClick={() => setSelected(i)}
                  style={{
                    width: "100%", textAlign: "left", padding: "0.75rem 0.875rem",
                    border: "none", borderBottom: "1px solid #e2e8f0",
                    background: isSelected ? "#eef2ff" : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem",
                    borderLeft: `3px solid ${isSelected ? "#003366" : "transparent"}`,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar src={photoCache[i.id] ?? null} name={i.name} size={38} fontSize="0.875rem" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.name}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#3b82f6", fontFamily: "monospace" }}>{i.instructor_id}</p>
                    <p style={{ fontSize: "0.68rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.department || "No department"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", flexShrink: 0,
                    background: i.status === "Active" ? "#dcfce7" : "#fee2e2",
                    color: i.status === "Active" ? "#15803d" : "#dc2626",
                  }}>
                    {i.status}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ padding: "0.5rem 0.875rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.7rem", color: "#64748b" }}>
            {filtered.length} of {instructors.length} instructors
          </div>
        </div>

        {/* Right: Attendance */}
        {!selected ? (
          <div style={{ ...glassCardStyle, padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👈</div>
            <p style={{ fontWeight: 600, color: "#1e293b" }}>Select an instructor</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.375rem" }}>
              Click any instructor from the list to view their attendance records
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Instructor profile card */}
            <div style={glassCardStyle}>
              <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Avatar src={photoCache[selected.id] ?? null} name={selected.name} size={56} fontSize="1.5rem" />
                    <div>
                      <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2 }}>{selected.name}</h3>
                      <p style={{ color: "#bfdbfe", fontSize: "0.75rem", fontFamily: "monospace", marginTop: "0.2rem" }}>{selected.instructor_id}</p>
                      <p style={{ color: "#bfdbfe", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                        {selected.department || "No department"}
                        {selected.specialization ? ` · ${selected.specialization}` : ""}
                      </p>
                      <p style={{ color: "#bfdbfe", fontSize: "0.7rem", marginTop: "0.15rem" }}>{selected.email}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
                    <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                      style={{ padding: "0.375rem 0.75rem", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "0.5rem", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.8rem", outline: "none" }} />
                    <button onClick={handleExport} disabled={logs.length === 0}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.5rem 1rem",
                        background: logs.length === 0 ? "rgba(255,255,255,0.2)" : "#ffd700",
                        color: logs.length === 0 ? "rgba(255,255,255,0.5)" : "#003366",
                        border: "none", borderRadius: "0.5rem",
                        fontSize: "0.8rem", fontWeight: 700,
                        cursor: logs.length === 0 ? "not-allowed" : "pointer",
                      }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
                {[
                  { label: "Total",   value: total,      color: "#003366" },
                  { label: "Present", value: present,    color: "#15803d" },
                  { label: "Absent",  value: absent,     color: "#dc2626" },
                  { label: "Excused", value: excused,    color: "#b45309" },
                  { label: "Rate",    value: `${rate}%`, color: "#2563eb" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "0.875rem", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "1.375rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs table */}
            <div style={glassCardStyle}>
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {new Date(monthFilter + "-01").toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                </p>
                <span style={{ fontSize: "0.75rem", background: "#eef2ff", color: "#003366", padding: "0.2rem 0.625rem", borderRadius: "9999px", fontWeight: 600 }}>
                  {logs.length} record{logs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loadingLogs ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "2.5rem", color: "#94a3b8" }}>
                  <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                  <p style={{ fontSize: "0.875rem" }}>No attendance records for this period</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Date", "Day", "Subject", "Code", "Room", "Block", "Time In", "Time Out", "Status"].map(h => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, idx) => (
                        <tr key={log.id} style={{ borderTop: "1px solid #e2e8f0" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "0.75rem 1rem", color: "#94a3b8", fontSize: "0.75rem" }}>{idx + 1}</td>
                          <td style={{ padding: "0.75rem 1rem", fontWeight: 500, whiteSpace: "nowrap", color: "#1e293b" }}>{log.date}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            {log.day
                              ? <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "#e0e7ff", color: "#4338ca" }}>{log.day}</span>
                              : <span style={{ color: "#94a3b8" }}>—</span>
                            }
                          </td>
                          <td style={{ padding: "0.75rem 1rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1e293b" }}>{log.subject || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" }}>{log.code || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{log.room || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            {log.block ? (
                              <span style={{ padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600, background: "#e0e7ff", color: "#4338ca" }}>
                                {log.block}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", color: "#1e293b", whiteSpace: "nowrap" }}>{log.time_in || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "#1e293b", whiteSpace: "nowrap" }}>{log.time_out || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={statusStyle(log.status)}>{log.status || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}