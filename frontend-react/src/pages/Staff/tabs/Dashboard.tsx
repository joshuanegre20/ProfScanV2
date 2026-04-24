// src/pages/Staff/tabs/MyDashboardTab.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  background: "#f1f5f9",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
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
  const [showWelcomeText, setShowWelcomeText] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [socketStatus, setSocketStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  
  const staffName = localStorage.getItem("name") ?? "Staff";
  const staffId   = localStorage.getItem("staff_id") ?? "";

  // Function to calculate stats from attendance logs
  const calculateStats = useCallback((logs: AttendanceLog[]): Stats => {
    const present = logs.filter(l => l.status?.toLowerCase() === "present").length;
    const absent  = logs.filter(l => l.status?.toLowerCase() === "absent").length;
    const excused = logs.filter(l => l.status?.toLowerCase() === "excused").length;
    const total   = logs.length;
    return { present, absent, excused, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, []);

  // Update attendance data (both logs and stats)
  const updateAttendanceData = useCallback((newLog: AttendanceLog | null = null) => {
    if (newLog) {
      // Add new log to the beginning and keep only last 5
      setRecentLogs(prev => [newLog, ...prev].slice(0, 5));
      
      // Update stats with the new log
      setStats(prevStats => {
        const newStatus = newLog.status?.toLowerCase();
        let newPresent = prevStats.present;
        let newAbsent = prevStats.absent;
        let newExcused = prevStats.excused;
        const newTotal = prevStats.total + 1;
        
        if (newStatus === "present") newPresent++;
        else if (newStatus === "absent") newAbsent++;
        else if (newStatus === "excused") newExcused++;
        
        return {
          present: newPresent,
          absent: newAbsent,
          excused: newExcused,
          total: newTotal,
          rate: newTotal > 0 ? Math.round((newPresent / newTotal) * 100) : 0
        };
      });
    } else {
      // Full refresh
      fetchAll(true);
    }
  }, []);

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
        setStats(calculateStats(arr));
      }

      if (activitiesRes.status === "fulfilled") {
        const d = activitiesRes.value.data?.data ?? activitiesRes.value.data ?? [];
        setActivities(Array.isArray(d) ? d.slice(0, 8) : []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

  // Handle real-time attendance update from WebSocket
  const handleAttendanceUpdate = useCallback((data: any) => {
    console.log("📋 Real-time attendance update:", data);
    
    // If the update contains the full attendance log, add it directly
    if (data.attendance_log && data.attendance_log.id) {
      updateAttendanceData(data.attendance_log);
    } else if (data.log_id || data.attendance_id) {
      // If we only have an ID, fetch the specific log
      const logId = data.log_id || data.attendance_id;
      api.get(`/instructor/attendance-logs/${logId}`)
        .then(res => {
          if (res.data) {
            updateAttendanceData(res.data);
          }
        })
        .catch(err => console.error("Failed to fetch updated attendance:", err));
    } else {
      // Otherwise do a full refresh
      fetchAll(true);
    }
  }, [updateAttendanceData]);

  // Handle real-time scan update
  const handleScanUpdate = useCallback((data: any) => {
    console.log("📱 Real-time scan:", data);
    
    // Add to activities immediately
    setActivities(prev => [{
      id: Date.now(),
      name: data.name,
      type: "scan",
      instructor_id: data.instructor_id,
      staff_id: data.staff_id,
      subject: data.subject ?? null,
      description: data.subject ? `Scanned in for ${data.subject}` : "Attendance scan",
      created_at: data.scanned_at ?? new Date().toISOString(),
    }, ...prev].slice(0, 8));
    
    // If this scan created an attendance record, update attendance
    if (data.attendance_log) {
      updateAttendanceData(data.attendance_log);
    } else if (data.instructor_id || data.staff_id) {
      // Fetch latest attendance after scan
      fetchAll(true);
    }
  }, [updateAttendanceData]);

  // Handle schedule update (might affect attendance status)
  const handleScheduleUpdate = useCallback((data: any) => {
    console.log("📅 Real-time schedule update:", data);
    // Schedule changes might affect attendance records
    fetchAll(true);
  }, []);

  // Handle activity update
  const handleActivityUpdate = useCallback((data: any) => {
    console.log("📋 Real-time activity:", data);
    setActivities(prev => [{
      id: data.id ?? Date.now(),
      name: data.name,
      type: data.type,
      instructor_id: data.instructor_id ?? null,
      staff_id: data.staff_id ?? null,
      subject: data.subject ?? null,
      description: data.description ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
    }, ...prev].slice(0, 8));
    
    // If activity affects attendance (like status change), refresh
    if (data.type === 'attendance_update' || data.type === 'status_change') {
      fetchAll(true);
    }
  }, []);

  // WebSocket connection
  const { isConnected, connectionError } = useSocket({
    room: "staff",
    onScan: handleScanUpdate,
    onAttendanceUpdate: handleAttendanceUpdate,
    onScheduleUpdate: handleScheduleUpdate,
    onActivityUpdate: handleActivityUpdate,
  });

  // Update socket status for UI
  useEffect(() => {
    setSocketStatus(isConnected ? "connected" : "disconnected");
  }, [isConnected]);

  // Auto-hide welcome text after 5 seconds
  useEffect(() => {
    if (showWelcomeText) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShowWelcomeText(false);
          setIsFadingOut(false);
        }, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeText]);

  // Initial data load
  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + "/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
    fetchAll(false);
    
    // Cleanup
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, []);

  // Polling fallback when WebSocket is disconnected (optional)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchAll(true);
      }, 30000); // Poll every 30 seconds as fallback
      return () => clearInterval(interval);
    }
  }, [isConnected]);
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchAll(true);
      }, 30000); // Poll every 30 seconds as fallback
      return () => clearInterval(interval);
    }
  }, [isConnected]);

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
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "1rem", padding: "1.75rem 2rem", color: "#fff" }}>
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
              {showWelcomeText && (
                <h1 
                  style={{ 
                    fontSize: "1.375rem", 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    animation: isFadingOut ? "fadeOut 0.5s ease-out forwards" : "fadeIn 0.5s ease-in",
                  }}
                >
                  Welcome back, {staffName.split(" ")[0]}! 👋
                </h1>
              )}
              {!showWelcomeText && (
                <h1 style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.2 }}>
                  Staff Dashboard
                </h1>
              )}
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
            <span style={{ 
              fontSize: "0.65rem", 
              background: socketStatus === "connected" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", 
              color: socketStatus === "connected" ? "#4ade80" : "#f87171", 
              padding: "0.2rem 0.6rem", 
              borderRadius: "9999px", 
              marginTop: "0.375rem", 
              display: "inline-block" 
            }}>
              {socketStatus === "connected" ? "🟢 Live" : socketStatus === "connecting" ? "🟡 Connecting..." : "🔴 Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats - Now updates in real-time via WebSocket */}
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

        {/* Recent Attendance - Now updates in real-time */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>Recent Attendance</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {socketStatus === "connected" && (
                <span style={{ fontSize: "0.6rem", color: "#22c55e", animation: "pulse 2s infinite" }}>● Live</span>
              )}
              <button onClick={() => setActiveTab("attendance")}
                style={{ background: "none", border: "none", color: "#ffd700", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500 }}>View All →</button>
            </div>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem 0" }}>No attendance records yet</p>
            ) : recentLogs.map(log => (
              <div key={log.id} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "0.625rem 0.875rem", 
                background: "#ffffff", 
                borderRadius: "0.5rem", 
                border: "1px solid #e2e8f0",
                transition: "all 0.3s ease",
                animation: "slideIn 0.3s ease-out"
              }}>
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

        {/* Recent Activities - Real-time updates working */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem", margin: 0 }}>Recent Activities</h3>
            <span style={{ 
              fontSize: "0.7rem", 
              background: socketStatus === "connected" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)", 
              color: socketStatus === "connected" ? "#22c55e" : "#f87171", 
              border: `1px solid ${socketStatus === "connected" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`, 
              borderRadius: "999px", 
              padding: "2px 8px" 
            }}>
              {socketStatus === "connected" ? "Live · Socket" : "Reconnecting..."}
            </span>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activities.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", textAlign: "center", padding: "1.5rem 0" }}>No recent activities</p>
            ) : activities.map((a, i) => {
              const tc = activityTypeColor(a.type);
              return (
                <div key={a.id ?? i} style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "0.75rem", 
                  padding: "0.5rem", 
                  background: "#ffffff", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #e2e8f0",
                  animation: "slideIn 0.3s ease-out"
                }}>
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

      {/* Recent Absent Logs */}
      {recentLogs.some(l => l.status?.toLowerCase() === "absent") && (
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>❌</span> Recent Absent Logs
            </h3>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs
              .filter(l => l.status?.toLowerCase() === "absent")
              .slice(0, 5)
              .map(log => (
                <div key={log.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  background: "#fef2f2",
                  borderRadius: "0.5rem",
                  border: "1px solid #fecaca",
                }}>
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7f1d1d" }}>{log.subject || "—"}</p>
                    <p style={{ fontSize: "0.7rem", color: "#991b1b", marginTop: "0.125rem" }}>
                      {log.date}{log.room ? ` · ${log.room}` : ""}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "#fecaca",
                    color: "#dc2626"
                  }}>
                    Absent
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

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
              style={{ padding: "1rem", border: `2px dashed ${a.color}40`, borderRadius: "0.75rem", background: "#ffffff", color: a.color, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = a.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
              <span style={{ fontSize: "1.5rem" }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}