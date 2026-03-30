// src/pages/Staff/tabs/MyDashboardTab.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Props { setActiveTab: (t: string) => void; }

interface AttendanceLog {
  id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  subject?: string;
  room?: string;
  day?: string;
}

interface Activity {
  id: number;
  type: string;
  name: string;
  description?: string;
  instructor_id?: string;
  staff_id?: string;
  college?: string;
  subject?: string;
  device_id?: number;
  created_at: string;
}

interface Stats {
  present: number;
  absent: number;
  excused: number;
  total: number;
  rate: number;
}

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  overflow: "hidden",
};

const activityTypeColor = (type: string): { bg: string; color: string; border: string } => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    scan:            { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "rgba(34, 197, 94, 0.3)" },
    create:          { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
    update:          { bg: "rgba(234, 179, 8, 0.15)", color: "#eab308", border: "rgba(234, 179, 8, 0.3)" },
    delete:          { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
    login:           { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7", border: "rgba(168, 85, 247, 0.3)" },
    schedule_create: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
    event_create:    { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7", border: "rgba(168, 85, 247, 0.3)" },
  };
  return map[type] ?? { bg: "rgba(248, 250, 252, 0.8)", color: "#64748b", border: "rgba(226, 232, 240, 0.5)" };
};

export default function MyDashboardTab({ setActiveTab }: Props) {
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats]           = useState<Stats>({ present: 0, absent: 0, excused: 0, total: 0, rate: 0 });
  const [loading, setLoading]       = useState(true);
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);
  const staffName = localStorage.getItem("name") ?? "Staff";
  const staffId   = localStorage.getItem("staff_id") ?? "";

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [logsRes, activitiesRes] = await Promise.allSettled([
        api.get("/instructor/attendance-logs"),
        api.get("/admin/activities", { params: { limit: 8 } }),
      ]);

      if (logsRes.status === "fulfilled") {
        const data: AttendanceLog[] = logsRes.value.data?.data ?? logsRes.value.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        setRecentLogs(arr.slice(0, 5));
        const present = arr.filter(l => l.status?.toLowerCase() === "present").length;
        const absent  = arr.filter(l => l.status?.toLowerCase() === "absent").length;
        const excused = arr.filter(l => l.status?.toLowerCase() === "excused").length;
        const total   = arr.length;
        setStats({ present, absent, excused, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
      }

      if (activitiesRes.status === "fulfilled") {
        const d = activitiesRes.value.data?.data ?? activitiesRes.value.data ?? [];
        setActivities(Array.isArray(d) ? d : []);
      }
    } catch {}
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + "/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
    fetchAll(false);
  }, []);

  useSocket({
    room: "staff",
    onScan:             (data) => {
      setActivities(prev => [{
        id:            Date.now(),
        name:          data.name,
        type:          "scan",
        instructor_id: data.instructor_id,
        subject:       data.subject ?? null,
        description:   data.subject ? `Scanned in for ${data.subject}` : "Attendance scan",
        created_at:    data.scanned_at ?? new Date().toISOString(),
      }, ...prev].slice(0, 8));
      fetchAll(true);
    },
    onAttendanceUpdate: () => fetchAll(true),
    onScheduleUpdate:   () => fetchAll(true),
    onActivityUpdate:   (data) => {
      setActivities(prev => [{
        id:            data.id ?? Date.now(),
        name:          data.name,
        type:          data.type,
        instructor_id: data.instructor_id ?? null,
        subject:       data.subject ?? null,
        description:   data.description ?? null,
        created_at:    data.created_at ?? new Date().toISOString(),
      }, ...prev].slice(0, 8));
    },
  });

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const formatFullTime = (ts: string) =>
    new Date(ts).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "4rem", color: "#94a3b8" }}>
      <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid #ffd700", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      Loading dashboard...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Welcome Banner */}
      <div style={{ ...glassCardStyle, padding: "1.75rem 2rem", background: "linear-gradient(135deg, #003366, #0055a4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ flexShrink: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="TMC Logo" style={{ width: "4rem", height: "4rem", borderRadius: "50%", objectFit: "cover", border: "3px solid white", background: "#fff" }} />
              ) : (
                <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "3px solid #ffd700", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🏫</div>
              )}
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "#bfdbfe", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Trinidad Municipal College</p>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.2, color: "#fff" }}>Welcome back, {staffName.split(" ")[0]}! 👋</h1>
              <p style={{ color: "#bfdbfe", fontSize: "0.8rem", marginTop: "0.375rem" }}>
                {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              {staffId && <p style={{ color: "#bfdbfe", fontSize: "0.7rem", fontFamily: "monospace", marginTop: "0.2rem" }}>{staffId}</p>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffd700", lineHeight: 1 }}>
              {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#bfdbfe", marginTop: "0.25rem" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <span style={{ fontSize: "0.65rem", background: "rgba(255,215,0,0.2)", color: "#ffd700", padding: "0.2rem 0.6rem", borderRadius: "9999px", marginTop: "0.375rem", display: "inline-block" }}>
              🟢 Live
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Days", value: stats.total,      color: "#ffd700", border: "#ffd700" },
          { label: "Present",    value: stats.present,    color: "#4ade80", border: "#4ade80" },
          { label: "Absent",     value: stats.absent,     color: "#f87171", border: "#f87171" },
          { label: "Excused",    value: stats.excused,    color: "#fbbf24", border: "#fbbf24" },
          { label: "Rate",       value: `${stats.rate}%`, color: "#60a5fa", border: "#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ ...glassCardStyle, borderLeft: `4px solid ${s.border}`, padding: "1.25rem" }}>
            <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

        {/* Recent Attendance */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>Recent Attendance</h3>
            <button onClick={() => setActiveTab("attendance")}
              style={{ background: "none", border: "none", color: "#ffd700", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500 }}>View All →</button>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No attendance records yet</p>
            ) : recentLogs.map(log => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }}>{log.subject || "Attendance"}</p>
                  <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{log.date}{log.time_in ? ` · ${log.time_in}` : ""}{log.room ? ` · ${log.room}` : ""}</p>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px",
                  background: log.status?.toLowerCase() === "present" ? "rgba(34, 197, 94, 0.15)" : log.status?.toLowerCase() === "absent" ? "rgba(239, 68, 68, 0.15)" : log.status?.toLowerCase() === "excused" ? "rgba(251, 191, 36, 0.15)" : "rgba(241, 245, 249, 0.8)",
                  color:      log.status?.toLowerCase() === "present" ? "#22c55e" : log.status?.toLowerCase() === "absent" ? "#ef4444" : log.status?.toLowerCase() === "excused" ? "#eab308" : "#64748b",
                }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem", margin: 0 }}>Recent Activities</h3>
            <span style={{ fontSize: "0.7rem", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "999px", padding: "2px 8px" }}>
              Live · Socket
            </span>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activities.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", textAlign: "center", padding: "1.5rem 0" }}>No recent activities</p>
            ) : activities.map((a, i) => {
              const tc = activityTypeColor(a.type);
              return (
                <div key={a.id ?? i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ marginTop: "0.35rem", width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: a.type === "scan" ? "#22c55e" : "#ffd700", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#1e293b", margin: 0 }}>
                      <strong>{a.name}</strong>
                      {(a.instructor_id || a.staff_id) && (
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "999px", padding: "1px 6px" }}>
                          {a.instructor_id ?? a.staff_id}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "2px 0 0" }}>
                      {a.subject ? `${a.subject} · ` : ""}
                      {formatFullTime(a.created_at)}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", flexShrink: 0, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                    {a.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={glassCardStyle}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>Quick Actions</h3>
        </div>
        <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "Instructors", tab: "instructors", bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", icon: "👨‍🏫" },
            { label: "Schedule",    tab: "schedule",    bg: "rgba(251, 191, 36, 0.1)", color: "#eab308", icon: "📅" },
            { label: "Attendance",  tab: "attendance",  bg: "rgba(34, 197, 94, 0.1)", color: "#22c55e", icon: "📋" },
            { label: "My Profile",  tab: "profile",     bg: "rgba(168, 85, 247, 0.1)", color: "#a855f7", icon: "👤" },
          ].map(a => (
            <button key={a.tab} onClick={() => setActiveTab(a.tab)}
              style={{ padding: "1rem", border: `2px dashed ${a.color}40`, borderRadius: "0.75rem", background: "transparent", color: a.color, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = a.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: "1.5rem" }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}