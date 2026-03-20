// src/pages/Staff/tabs/MyDashboardTab.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../../api/axios";

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
  description: string;
  created_at: string;
}

interface Stats {
  present: number;
  absent: number;
  excused: number;
  total: number;
  rate: number;
}

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden",
};

const activityIcon: Record<string, string> = {
  scan: "📱", create: "➕", update: "✏️", delete: "🗑️",
  staff_create: "👤", staff_delete: "👤", subject_create: "📚",
  schedule_create: "📅", department_create: "🏛️", default: "📋",
};

export default function MyDashboardTab({ setActiveTab }: Props) {
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats]           = useState<Stats>({ present: 0, absent: 0, excused: 0, total: 0, rate: 0 });
  const [loading, setLoading]       = useState(true);
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);
  const staffName = localStorage.getItem("name") ?? "Staff";
  const staffId   = localStorage.getItem("staff_id") ?? "";

  useEffect(() => {
    // Fetch TMC logo
    axios.get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});

    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
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
    finally { setLoading(false); }
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "4rem", color: "#9ca3af" }}>
      <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      Loading dashboard...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Welcome Banner with TMC logo ── */}
      <div style={{
        background: "linear-gradient(135deg, #312e81, #4338ca)",
        borderRadius: "1rem", padding: "1.75rem 2rem", color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* TMC Logo */}
          <div style={{ flexShrink: 0 }}>
            {logoUrl ? (
              <img
                src={logoUrl} alt="TMC Logo"
                style={{ width: "4rem", height: "4rem", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)", background: "#fff" }}
              />
            ) : (
              <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                🏫
              </div>
            )}
          </div>
          {/* Text */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "#a5b4fc", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
              Trinidad Municipal College
            </p>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.2 }}>
              Welcome back, {staffName.split(" ")[0]}! 👋
            </h1>
            <p style={{ color: "#c4b5fd", fontSize: "0.8rem", marginTop: "0.375rem" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            {staffId && (
              <p style={{ color: "#7c6fcd", fontSize: "0.7rem", fontFamily: "monospace", marginTop: "0.2rem" }}>{staffId}</p>
            )}
          </div>
        </div>

        {/* Time widget */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#a5b4fc", marginTop: "0.25rem" }}>
            {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Days",  value: stats.total,   color: "#6366f1", border: "#6366f1" },
          { label: "Present",     value: stats.present, color: "#22c55e", border: "#22c55e" },
          { label: "Absent",      value: stats.absent,  color: "#ef4444", border: "#ef4444" },
          { label: "Excused",     value: stats.excused, color: "#f59e0b", border: "#f59e0b" },
          { label: "Rate",        value: `${stats.rate}%`, color: "#4f46e5", border: "#4f46e5" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderLeft: `4px solid ${s.border}`, padding: "1.25rem" }}>
            <p style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Two column ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

        {/* Recent Attendance */}
        <div style={card}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937" }}>Recent Attendance</h3>
            <button onClick={() => setActiveTab("attendance")}
              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500 }}>
              View All →
            </button>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No attendance records yet</p>
            ) : recentLogs.map(log => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1f2937" }}>{log.subject || "Attendance"}</p>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                    {log.date}{log.time_in ? ` · ${log.time_in}` : ""}
                    {log.room ? ` · ${log.room}` : ""}
                  </p>
                </div>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px",
                  background: log.status?.toLowerCase() === "present" ? "#dcfce7" :
                              log.status?.toLowerCase() === "absent"  ? "#fee2e2" :
                              log.status?.toLowerCase() === "excused" ? "#fff3cd" : "#f3f4f6",
                  color:      log.status?.toLowerCase() === "present" ? "#15803d" :
                              log.status?.toLowerCase() === "absent"  ? "#dc2626" :
                              log.status?.toLowerCase() === "excused" ? "#856404" : "#6b7280",
                }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={card}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937" }}>Recent Activities</h3>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activities.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No recent activities</p>
            ) : activities.map(a => (
              <div key={a.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", flexShrink: 0 }}>
                  {activityIcon[a.type] ?? activityIcon.default}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1f2937" }}>{a.name}</p>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.description}</p>
                </div>
                <span style={{ fontSize: "0.65rem", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={card}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937" }}>Quick Actions</h3>
        </div>
        <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {[
            { label: "Instructors", tab: "instructors", bg: "#eef2ff", color: "#4f46e5",  icon: "👨‍🏫" },
            { label: "Schedule",    tab: "schedule",    bg: "#f0f9ff", color: "#0284c7",  icon: "📅" },
            { label: "Attendance",  tab: "attendance",  bg: "#f0fdf4", color: "#15803d",  icon: "📋" },
            { label: "My Profile",  tab: "profile",     bg: "#faf5ff", color: "#7e22ce",  icon: "👤" },
          ].map(a => (
            <button key={a.tab} onClick={() => setActiveTab(a.tab)}
              style={{ padding: "1rem", border: `2px dashed ${a.color}40`, borderRadius: "0.75rem", background: "transparent", color: a.color, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.background = a.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "1.5rem" }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}