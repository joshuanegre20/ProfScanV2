// src/pages/Admin/Dashboard.tsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";

// Lazy load tabs for better performance
const DashboardTab = lazy(() => import("./tabs/DashboardTab"));
const InstructorsTab = lazy(() => import("./tabs/InstructorsTab"));
const EventsTab = lazy(() => import("./tabs/EventsTab"));
const SchedulesTab = lazy(() => import("./tabs/SchedulesTab"));
const AddInstructorTab = lazy(() => import("./tabs/AddInstructorTab"));
const StaffTab = lazy(() => import("./tabs/StaffTab"));
const AddStaffTab = lazy(() => import("./tabs/AddStaffTab"));
const SecurityTab = lazy(() => import("./settings/Security"));
const DeviceTab = lazy(() => import("./settings/Device"));
const SettingsTab = lazy(() => import("./settings/Settings"));
const ManageLateTab = lazy(() => import("./settings/ManageLate"));
const AddSubjectTab = lazy(() => import("./tabs/AddSubjectTab"));
const AddDepartmentTab = lazy(() => import("./tabs/AddDepartmentTab"));

// Icon components (keep all existing icons)
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconInstructor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconStaff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconEvents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconSchedules = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconAdd = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSubject = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconDepartment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconSecurity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconDevice = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconManageLate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// Tab configuration with grouping for sidebar
interface TabItem {
  key: string;
  label: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  icon: React.ReactNode;
  group?: string;
}

const allTabs: TabItem[] = [
  { key: "dashboard", label: "Dashboard", component: DashboardTab, icon: <IconDashboard />, group: "main" },
  { key: "instructors", label: "Instructors", component: InstructorsTab, icon: <IconInstructor />, group: "management" },
  { key: "staff", label: "Staff", component: StaffTab, icon: <IconStaff />, group: "management" },
  { key: "events", label: "Events", component: EventsTab, icon: <IconEvents />, group: "management" },
  { key: "schedules", label: "Schedules", component: SchedulesTab, icon: <IconSchedules />, group: "management" },
  { key: "add-instructor", label: "Add Instructor", component: AddInstructorTab, icon: <IconAdd />, group: "add" },
  { key: "add-staff", label: "Add Staff", component: AddStaffTab, icon: <IconAdd />, group: "add" },
  { key: "add-subject", label: "Add Subject", component: AddSubjectTab, icon: <IconSubject />, group: "add" },
  { key: "add-department", label: "Add Department", component: AddDepartmentTab, icon: <IconDepartment />, group: "add" },
  { key: "security", label: "Security", component: SecurityTab, icon: <IconSecurity />, group: "settings" },
  { key: "device", label: "Device", component: DeviceTab, icon: <IconDevice />, group: "settings" },
  { key: "manage-late", label: "Manage Late", component: ManageLateTab, icon: <IconManageLate />, group: "settings" },
  { key: "settings", label: "Settings", component: SettingsTab, icon: <IconSettings />, group: "settings" },
];

// Group definitions for sidebar
const groupConfig = {
  main: { title: "Main", icon: <IconDashboard /> },
  management: { title: "Management", icon: <IconStaff /> },
  add: { title: "Add New", icon: <IconAdd /> },
  settings: { title: "Settings", icon: <IconSettings /> },
};

// Loading fallback for tab content
const TabLoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem" }}>
    <div style={{ width: "2rem", height: "2rem", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["main", "management"]));
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(
    new Set(allTabs.map((tab) => tab.key))
  );

  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Admin";

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setMountedTabs(prev => new Set([...prev, key]));
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.clear();
    navigate("/login");
  };

  // Fetch logo on mount
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setLogoUrl(url);
      })
      .catch((err) => {
        console.error("Failed to load logo:", err);
      });
  }, []);

  // Build group → tabs map
  const tabsByGroup = allTabs.reduce((acc, tab) => {
    const group = tab.group || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(tab);
    return acc;
  }, {} as Record<string, TabItem[]>);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#003366" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? "80px" : "280px",
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
          // Custom scrollbar styling
          scrollbarWidth: "thin", // For Firefox
          scrollbarColor: "#4a3a00 #eab308", // For Firefox (thumb color, track color)
        }}
      >
        {/* Custom scrollbar styles for WebKit browsers (Chrome, Edge, Safari) */}
        <style>
          {`
            /* Sidebar scrollbar styling */
            aside::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            aside::-webkit-scrollbar-track {
              background: #eab308;
              border-radius: 3px;
            }
            aside::-webkit-scrollbar-thumb {
              background: #7a5c00;
              border-radius: 3px;
              transition: background 0.2s ease;
            }
            aside::-webkit-scrollbar-thumb:hover {
              background: #4a3a00;
            }
            /* Optional: style the scrollbar corner */
            aside::-webkit-scrollbar-corner {
              background: #eab308;
            }
          `}
        </style>
        {/* Logo and brand area */}
        <div style={{
          padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem 1.5rem",
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
          {!sidebarCollapsed && (
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0, color: "#1a1a1a" }}>Admin Dashboard</p>
              <p style={{ color: "#4a3a00", fontSize: "0.65rem", margin: 0 }}>Trinidad Municipal College</p>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flex: 1, padding: "0 0.75rem" }}>
          {Object.entries(groupConfig).map(([groupKey, config]) => {
            const tabsInGroup = tabsByGroup[groupKey] || [];
            if (tabsInGroup.length === 0) return null;
            const isExpanded = expandedGroups.has(groupKey);

            return (
              <div key={groupKey} style={{ marginBottom: "1rem" }}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarCollapsed ? "center" : "space-between",
                    padding: "0.75rem 0.5rem",
                    background: "transparent",
                    border: "none",
                    color: "#4a3a00",
                    cursor: "pointer",
                    borderRadius: "0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {sidebarCollapsed ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{config.icon}</span>
                  ) : (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {config.icon}
                        <span>{config.title}</span>
                      </span>
                      <span style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex" }}>
                        <IconChevronDown />
                      </span>
                    </>
                  )}
                </button>

                {(isExpanded || sidebarCollapsed) && (
                  <div style={{ marginTop: "0.25rem" }}>
                    {tabsInGroup.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: sidebarCollapsed ? "center" : "flex-start",
                          gap: "0.75rem",
                          padding: sidebarCollapsed ? "0.75rem 0" : "0.75rem 1rem",
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
                          if (activeTab !== tab.key) e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== tab.key) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{tab.icon}</span>
                        {!sidebarCollapsed && <span>{tab.label}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: "1rem 0.75rem",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          marginTop: "auto",
        }}>
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

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            padding: "0.5rem 0.75rem",
          }}>
            {!sidebarCollapsed && (
              <span style={{ fontSize: "0.75rem", color: "#4a3a00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </span>
            )}
            <button
              onClick={() => setShowLogout(true)}
              style={{
                background: "rgba(0,0,0,0.08)",
                border: "none",
                borderRadius: "0.5rem",
                padding: sidebarCollapsed ? "0.5rem" : "0.5rem 0.75rem",
                cursor: "pointer",
                color: "#4a3a00",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
            >
              <IconLogout />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "80px" : "280px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          background: "#003366",
        }}
      >
        <div style={{ padding: "2rem" }}>
          <Suspense fallback={<TabLoadingFallback />}>
            {allTabs.map(tab => {
              const Component = tab.component;
              if (!mountedTabs.has(tab.key)) return null;
              return (
                <div
                  key={tab.key}
                  style={{ display: activeTab === tab.key ? "block" : "none" }}
                >
                  <Component setActiveTab={handleTabChange} />
                </div>
              );
            })}
          </Suspense>
        </div>
      </main>

      {/* Logout Modal */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "24rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Sign Out</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>Are you sure you want to logout?</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: "0.625rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", cursor: "pointer", outline: "none", color: "#374151" }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#dc2626", color: "#fff", cursor: "pointer", outline: "none" }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}