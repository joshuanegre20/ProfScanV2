// src/pages/Instructor/tabs/LogsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import * as XLSX from "xlsx";
import { useSocket } from "../../../hooks/useSocket";

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
  block?: string;
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Present:       { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Attended:      { bg: "#f3e8ff", color: "#6b21a5", border: "#e9d5ff" },
  Absent:        { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  Excused:       { bg: "#fff3cd", color: "#a16207", border: "#ffeeba" },
  "No Schedule": { bg: "#fef9c3", color: "#854d0e", border: "#fef08a" },
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
    "Date":     new Date(log.date).toLocaleDateString("en-PH"),
    "Day":      log.day || "—",
    "Subject":  log.subject || "—",
    "Code":     log.code || "—",
    "Room":     log.room || "—",
    "Block":    log.block || "—",
    "Time In":  log.time_in?.substring(0, 5) || "—",
    "Time Out": log.time_out?.substring(0, 5) || "—",
    "Status":   log.status,
  }));
  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");
  XLSX.writeFile(wb, `attendance_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export default function LogsTab() {
  const [logs, setLogs]                 = useState<AttendanceLog[]>([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    api.get("/instructor/attendance-logs-me")
      .then(res => {
        const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
        setLogs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  useSocket({
    room: "admin",
    onLogsUpdate: (data) => {
      // Add new log to the beginning
      if (data && data.log) {
        setLogs(prev => [data.log, ...prev].slice(0, 500));
      } else {
        fetchLogs();
      }
    },
    onAttendanceUpdate: () => fetchLogs(),
  });

  const now = new Date();

  const filtered = logs.filter(l => {
    const matchSearch  = search === "" || 
      l.subject?.toLowerCase().includes(search.toLowerCase()) || 
      l.room?.toLowerCase().includes(search.toLowerCase()) || 
      l.code?.toLowerCase().includes(search.toLowerCase()) ||
      (l.block && l.block.toLowerCase().includes(search.toLowerCase()));
    const matchMonth   = !filterMonth  || l.date?.startsWith(filterMonth);
    const matchStatus  = !filterStatus || l.status === filterStatus;
    return matchSearch && matchMonth && matchStatus;
  });

  const thisMonth    = logs.filter(l => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const presentCount = logs.filter(l => l.status === "Present" || l.status === "Attended").length;
  const formatDate   = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "1rem", padding: "1.5rem", color: "#fff", boxShadow: "0 4px 12px rgba(0,51,102,0.3)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Attendance Logs</h1>
          <p style={{ fontSize: "0.875rem", color: "#bfdbfe", marginTop: "0.25rem", marginBottom: 0 }}>Your scan history and attendance records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Logs",  value: logs.length,       border: "#003366", icon: "📋" },
          { label: "This Month",  value: thisMonth.length,  border: "#10b981", icon: "📅" },
          { label: "Present",     value: presentCount,      border: "#22c55e", icon: "✅" },
          { label: "Last Log",    value: logs[0] ? formatDate(logs[0].date) : "—", border: "#3b82f6", icon: "🕐" },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1rem", borderBottom: `3px solid ${card.border}` }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#6b7280", margin: 0 }}>{card.icon} {card.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: "0.25rem 0" }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <input 
              type="text" 
              placeholder="Search by subject, code, room, or block..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" }} 
            />
            <svg style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)" }} width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="month" 
            value={filterMonth} 
            onChange={e => setFilterMonth(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }} 
          />
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }}
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Attended">Attended</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
            <option value="No Schedule">No Schedule</option>
          </select>
          {(filterMonth || filterStatus || search) && (
            <button 
              onClick={() => { setSearch(""); setFilterMonth(""); setFilterStatus(""); }}
              style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "#475569", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>
        <button 
          onClick={() => exportToExcel(filtered)} 
          disabled={filtered.length === 0}
          style={{ background: filtered.length === 0 ? "#e2e8f0" : "#003366", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: filtered.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* Logs Table */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#94a3b8" }}>
            <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Loading logs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: "0.875rem" }}>No attendance logs found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["#", "Date", "Day", "Subject", "Code", "Room", "Block", "Time In", "Time Out", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.875rem 1rem", color: "#94a3b8", fontSize: "0.75rem" }}>{i + 1}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(log.date)}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {log.day ? (
                        <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600, background: dayColors[log.day]?.bg || "#eef2ff", color: dayColors[log.day]?.color || "#003366" }}>{log.day}</span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 500, color: "#1e293b" }}>{log.subject || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", color: "#64748b", fontSize: "0.75rem" }}>{log.code || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>{log.room || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      {log.block ? (
                        <span style={{ padding: "2px 8px", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600, background: "#e0e7ff", color: "#4338ca" }}>
                          {log.block}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>{log.time_in?.substring(0, 5) || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>{log.time_out?.substring(0, 5) || "—"}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: statusColors[log.status]?.bg || "#f1f5f9", color: statusColors[log.status]?.color || "#475569" }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f1f5f9", background: "#fafafa", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
              <span>Showing {filtered.length} of {logs.length} logs</span>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}