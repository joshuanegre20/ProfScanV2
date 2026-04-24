// src/pages/Admin/Dashboard.tsx
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
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

const tabs = [
  { key: "dashboard", label: "Dashboard", component: DashboardTab },
  { key: "instructors", label: "Instructors", component: InstructorsTab },
  { key: "staff", label: "Staff", component: StaffTab },
  { key: "events", label: "Events", component: EventsTab },
  { key: "schedules", label: "Schedules", component: SchedulesTab },
  { key: "add-instructor", label: "Add Instructor", component: AddInstructorTab },
  { key: "add-staff", label: "Add Staff", component: AddStaffTab },
  { key: "add-subject", label: "Add Subject", component: AddSubjectTab },
  { key: "add-department", label: "Add Department", component: AddDepartmentTab },
  { key: "security", label: "Security", component: SecurityTab },
  { key: "device", label: "Device", component: DeviceTab },
  { key: "manage-late", label: "Manage Late", component: ManageLateTab },
  { key: "settings", label: "Settings", component: SettingsTab },
];

const navTabs = tabs.slice(0, 5);

const addDropdownItems = [
  { key: "add-instructor", label: "Add Instructor", icon: "👨‍🏫" },
  { key: "add-staff", label: "Add Staff", icon: "👥" },
  { key: "add-subject", label: "Add Subject", icon: "📚" },
  { key: "add-department", label: "Add Department", icon: "🏛️" },
];

const settingsDropdownItems = [
  { key: "security", label: "Security", icon: "🔒" },
  { key: "device", label: "Device", icon: "📱" },
  { key: "manage-late", label: "Manage Late", icon: "⏰" },
];

// Loading Overlay Component
const LoadingOverlay = ({ logoUrl, progress }: { logoUrl: string | null; progress: number }) => (
  <div style={{
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "#003366",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: "120px", height: "120px",
        margin: "0 auto 1.5rem",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "60px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "50px", height: "50px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        )}
      </div>
      <h2 style={{ color: "white", fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 600 }}>Trinidad Municipal College</h2>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Loading dashboard...</p>
      <div style={{ width: "250px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "#60a5fa", transition: "width 0.3s ease" }} />
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", marginTop: "0.5rem" }}>{Math.floor(progress)}%</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Loading fallback — only shown on FIRST visit to a tab
const TabLoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem" }}>
    <div style={{ width: "2rem", height: "2rem", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Track which tabs have ever been visited so we only mount them once
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["dashboard"]));

  const settingsRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Admin";

  // Use this instead of setActiveTab directly so we track mounted tabs
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setMountedTabs(prev => new Set([...prev, key]));
  };

  useEffect(() => {
    const loadData = async () => {
      setProgress(10);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" });
        setLogoUrl(URL.createObjectURL(res.data));
      } catch (error) {}
      setProgress(30);
      await Promise.all([
        api.get("/admin/stats").catch(() => {}),
        api.get("/admin/recent-scans").catch(() => {}),
        api.get("/admin/activities", { params: { limit: 10 } }).catch(() => {}),
        api.get("/devices").catch(() => {})
      ]);
      setProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    };
    loadData();
    return () => { if (logoUrl) URL.revokeObjectURL(logoUrl); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.clear();
    navigate("/login");
  };

  const navBtnStyle: React.CSSProperties = {
    background: "#3b82f6",
    border: "none",
    width: "2.25rem",
    height: "2.25rem",
    minWidth: "2.25rem",
    minHeight: "2.25rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    outline: "none",
    color: "#ffffff",
    padding: "0",
    flexShrink: 0,
  };

  if (isLoading) {
    return <LoadingOverlay logoUrl={logoUrl} progress={progress} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#003366" }}>
      {/* Navbar */}
      <nav style={{ background: "#002a52", color: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.25rem" }}>🏛️</div>
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0, color: "#fff" }}>Admin Dashboard</p>
              <p style={{ color: "#bfdbfe", fontSize: "0.7rem", margin: 0 }}>Trinidad Municipal College</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#fff" }}>{userName}</span>

            {/* Add Dropdown */}
            <div ref={addRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setAddOpen(!addOpen); setSettingsOpen(false); }}
                style={navBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {addOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", minWidth: "180px", zIndex: 50, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  {addDropdownItems.map(item => (
                    <button
                      key={item.key}
                      onClick={() => { handleTabChange(item.key); setAddOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.625rem 1rem", border: "none", background: activeTab === item.key ? "#eef2ff" : "#fff", cursor: "pointer", textAlign: "left", outline: "none", color: "#374151" }}
                    >
                      <span style={{ fontSize: "1rem" }}>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Dropdown */}
            <div ref={settingsRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setSettingsOpen(!settingsOpen); setAddOpen(false); }}
                style={navBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {settingsOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", minWidth: "160px", zIndex: 50, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  {settingsDropdownItems.map(item => (
                    <button
                      key={item.key}
                      onClick={() => { handleTabChange(item.key); setSettingsOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.625rem 1rem", border: "none", background: activeTab === item.key ? "#eef2ff" : "#fff", cursor: "pointer", textAlign: "left", outline: "none", color: "#374151" }}
                    >
                      <span style={{ fontSize: "1rem" }}>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogout(true)}
              style={navBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

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

      {/* Tab Bar */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {navTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: "0.75rem 0.25rem",
                borderBottom: `2px solid ${activeTab === tab.key ? "#60a5fa" : "transparent"}`,
                color: activeTab === tab.key ? "#60a5fa" : "rgba(255,255,255,0.8)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/*
          KEY FIX: All visited tabs stay mounted in the DOM.
          We show/hide with CSS display:none instead of unmounting —
          this means no Suspense fallback on every tab switch,
          and no API re-fetching inside child components.
          A tab is only mounted on its FIRST visit (mountedTabs tracks this).
        */}
        <Suspense fallback={<TabLoadingFallback />}>
          {tabs.map(tab => {
            const Component = tab.component;
            // Don't render at all until the tab has been visited
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
    </div>
  );
}