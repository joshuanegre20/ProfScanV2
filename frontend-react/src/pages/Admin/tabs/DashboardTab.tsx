// src/pages/Admin/tabs/DashboardTab.tsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Props {
  setActiveTab: (tab: string) => void;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  active_rate: number;
  total_events: number;
  upcoming_events: number;
}

interface Scan {
  name: string;
  instructor_id: string;
  department: string;
  scan_status: string;
  last_scanned_at: string;
}

interface ActivityLog {
  id: number;
  instructor_id?: string;
  staff_id?: string;
  name: string;
  type: string;
  college?: string;
  subject?: string;
  scan_schedule?: string;
  device_id?: number;
  description?: string;
  created_at: string;
}

interface DepartmentStat {
  department: string;
  count: number;
  active_count: number;
  percentage: number;
}

interface EventStat {
  month: string;
  count: number;
  type: 'upcoming' | 'past';
}

interface Device {
  id: number;
  name: string;
  status: "online" | "offline";
  paired: boolean;
  last_seen: string | null;
}

interface ModalData {
  type: 'instructors' | 'events';
  title: string;
}

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  transition: "transform 0.2s, box-shadow 0.2s",
};

export default function DashboardTab({ setActiveTab }: Props) {
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, inactive: 0,
    active_rate: 0, total_events: 0, upcoming_events: 0,
  });
  const [scans, setScans] = useState<Scan[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scansLoading, setScansLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Socket.io — real-time updates ───────────────────────────
  useSocket({
    room: "admin",
    onScan: (data) => {
      // Instantly prepend to Recent Scans
      setScans(prev => {
        const newScan: Scan = {
          name: data.name,
          instructor_id: data.instructor_id,
          department: data.department ?? "—",
          scan_status: data.status === "Present" ? "scanned" : data.status,
          last_scanned_at: data.scanned_at ?? new Date().toISOString(),
        };
        return [newScan, ...prev].slice(0, 10);
      });
      // Update device status when scan happens
      if (data.device_id) {
        setDevices(prev => prev.map(d =>
          d.id === data.device_id
            ? { ...d, status: "online", last_seen: new Date().toISOString() }
            : d
        ));
      }
      api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    },
    onActivityUpdate: (data) => {
      setActivities(prev => {
        const newActivity: ActivityLog = {
          id: data.id ?? Date.now(),
          name: data.name,
          type: data.type,
          instructor_id: data.instructor_id ?? null,
          subject: data.subject ?? null,
          description: data.description ?? null,
          created_at: data.created_at ?? new Date().toISOString(),
        };
        return [newActivity, ...prev].slice(0, 10);
      });
      setActivitiesLoading(false);
    },
    onDeviceStatus: () => {
      fetchDevices();
    },
    onScheduleUpdate: () => {
      api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
      fetchActivities();
    },
    onAttendanceUpdate: () => {
      api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
      fetchActivities();
      fetchScans();
    },
  });

  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    fetchScans();
    fetchActivities();
    fetchDevices();

    const interval = setInterval(() => {
      fetchScans();
      fetchDevices();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchScans = () => {
    api.get("/admin/recent-scans")
      .then(res => { setScans(res.data); setScansLoading(false); })
      .catch(() => setScansLoading(false));
  };

  const fetchActivities = useCallback(() => {
    api.get("/admin/activities", { params: { limit: 10 } })
      .then(res => {
        if (Array.isArray(res.data)) setActivities(res.data);
        else if (res.data.data && Array.isArray(res.data.data)) setActivities(res.data.data);
        else setActivities([]);
        setActivitiesLoading(false);
      })
      .catch(() => setActivitiesLoading(false));
  }, []);

  const fetchDevices = () => {
    api.get("/devices")
      .then(res => { setDevices(res.data); setDevicesLoading(false); })
      .catch(() => setDevicesLoading(false));
  };

  const fetchDepartmentStats = async () => {
    setModalLoading(true);
    try { const res = await api.get("/admin/stats/departments"); setDepartmentStats(res.data); }
    catch (error) { console.error("Failed to fetch department stats:", error); }
    finally { setModalLoading(false); }
  };

  const fetchEventStats = async () => {
    setModalLoading(true);
    try { const res = await api.get("/admin/stats/events"); setEventStats(res.data); }
    catch (error) { console.error("Failed to fetch event stats:", error); }
    finally { setModalLoading(false); }
  };

  const handleCardClick = (type: 'instructors' | 'events') => {
    setModalData({ type, title: type === 'instructors' ? 'Instructor Statistics' : 'Event Statistics' });
    if (type === 'instructors') fetchDepartmentStats();
    else fetchEventStats();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
    setDepartmentStats([]);
    setEventStats([]);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatLastSeen = (ts: string | null) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleTimeString();
  };

  const getActivityIcon = (type: string) => ({ scan:"📱",create:"➕",update:"✏️",delete:"🗑️",login:"🔐",logout:"🚪",security_change:"🔒",status_change:"🔄",event_create:"📅",event_update:"📅",event_delete:"📅",schedule_create:"⏰",schedule_delete:"⏰",subject_create:"📚",subject_update:"📚",subject_delete:"📚",department_create:"🏛️",department_update:"🏛️",department_delete:"🏛️",staff_create:"👤",staff_delete:"👤",staff_status_change:"👤",profile_update:"👤" }[type] || "📋");

  const getActivityColor = (type: string) => ({ scan:"#dcfce7",create:"#dbeafe",update:"#fef9c3",delete:"#fee2e2",login:"#f3e8ff",logout:"#f3f4f6",security_change:"#ffedd5",status_change:"#fce7f3" }[type] || "#f3f4f6");

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const pairedDevices = devices.filter(d => d.paired).length;
  const totalDevices = devices.length;

  const statCards = [
    {
      label: "Total Instructors", value: stats.total,
      border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626",
      sub: `${stats.active} active · ${stats.inactive} inactive`, subColor: "#dc2626",
      clickable: true, onClick: () => handleCardClick('instructors'),
      icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
    },
    {
      label: "Active Instructors", value: stats.active,
      border: "#16a34a", iconBg: "#f0fdf4", iconColor: "#16a34a",
      sub: `${stats.active_rate}% active rate`, subColor: "#16a34a",
      clickable: true, onClick: () => handleCardClick('instructors'),
      icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
    {
      label: "Inactive Instructors", value: stats.inactive,
      border: "#ef4444", iconBg: "#fef2f2", iconColor: "#ef4444",
      sub: "Deactivated accounts", subColor: "#ef4444",
      clickable: true, onClick: () => handleCardClick('instructors'),
      icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
    {
      label: "Total Events", value: stats.total_events,
      border: "#9333ea", iconBg: "#faf5ff", iconColor: "#9333ea",
      sub: `${stats.upcoming_events} upcoming`, subColor: "#9333ea",
      clickable: true, onClick: () => handleCardClick('events'),
      icon: (<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
    },
  ];

  const quickActions = [
    { label: "Add Instructor", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", tab: "add-instructor", icon: "👨‍🏫" },
    { label: "Add Staff", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", tab: "add-staff", icon: "👥" },
    { label: "Add Subject", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", tab: "add-subject", icon: "📚" },
    { label: "Add Department", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", tab: "add-department", icon: "🏛️" },
    { label: "Manage Devices", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", tab: "device", icon: "🔌" },
    { label: "View Reports", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", tab: null, icon: "📊" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Welcome Banner */}
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "1rem", padding: "1.75rem 2rem", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#bfdbfe", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
              Admin Dashboard
            </p>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.2 }}>Welcome back, Admin! 👋</h1>
            <p style={{ color: "#bfdbfe", fontSize: "0.8rem", marginTop: "0.375rem" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffd700", lineHeight: 1 }}>
              {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
            <span style={{ fontSize: "0.65rem", background: "rgba(255,215,0,0.2)", color: "#ffd700", padding: "0.2rem 0.6rem", borderRadius: "9999px", display: "inline-block" }}>
              🟢 Live
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {statCards.map(card => (
          <div key={card.label} onClick={card.clickable ? card.onClick : undefined}
            style={{ ...glassCardStyle, padding: "1.25rem", borderLeft: `4px solid ${card.border}`, cursor: card.clickable ? "pointer" : "default", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
            onMouseEnter={e => { if (card.clickable) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.1)"; } }}
            onMouseLeave={e => { if (card.clickable) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"; } }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#64748b" }}>{card.label}</p>
              <div style={{ padding: "0.5rem", borderRadius: "0.5rem", background: card.iconBg, color: card.iconColor }}>{card.icon}</div>
            </div>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1e293b" }}>{card.value}</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: card.subColor }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Device Status Section */}
      <div style={glassCardStyle}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="20" height="20" fill="none" stroke="#003366" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
              </svg>
              Device Status
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
              {onlineDevices} device{onlineDevices !== 1 ? "s" : ""} online · {pairedDevices}/{totalDevices} paired
            </p>
          </div>
          <button
            onClick={() => setActiveTab("device")}
            style={{ padding: "0.375rem 0.875rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
            onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
          >
            Manage Devices →
          </button>
        </div>

        {devicesLoading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
          </div>
        ) : devices.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "#94a3b8" }}>No devices configured yet</p>
            <button
              onClick={() => setActiveTab("device")}
              style={{ marginTop: "0.75rem", padding: "0.375rem 0.875rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Add Device
            </button>
          </div>
        ) : (
          <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {devices.slice(0, 4).map(device => (
              <div
                key={device.id}
                style={{
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: "0.75rem",
                  borderLeft: `4px solid ${device.status === "online" ? "#22c55e" : "#ef4444"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>{device.name}</p>
                    <p style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>ID: {device.id}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: device.status === "online" ? "#22c55e" : "#ef4444",
                      display: "inline-block",
                    }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: device.status === "online" ? "#22c55e" : "#ef4444" }}>
                      {device.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                  <span>{device.paired ? "✓ Paired" : "⏳ Unpaired"}</span>
                  <span>Last seen: {formatLastSeen(device.last_seen)}</span>
                </div>
              </div>
            ))}
            {devices.length > 4 && (
              <div
                style={{
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() => setActiveTab("device")}
              >
                <p style={{ color: "#003366", fontSize: "0.875rem", fontWeight: 500 }}>
                  +{devices.length - 4} more devices
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>

        {/* Recent Scans */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem", margin: 0 }}>Recent Scans</h3>
            <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "999px", padding: "2px 8px" }}>
              Live · Socket
            </span>
          </div>
          <div style={{ padding: "1rem 1.25rem" }}>
            {scansLoading ? (
              <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Loading...</p>
            ) : scans.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>No scans yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {scans.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ marginTop: "0.35rem", width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", color: "#1e293b", margin: 0 }}>
                        <strong>{s.name}</strong>
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "#fee2e2", color: "#dc2626", borderRadius: "999px", padding: "1px 6px" }}>{s.instructor_id}</span>
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "2px 0 0" }}>{s.department} · {formatTime(s.last_scanned_at)}</p>
                    </div>
                    <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", flexShrink: 0, background: s.scan_status === "scanned" ? "#dcfce7" : "#fef2f2", color: s.scan_status === "scanned" ? "#15803d" : "#ef4444", border: `1px solid ${s.scan_status === "scanned" ? "#bbf7d0" : "#fecaca"}` }}>
                      {s.scan_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={glassCardStyle}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontWeight: 600, color: "#1e293b", margin: 0, fontSize: "0.95rem" }}>Quick Actions</h3>
          </div>
          <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => action.tab && setActiveTab(action.tab)}
                style={{
                  padding: "1rem",
                  border: `2px dashed ${action.border}`,
                  borderRadius: "0.75rem",
                  background: "transparent",
                  color: action.color,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: action.tab ? "pointer" : "default",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={e => { if (action.tab) e.currentTarget.style.background = action.bg; }}
                onMouseLeave={e => { if (action.tab) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "1.25rem" }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div style={glassCardStyle}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ fontWeight: 600, color: "#1e293b", margin: 0, fontSize: "0.95rem" }}>Recent Activities</h3>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          {activitiesLoading ? (
            <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Loading activities...</p>
          ) : activities.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>No recent activities.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activities.map((activity, i) => (
                <div key={activity.id || i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: getActivityColor(activity.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#1e293b", margin: 0 }}>
                      <strong>{activity.name}</strong>
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "#fee2e2", color: "#dc2626", borderRadius: "999px", padding: "1px 6px" }}>{activity.type}</span>
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "2px 0 0" }}>
                      {activity.description || activity.type.replace(/_/g, ' ')}
                      {(activity.college || activity.subject) && <span> · {activity.college} {activity.college && activity.subject && "·"} {activity.subject}</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", flexShrink: 0, background: "#f1f5f9", color: "#475569" }}>{formatDate(activity.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && modalData && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={closeModal}>
          <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>{modalData.title}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", padding: "0.25rem", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "2rem" }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ width: "2rem", height: "2rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 1rem" }} />
                  <p style={{ color: "#64748b" }}>Loading statistics...</p>
                </div>
              ) : (
                <>
                  {modalData.type === 'instructors' && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ background: "#fee2e2", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}>
                          <p style={{ fontSize: "0.8rem", color: "#991b1b", marginBottom: "0.5rem" }}>Total</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#991b1b" }}>{stats.total}</p>
                        </div>
                        <div style={{ background: "#f0fdf4", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}>
                          <p style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "0.5rem" }}>Active Rate</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>{stats.active_rate}%</p>
                        </div>
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>Department Distribution</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {departmentStats.length > 0 ? departmentStats.map((dept, i) => (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span style={{ fontSize: "0.875rem", color: "#475569" }}>{dept.department}</span>
                              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#003366" }}>{dept.count} ({dept.percentage}%)</span>
                            </div>
                            <div style={{ width: "100%", height: "0.5rem", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                              <div style={{ width: `${dept.percentage}%`, height: "100%", background: "#003366", borderRadius: "999px", transition: "width 0.3s ease" }} />
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.125rem" }}>{dept.active_count} active · {dept.count - dept.active_count} inactive</p>
                          </div>
                        )) : <p style={{ color: "#94a3b8", textAlign: "center" }}>No department data available</p>}
                      </div>
                      <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>Status Distribution</h3>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
                          <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: `conic-gradient(#22c55e 0deg ${stats.active_rate * 3.6}deg, #ef4444 ${stats.active_rate * 3.6}deg 360deg)` }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#22c55e" }} />
                              <span style={{ fontSize: "0.875rem", color: "#374151" }}>Active: {stats.active}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#ef4444" }} />
                              <span style={{ fontSize: "0.875rem", color: "#374151" }}>Inactive: {stats.inactive}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {modalData.type === 'events' && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ background: "#faf5ff", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}>
                          <p style={{ fontSize: "0.8rem", color: "#6b21a8", marginBottom: "0.5rem" }}>Total Events</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#6b21a8" }}>{stats.total_events}</p>
                        </div>
                        <div style={{ background: "#f0f9ff", borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}>
                          <p style={{ fontSize: "0.8rem", color: "#075985", marginBottom: "0.5rem" }}>Upcoming</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#075985" }}>{stats.upcoming_events}</p>
                        </div>
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>Monthly Events</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {eventStats.length > 0 ? eventStats.map((event, i) => {
                          const maxCount = Math.max(...eventStats.map(e => e.count), 1);
                          const percentage = (event.count / maxCount) * 100;
                          return (
                            <div key={i}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#475569" }}>{event.month}</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: event.type === 'upcoming' ? "#22c55e" : "#64748b" }}>{event.count} {event.type}</span>
                              </div>
                              <div style={{ width: "100%", height: "0.5rem", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{ width: `${percentage}%`, height: "100%", background: event.type === 'upcoming' ? "#22c55e" : "#94a3b8", borderRadius: "999px", transition: "width 0.3s ease" }} />
                              </div>
                            </div>
                          );
                        }) : <p style={{ color: "#94a3b8", textAlign: "center" }}>No event data available</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={closeModal}
                style={{ padding: "0.625rem 1.5rem", background: "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
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