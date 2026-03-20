// src/pages/Instructor/tabs/SchedulesTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface Schedule {
  id: number;
  instructor_id: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time?: string;
  day: string;
  room: string;
  status: "Upcoming" | "Ongoing" | "Present" | "Absent" | "Attended";
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
};

const statusEmoji: Record<string, string> = {
  Upcoming: "🔵", Ongoing: "🟡", Present: "🟢", Absent: "🔴", Attended: "🟣",
};

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF:       { bg: "#e0e7ff", color: "#4338ca" },
  TTH:       { bg: "#f3e8ff", color: "#7e22ce" },
  SAT:       { bg: "#ffedd5", color: "#c2410c" },
  SUN:       { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const getTodayCode = () => {
  const d = new Date().getDay();
  if (d === 1 || d === 3 || d === 5) return "MWF";
  if (d === 2 || d === 4) return "TTH";
  if (d === 6) return "SAT";
  if (d === 0) return "SUN";
  return "";
};

// ── Helpers ──────────────────────────────────────────────────────
const isTimeUp = (endTime?: string): boolean => {
  if (!endTime) return false;
  const now = new Date();
  const [hours, minutes] = endTime.split(":").map(Number);
  const end = new Date();
  end.setHours(hours, minutes, 0, 0);
  return now > end;
};

const isTimeStarted = (startTime?: string): boolean => {
  if (!startTime) return false;
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  return now >= start;
};

const isTodaySchedule = (s: Schedule): boolean => {
  const d = new Date().getDay();
  const todayMap: Record<number, string[]> = {
    1: ["MWF"], 2: ["TTH"], 3: ["MWF"],
    4: ["TTH"], 5: ["MWF"], 6: ["SAT", "SAT-SUN"], 0: ["SUN", "SAT-SUN"],
  };
  return todayMap[d]?.includes(s.day) ?? false;
};

const getDisplayStatus = (s: Schedule): Schedule["status"] => {
  if (s.status === "Present" || s.status === "Attended" || s.status === "Absent") {
    return s.status;
  }
  if (!isTodaySchedule(s)) return s.status;
  if ((s.status === "Upcoming" || s.status === "Ongoing") && isTimeUp(s.end_time)) {
    return "Absent";
  }
  if (s.status === "Upcoming" && isTimeStarted(s.time) && !isTimeUp(s.end_time)) {
    return "Ongoing";
  }
  return s.status;
};

export default function SchedulesTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]     = useState(false);
  const [dayFilter, setDayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [now, setNow]             = useState(new Date());

  // Track which schedule IDs have already been set to ongoing
  const reportedOngoing = React.useRef<Set<number>>(new Set());

  // ── Tick every minute ──
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const fetchSchedules = (clear = false) => {
    if (clear) reportedOngoing.current.clear();
    setLoading(true);
    api.get("/instructor/schedules")
      .then(res => setSchedules(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules(true);
  }, []);

  // ── Auto-set Ongoing + insert Absent log when time starts ──
  useEffect(() => {
    if (schedules.length === 0) return;

    const ongoingSchedules = schedules.filter(s => {
      if (s.status !== "Upcoming") return false;
      if (reportedOngoing.current.has(s.id)) return false;
      if (!isTodaySchedule(s)) return false;
      return isTimeStarted(s.time) && !isTimeUp(s.end_time);
    });

    if (ongoingSchedules.length === 0) return;

    ongoingSchedules.forEach(async (s) => {
      reportedOngoing.current.add(s.id);
      try {
        await api.post("/admin/schedules/set-ongoing", {
          schedule_id: s.id,
        });
        console.log(`✅ Set ongoing: ${s.subject}`);
        fetchSchedules();
      } catch (err: any) {
        console.error(`❌ Failed to set ongoing: ${s.subject}`, err?.response?.data ?? err);
        reportedOngoing.current.delete(s.id);
      }
    });
  }, [schedules, now]);

  const todayCode       = getTodayCode();
  const todaySchedules  = schedules.filter(s => s.day === todayCode || s.day === "SAT-SUN");
  const presentCount    = schedules.filter(s => s.status === "Present" || s.status === "Attended").length;

  const filtered = schedules.filter(s => {
    const matchDay    = dayFilter    === "" || s.day    === dayFilter;
    const matchStatus = statusFilter === "" || getDisplayStatus(s) === statusFilter;
    return matchDay && matchStatus;
  });

  const inputStyle: React.CSSProperties = {
    padding: "0.375rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    fontSize: "0.8rem",
    outline: "none",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)", borderRadius: "0.75rem", padding: "1.5rem", color: "#fff", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>My Schedules</h1>
        <p style={{ fontSize: "0.875rem", color: "#c4b5fd", marginTop: "0.25rem", marginBottom: 0 }}>Your assigned classes and attendance status</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Classes", value: schedules.length,                                          border: "#6366f1", color: "#6366f1" },
          { label: "Today",         value: todaySchedules.length,                                     border: "#f59e0b", color: "#f59e0b" },
          { label: "Present",       value: presentCount,                                               border: "#22c55e", color: "#22c55e" },
          { label: "Upcoming",      value: schedules.filter(s => s.status === "Upcoming").length,     border: "#3b82f6", color: "#3b82f6" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem", borderLeft: `4px solid ${stat.border}` }}>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.25rem" }}>{stat.label}</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today's Classes */}
      {todaySchedules.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
          <h3 style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Today's Classes
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 400 }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
            {todaySchedules.map(s => {
              const displayStatus = getDisplayStatus(s);
              return (
                <div key={s.id} style={{
                  padding: "1rem", borderRadius: "0.75rem",
                  border: `2px solid ${statusColors[displayStatus]?.color}30`,
                  background: statusColors[displayStatus]?.bg,
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#1f2937", margin: "0 0 0.125rem", fontSize: "0.9rem" }}>{s.subject}</p>
                    <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#6b7280", margin: "0 0 0.5rem" }}>{s.subject_code}</p>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#6b7280" }}>
                      <span>🕐 {s.time}{s.end_time ? ` – ${s.end_time}` : ""}</span>
                      <span>🏫 {s.room}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap",
                    background: statusColors[displayStatus]?.bg, color: statusColors[displayStatus]?.color,
                    border: `1px solid ${statusColors[displayStatus]?.color}40`,
                  }}>
                    {statusEmoji[displayStatus]} {displayStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Schedules */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <h3 style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem", margin: 0 }}>All Schedules</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={inputStyle}>
              <option value="">All Days</option>
              {["MWF", "TTH", "SAT", "SUN", "SAT-SUN"].map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="">All Status</option>
              {["Upcoming", "Ongoing", "Present", "Absent", "Attended"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#9ca3af" }}>
            <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Loading schedules...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.875rem" }}>No schedules found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {["Subject", "Code", "Room", "Time", "Day", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const displayStatus = getDisplayStatus(s);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#1f2937" }}>{s.subject}</td>
                      <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#6b7280" }}>{s.subject_code}</td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: "#e0e7ff", color: "#4338ca" }}>
                          {s.room}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                        {s.time}{s.end_time ? ` – ${s.end_time}` : ""}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, background: dayColors[s.day]?.bg, color: dayColors[s.day]?.color }}>
                          {s.day}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500, background: statusColors[displayStatus]?.bg, color: statusColors[displayStatus]?.color }}>
                          {statusEmoji[displayStatus]} {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}