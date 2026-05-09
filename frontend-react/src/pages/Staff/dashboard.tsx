// src/pages/Staff/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";

import MyDashboardTab from "./tabs/Dashboard";
import MyAttendanceTab from "./tabs/Attendance";
import MyScheduleTab from "./tabs/Schedule";
import ProfileTab from "./tabs/Profile";
import InstructorManagerTab from "./tabs/InstructorManage";

// SVG Icon Components
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconInstructors = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSchedule = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconAttendance = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconCollapse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconExpand = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Tab configuration
interface TabItem {
  key: string;
  label: string;
  component: React.ComponentType<any>;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { key: "dashboard", label: "Dashboard", component: MyDashboardTab, icon: <IconDashboard /> },
  { key: "instructors", label: "Instructors", component: InstructorManagerTab, icon: <IconInstructors /> },
  { key: "schedule", label: "Schedule", component: MyScheduleTab, icon: <IconSchedule /> },
  { key: "attendance", label: "Attendance", component: MyAttendanceTab, icon: <IconAttendance /> },
  { key: "profile", label: "My Profile", component: ProfileTab, icon: <IconProfile /> },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Staff";
  const staffId = localStorage.getItem("staff_id") ?? "";
  const department = localStorage.getItem("department") ?? "";

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, []);

  const handleLogoutConfirm = async () => {
    try { await api.post("/logout"); } catch (_) {}
    ["token", "role", "name", "staff_id", "department"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#003366" }}>
      {/* Sidebar - Yellow Background */}
      <aside 
        style={{
          width: sidebarCollapsed ? (isMobile ? "0px" : "80px") : "280px",
          background: "#eab308",
          color: "#1a1a1a",
          transition: "width 0.3s ease",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo and brand area */}
        <div style={{ 
          padding: sidebarCollapsed && !isMobile ? "1rem 0.5rem" : "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          marginBottom: "1rem",
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a1a1a" }}>
              <IconLogo />
            </div>
          )}
          {(!sidebarCollapsed || isMobile) && (
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0, color: "#1a1a1a" }}>Staff Portal</p>
              <p style={{ color: "#4a3a00", fontSize: "0.65rem", margin: 0 }}>Trinidad Municipal College</p>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flex: 1, padding: "0 0.75rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed && !isMobile ? "center" : "flex-start",
                gap: "0.75rem",
                padding: (sidebarCollapsed && !isMobile) ? "0.75rem 0" : "0.75rem 1rem",
                marginBottom: "0.25rem",
                background: activeTab === tab.key ? "rgba(0,0,0,0.15)" : "transparent",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: activeTab === tab.key ? "#1a1a1a" : "#4a3a00",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab.key ? 600 : 400,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{tab.icon}</span>
              {(!sidebarCollapsed || isMobile) && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ 
          padding: "1rem 0.75rem",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          marginTop: "auto",
        }}>
          {/* User Info */}
          {(!sidebarCollapsed || isMobile) && (
            <div style={{ 
              padding: "0.75rem",
              marginBottom: "0.75rem",
              background: "rgba(0,0,0,0.05)",
              borderRadius: "0.5rem",
            }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, margin: "0 0 0.25rem 0", color: "#1a1a1a" }}>
                {userName}
              </p>
              <p style={{ fontSize: "0.65rem", color: "#4a3a00", margin: 0 }}>
                {staffId}{department ? ` · ${department}` : ""}
              </p>
            </div>
          )}

          {/* Collapse Toggle - hide on mobile */}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: "0.75rem",
                background: "rgba(0,0,0,0.05)",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "#4a3a00",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              <span>{sidebarCollapsed ? <IconExpand /> : <IconCollapse />}</span>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => setShowLogout(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: (sidebarCollapsed && !isMobile) ? "center" : "flex-start",
              gap: "0.75rem",
              padding: (sidebarCollapsed && !isMobile) ? "0.75rem" : "0.75rem",
              background: "rgba(0,0,0,0.08)",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              color: "#4a3a00",
              fontSize: "0.875rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          >
            <IconLogout />
            {(!sidebarCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area - Blue Background */}
      <main 
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? (isMobile ? "0px" : "80px") : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          background: "#003366",
        }}
      >
        {/* Mobile Header - only visible when sidebar is collapsed on mobile */}
        {isMobile && sidebarCollapsed && (
          <div style={{
            background: "#eab308",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <IconLogo />
              )}
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.85rem", margin: 0, color: "#1a1a1a" }}>Staff Portal</p>
                <p style={{ color: "#4a3a00", fontSize: "0.6rem", margin: 0 }}>Trinidad Municipal College</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed(false)}
              style={{
                background: "rgba(0,0,0,0.1)",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                cursor: "pointer",
                color: "#1a1a1a",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "2rem" }}>
          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <div
                key={tab.key}
                style={{ display: activeTab === tab.key ? "block" : "none" }}
              >
                <Component setActiveTab={setActiveTab} />
              </div>
            );
          })}
        </div>
      </main>

      {/* Logout Modal */}
      {showLogout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "24rem",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                background: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
              Sign Out
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  background: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  border: "none",
                  borderRadius: "0.5rem",
                  background: "#dc2626",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}