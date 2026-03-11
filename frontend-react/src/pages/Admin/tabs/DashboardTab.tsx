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

export default function DashboardTab({ setActiveTab }: Props) {
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, inactive: 0,
    active_rate: 0, total_events: 0, upcoming_events: 0,
  });
  const [scans, setScans] = useState<Scan[]>([]);
  const [scansLoading, setScansLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data)).catch(() => {});
    fetchScans();

    // Auto-refresh scans every 10 seconds
    const interval = setInterval(fetchScans, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchScans = () => {
    api.get("/admin/recent-scans")
      .then(res => { setScans(res.data); setScansLoading(false); })
      .catch(() => setScansLoading(false));
  };

  const statCards = [
    {
      label: "Total Instructors", value: stats.total,
      border: "#6366f1", iconBg: "#eef2ff", iconColor: "#6366f1",
      sub: `${stats.active} active · ${stats.inactive} inactive`, subColor: "#6366f1",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Active Instructors", value: stats.active,
      border: "#22c55e", iconBg: "#f0fdf4", iconColor: "#22c55e",
      sub: `${stats.active_rate}% active rate`, subColor: "#16a34a",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Inactive Instructors", value: stats.inactive,
      border: "#f87171", iconBg: "#fef2f2", iconColor: "#ef4444",
      sub: "Deactivated accounts", subColor: "#f87171",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Events", value: stats.total_events,
      border: "#a855f7", iconBg: "#faf5ff", iconColor: "#a855f7",
      sub: `${stats.upcoming_events} upcoming`, subColor: "#9333ea",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    { label: "Add Instructor", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", tab: "add-instructor" },
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: "#fff", borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            padding: "1.25rem", borderLeft: `4px solid ${card.border}`,
          }}>
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

      {/* Bottom Row */}
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
                        background: "#eef2ff", color: "#6366f1",
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
    </div>
  );
}