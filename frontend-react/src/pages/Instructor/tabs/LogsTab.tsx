// src/pages/Instructor/tabs/LogsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import * as XLSX from "xlsx";

interface AttendanceLog {
  id: number;
  subject?: string;
  code?: string;
  room?: string;
  time_in: string;
  time_out?: string;
  date: string;
  day?: string;
  status: string;
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Present:       { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
  Attended:      { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" },
  Absent:        { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  "No Schedule": { bg: "#fef9c3", color: "#a16207", border: "#fef08a" },
};

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF:       { bg: "#e0e7ff", color: "#4338ca" },
  TTH:       { bg: "#f3e8ff", color: "#7e22ce" },
  SAT:       { bg: "#ffedd5", color: "#c2410c" },
  SUN:       { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const exportToExcel = (logs: AttendanceLog[]) => {
  const excelData = logs.map(log => ({
    "Date":       new Date(log.date).toLocaleDateString("en-PH"),
    "Day":        log.day || "—",
    "Subject":    log.subject || "—",
    "Code":       log.code || "—",
    "Room":       log.room || "—",
    "Time In":    log.time_in?.substring(0, 5) || "—",
    "Time Out":   log.time_out?.substring(0, 5) || "—",
    "Status":     log.status,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);

  ws["!cols"] = [
    { wch: 14 }, // Date
    { wch: 8  }, // Day
    { wch: 35 }, // Subject
    { wch: 15 }, // Code
    { wch: 12 }, // Room
    { wch: 10 }, // Time In
    { wch: 10 }, // Time Out
    { wch: 12 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");

  const fileName = `attendance_logs_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export default function LogsTab() {
  const [logs, setLogs]                 = useState<AttendanceLog[]>([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/instructor/attendance-logs")
      .then(res => {
        const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
        setLogs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const filtered = logs.filter(l => {
    const matchSearch =
      search === "" ||
      l.subject?.toLowerCase().includes(search.toLowerCase()) ||
      l.room?.toLowerCase().includes(search.toLowerCase()) ||
      l.code?.toLowerCase().includes(search.toLowerCase());
    const matchMonth  = !filterMonth  || l.date?.startsWith(filterMonth);
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchMonth && matchStatus;
  });

  const thisMonth    = logs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const presentCount = logs.filter(l => l.status === "Present" || l.status === "Attended").length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric"
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)", borderRadius: "0.75rem", padding: "1.5rem", color: "#fff", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Attendance Logs</h1>
        <p style={{ fontSize: "0.875rem", color: "#c4b5fd", marginTop: "0.25rem", marginBottom: 0 }}>
          Your scan history and attendance records
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[
          {
            label: "Total Logs", value: logs.length, border: "#6366f1",
            iconBg: "#eef2ff", iconColor: "#6366f1", sub: "All time",
            icon: (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
          },
          {
            label: "This Month", value: thisMonth.length, border: "#22c55e",
            iconBg: "#f0fdf4", iconColor: "#22c55e",
            sub: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            icon: (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: "Present", value: presentCount, border: "#10b981",
            iconBg: "#ecfdf5", iconColor: "#10b981", sub: "Attended classes",
            icon: (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "Last Log",
            value: logs[0] ? formatDate(logs[0].date) : "—",
            border: "#3b82f6", iconBg: "#eff6ff", iconColor: "#3b82f6", sub: "Most recent",
            icon: (
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem", borderLeft: `4px solid ${card.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6b7280", margin: 0 }}>{card.label}</p>
              <div style={{ padding: "0.4rem", borderRadius: "0.5rem", background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>{card.value}</p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1rem 1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", color: "black" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search by subject, code or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.25rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
            />
            <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem" }}
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem" }}
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Attended">Attended</option>
            <option value="Absent">Absent</option>
            <option value="No Schedule">No Schedule</option>
          </select>
          {(filterMonth || filterStatus || search) && (
            <button
              onClick={() => { setSearch(""); setFilterMonth(""); setFilterStatus(""); }}
              style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "#6b7280", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* ✅ Export Button */}
        <button
          onClick={() => exportToExcel(filtered)}
          disabled={filtered.length === 0}
          style={{
            background: filtered.length === 0 ? "#e5e7eb" : "#059669",
            color: "#fff",
            border: "none",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: filtered.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (filtered.length > 0) e.currentTarget.style.background = "#047857"; }}
          onMouseLeave={e => { if (filtered.length > 0) e.currentTarget.style.background = "#059669"; }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* Logs Table */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#9ca3af" }}>
            <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Loading logs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.875rem" }}>
            No attendance logs found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {["#", "Date", "Day", "Subject", "Code", "Room", "Time In", "Time Out", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f9fafb" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.875rem 1.25rem", color: "#9ca3af", fontSize: "0.75rem" }}>{i + 1}</td>
                    <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {formatDate(log.date)}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      {log.day ? (
                        <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, background: dayColors[log.day]?.bg ?? "#eef2ff", color: dayColors[log.day]?.color ?? "#4f46e5" }}>
                          {log.day}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#1f2937" }}>
                      {log.subject || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", color: "#6b7280", fontSize: "0.8rem" }}>
                      {log.code || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280" }}>
                      {log.room || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {log.time_in?.substring(0, 5) || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {log.time_out?.substring(0, 5) || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: statusColors[log.status]?.bg ?? "#f3f4f6",
                        color: statusColors[log.status]?.color ?? "#6b7280",
                        border: `1px solid ${statusColors[log.status]?.border ?? "#e5e7eb"}`,
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
              <span>Showing {filtered.length} of {logs.length} logs</span>
              {filtered.length > 0 && (
                <span style={{ color: "#059669" }}>✓ Ready to export</span>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}