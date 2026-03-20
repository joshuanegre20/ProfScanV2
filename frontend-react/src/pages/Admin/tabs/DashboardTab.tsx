// src/pages/Admin/tabs/DashboardTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

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

interface ModalData {
  type: 'instructors' | 'events';
  title: string;
}

export default function DashboardTab({ setActiveTab }: Props) {
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, inactive: 0,
    active_rate: 0, total_events: 0, upcoming_events: 0,
  });
  const [scans, setScans] = useState<Scan[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [scansLoading, setScansLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    fetchScans();
    fetchActivities();

    // Auto-refresh scans every 10 seconds
    const interval = setInterval(fetchScans, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchScans = () => {
    api.get("/admin/recent-scans")
      .then(res => { setScans(res.data); setScansLoading(false); })
      .catch(() => setScansLoading(false));
  };

  const fetchActivities = () => {
    api.get("/admin/activities", { params: { limit: 10 } })
      .then(res => { 
        if (Array.isArray(res.data)) {
          setActivities(res.data);
        } else if (res.data.data && Array.isArray(res.data.data)) {
          setActivities(res.data.data);
        } else {
          setActivities([]);
        }
        setActivitiesLoading(false);
      })
      .catch(() => setActivitiesLoading(false));
  };

  const fetchDepartmentStats = async () => {
    setModalLoading(true);
    try {
      const res = await api.get("/admin/stats/departments");
      setDepartmentStats(res.data);
    } catch (error) {
      console.error("Failed to fetch department stats:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchEventStats = async () => {
    setModalLoading(true);
    try {
      const res = await api.get("/admin/stats/events");
      setEventStats(res.data);
    } catch (error) {
      console.error("Failed to fetch event stats:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCardClick = (type: 'instructors' | 'events') => {
    setModalData({ 
      type, 
      title: type === 'instructors' ? 'Instructor Statistics' : 'Event Statistics' 
    });
    
    if (type === 'instructors') {
      fetchDepartmentStats();
    } else {
      fetchEventStats();
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
    setDepartmentStats([]);
    setEventStats([]);
  };

  const statCards = [
    {
      label: "Total Instructors", value: stats.total,
      border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626",
      sub: `${stats.active} active · ${stats.inactive} inactive`, subColor: "#dc2626",
      clickable: true,
      onClick: () => handleCardClick('instructors'),
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Active Instructors", value: stats.active,
      border: "#16a34a", iconBg: "#f0fdf4", iconColor: "#16a34a",
      sub: `${stats.active_rate}% active rate`, subColor: "#16a34a",
      clickable: true,
      onClick: () => handleCardClick('instructors'),
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Inactive Instructors", value: stats.inactive,
      border: "#ef4444", iconBg: "#fef2f2", iconColor: "#ef4444",
      sub: "Deactivated accounts", subColor: "#ef4444",
      clickable: true,
      onClick: () => handleCardClick('instructors'),
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Events", value: stats.total_events,
      border: "#9333ea", iconBg: "#faf5ff", iconColor: "#9333ea",
      sub: `${stats.upcoming_events} upcoming`, subColor: "#9333ea",
      clickable: true,
      onClick: () => handleCardClick('events'),
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    { label: "Add Instructor", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", tab: "add-instructor" },
    { label: "Create Event",   color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff", tab: "events" },
    { label: "Add Schedule",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", tab: "schedules" },
    { label: "View Reports",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", tab: null },
  ];

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("en-PH", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      scan: "📱",
      create: "➕",
      update: "✏️",
      delete: "🗑️",
      login: "🔐",
      logout: "🚪",
      security_change: "🔒",
      status_change: "🔄",
      event_create: "📅",
      event_update: "📅",
      event_delete: "📅",
      schedule_create: "⏰",
      schedule_delete: "⏰",
      subject_create: "📚",
      subject_update: "📚",
      subject_delete: "📚",
      department_create: "🏛️",
      department_update: "🏛️",
      department_delete: "🏛️",
      staff_create: "👤",
      staff_delete: "👤",
      staff_status_change: "👤",
      profile_update: "👤",
    };
    return icons[type] || "📋";
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      scan: "#dcfce7",
      create: "#dbeafe",
      update: "#fef9c3",
      delete: "#fee2e2",
      login: "#f3e8ff",
      logout: "#f3f4f6",
      security_change: "#ffedd5",
      status_change: "#fce7f3",
    };
    return colors[type] || "#f3f4f6";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Stat Cards - Now Clickable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {statCards.map(card => (
          <div 
            key={card.label} 
            onClick={card.clickable ? card.onClick : undefined}
            style={{
              background: "#fff", borderRadius: "0.75rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              padding: "1.25rem", borderLeft: `4px solid ${card.border}`,
              cursor: card.clickable ? "pointer" : "default",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={e => {
              if (card.clickable) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={e => {
              if (card.clickable) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6b7280" }}>{card.label}</p>
              <div style={{ padding: "0.5rem", borderRadius: "0.5rem", background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111827" }}>{card.value}</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: card.subColor }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom Row - First Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

        {/* Recent Scans */}
        <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem", margin: 0 }}>Recent Scans</h3>
            <span style={{
              fontSize: "0.7rem", background: "#f0fdf4", color: "#16a34a",
              border: "1px solid #bbf7d0", borderRadius: "999px", padding: "2px 8px",
            }}>
              Live · 10s
            </span>
          </div>

          {scansLoading ? (
            <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Loading...</p>
          ) : scans.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No scans yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {scans.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{
                    marginTop: "0.35rem", width: "0.5rem", height: "0.5rem",
                    borderRadius: "50%", background: "#22c55e", flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>
                      <strong>{s.name}</strong>
                      <span style={{
                        marginLeft: "0.5rem", fontSize: "0.7rem",
                        background: "#fee2e2", color: "#dc2626",
                        borderRadius: "999px", padding: "1px 6px",
                      }}>
                        {s.instructor_id}
                      </span>
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0" }}>
                      {s.department} · {formatTime(s.last_scanned_at)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", flexShrink: 0,
                    background: s.scan_status === "scanned" ? "#f0fdf4" : "#fef2f2",
                    color: s.scan_status === "scanned" ? "#16a34a" : "#ef4444",
                    border: `1px solid ${s.scan_status === "scanned" ? "#bbf7d0" : "#fecaca"}`,
                  }}>
                    {s.scan_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
          <h3 style={{ fontWeight: 600, color: "#1f2937", marginBottom: "1rem", fontSize: "0.95rem" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => action.tab && setActiveTab(action.tab)}
                style={{
                  padding: "1rem", border: `2px dashed ${action.border}`,
                  borderRadius: "0.75rem", background: "transparent",
                  color: action.color, fontSize: "0.8rem", fontWeight: 500,
                  cursor: "pointer", textAlign: "center", transition: "background 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = action.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
        <h3 style={{ fontWeight: 600, color: "#1f2937", marginBottom: "1rem", fontSize: "0.95rem" }}>Recent Activities</h3>
        
        {activitiesLoading ? (
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Loading activities...</p>
        ) : activities.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No recent activities.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activities.map((activity, i) => (
              <div key={activity.id || i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "0.5rem",
                  background: getActivityColor(activity.type),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", flexShrink: 0,
                }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>
                    <strong>{activity.name}</strong>
                    <span style={{
                      marginLeft: "0.5rem", fontSize: "0.7rem",
                      background: "#fee2e2", color: "#dc2626",
                      borderRadius: "999px", padding: "1px 6px",
                    }}>
                      {activity.type}
                    </span>
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0" }}>
                    {activity.description || activity.type.replace(/_/g, ' ')}
                    {(activity.college || activity.subject) && (
                      <span> · {activity.college} {activity.college && activity.subject && "·"} {activity.subject}</span>
                    )}
                  </p>
                </div>
                <span style={{
                  fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", flexShrink: 0,
                  background: "#f3f4f6", color: "#6b7280",
                }}>
                  {formatDate(activity.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && modalData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem",
        }} onClick={closeModal}>
          <div style={{
            background: "#fff", borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            width: "100%", maxWidth: "600px",
            maxHeight: "80vh", overflow: "auto",
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: "1.5rem 2rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                {modalData.title}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none", border: "none",
                  fontSize: "1.5rem", cursor: "pointer",
                  color: "#9ca3af", padding: "0.25rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "2rem" }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{
                    width: "2rem", height: "2rem",
                    border: "2px solid #dc2626", borderTopColor: "transparent",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                    margin: "0 auto 1rem",
                  }} />
                  <p style={{ color: "#6b7280" }}>Loading statistics...</p>
                </div>
              ) : (
                <>
                  {modalData.type === 'instructors' && (
                    <div>
                      {/* Summary Stats */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "1rem", marginBottom: "2rem",
                      }}>
                        <div style={{
                          background: "#fee2e2", borderRadius: "0.75rem",
                          padding: "1.25rem", textAlign: "center",
                        }}>
                          <p style={{ fontSize: "0.8rem", color: "#991b1b", marginBottom: "0.5rem" }}>Total</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#991b1b" }}>{stats.total}</p>
                        </div>
                        <div style={{
                          background: "#f0fdf4", borderRadius: "0.75rem",
                          padding: "1.25rem", textAlign: "center",
                        }}>
                          <p style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "0.5rem" }}>Active Rate</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>{stats.active_rate}%</p>
                        </div>
                      </div>

                      {/* Department Distribution */}
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
                        Department Distribution
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {departmentStats.length > 0 ? (
                          departmentStats.map((dept, i) => (
                            <div key={i}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{dept.department}</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#dc2626" }}>
                                  {dept.count} ({dept.percentage}%)
                                </span>
                              </div>
                              <div style={{
                                width: "100%", height: "0.5rem",
                                background: "#f3f4f6", borderRadius: "999px",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${dept.percentage}%`,
                                  height: "100%",
                                  background: "#dc2626",
                                  borderRadius: "999px",
                                  transition: "width 0.3s ease",
                                }} />
                              </div>
                              <p style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "0.125rem" }}>
                                {dept.active_count} active · {dept.count - dept.active_count} inactive
                              </p>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: "#9ca3af", textAlign: "center" }}>No department data available</p>
                        )}
                      </div>

                      {/* Active/Inactive Pie Chart Placeholder */}
                      <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
                          Status Distribution
                        </h3>
                        <div style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "center", gap: "2rem",
                        }}>
                          {/* Simple Pie Chart Representation */}
                          <div style={{
                            width: "120px", height: "120px",
                            borderRadius: "50%",
                            background: `conic-gradient(#16a34a 0deg ${stats.active_rate * 3.6}deg, #ef4444 ${stats.active_rate * 3.6}deg 360deg)`,
                          }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#16a34a" }} />
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
                      {/* Summary Stats */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "1rem", marginBottom: "2rem",
                      }}>
                        <div style={{
                          background: "#faf5ff", borderRadius: "0.75rem",
                          padding: "1.25rem", textAlign: "center",
                        }}>
                          <p style={{ fontSize: "0.8rem", color: "#6b21a8", marginBottom: "0.5rem" }}>Total Events</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#6b21a8" }}>{stats.total_events}</p>
                        </div>
                        <div style={{
                          background: "#f0f9ff", borderRadius: "0.75rem",
                          padding: "1.25rem", textAlign: "center",
                        }}>
                          <p style={{ fontSize: "0.8rem", color: "#075985", marginBottom: "0.5rem" }}>Upcoming</p>
                          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#075985" }}>{stats.upcoming_events}</p>
                        </div>
                      </div>

                      {/* Monthly Events Bar Chart */}
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
                        Monthly Events
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {eventStats.length > 0 ? (
                          eventStats.map((event, i) => {
                            const maxCount = Math.max(...eventStats.map(e => e.count), 1);
                            const percentage = (event.count / maxCount) * 100;
                            return (
                              <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                  <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{event.month}</span>
                                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#9333ea" }}>
                                    {event.count} {event.type}
                                  </span>
                                </div>
                                <div style={{
                                  width: "100%", height: "0.5rem",
                                  background: "#f3f4f6", borderRadius: "999px",
                                  overflow: "hidden",
                                }}>
                                  <div style={{
                                    width: `${percentage}%`,
                                    height: "100%",
                                    background: event.type === 'upcoming' ? "#22c55e" : "#9ca3af",
                                    borderRadius: "999px",
                                    transition: "width 0.3s ease",
                                  }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ color: "#9ca3af", textAlign: "center" }}>No event data available</p>
                        )}
                      </div>

                      {/* Upcoming vs Past Chart */}
                      <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
                          Upcoming vs Past
                        </h3>
                        <div style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "center", gap: "2rem",
                        }}>
                          {/* Simple Bar Comparison */}
                          <div style={{ width: "200px" }}>
                            <div style={{ marginBottom: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#374151" }}>Upcoming</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#22c55e" }}>{stats.upcoming_events}</span>
                              </div>
                              <div style={{
                                width: "100%", height: "0.75rem",
                                background: "#f3f4f6", borderRadius: "999px",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${(stats.upcoming_events / stats.total_events) * 100}%`,
                                  height: "100%",
                                  background: "#22c55e",
                                  borderRadius: "999px",
                                }} />
                              </div>
                            </div>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#374151" }}>Past</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#9ca3af" }}>
                                  {stats.total_events - stats.upcoming_events}
                                </span>
                              </div>
                              <div style={{
                                width: "100%", height: "0.75rem",
                                background: "#f3f4f6", borderRadius: "999px",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${((stats.total_events - stats.upcoming_events) / stats.total_events) * 100}%`,
                                  height: "100%",
                                  background: "#9ca3af",
                                  borderRadius: "999px",
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "1.5rem 2rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex", justifyContent: "flex-end",
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.625rem 1.5rem",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}