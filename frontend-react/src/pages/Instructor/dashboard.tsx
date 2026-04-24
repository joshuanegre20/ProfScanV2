// src/pages/Instructor/InstructorDashboard.tsx
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";

// Lazy load tabs — only fetched on first visit
const DashboardTab = lazy(() => import("./tabs/DashboardTab"));
const SchedulesTab = lazy(() => import("./tabs/SchedulesTab"));
const LogsTab = lazy(() => import("./tabs/LogsTab"));
const SettingsTab = lazy(() => import("./tabs/SettingsTab"));

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    component: DashboardTab,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    key: "schedules",
    label: "My Schedules",
    component: SchedulesTab,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: "logs",
    label: "Attendance Logs",
    component: LogsTab,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    component: SettingsTab,
    icon: null, // settings tab is hidden from tab bar, accessed via dropdown
  },
];

const navTabs = tabs.filter(t => t.key !== "settings");

const settingsDropdownItems = [
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9z" />
      </svg>
    ),
  },
];

const SETTINGS_KEYS = settingsDropdownItems.map(i => i.key);

// Loading fallback — only shown on first visit to a tab
const TabLoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem" }}>
    <div style={{ width: "2rem", height: "2rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Track which tabs have ever been visited — only mount once, keep alive after
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["dashboard"]));

  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Instructor";

  // Use this instead of setActiveTab directly to track mounted tabs
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setMountedTabs(prev => new Set([...prev, key]));
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutConfirm = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const navBtnStyle: React.CSSProperties = {
    background: "#002a52",
    border: "none",
    color: "#fff",
    width: "2.25rem",
    height: "2.25rem",
    minWidth: "2.25rem",
    minHeight: "2.25rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    flexShrink: 0,
    transition: "background 0.2s",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 50%, #ffffff 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(0, 51, 102, 0.04) 0%, transparent 60%),
            repeating-linear-gradient(45deg, rgba(59, 130, 246, 0.02) 0px, rgba(59, 130, 246, 0.02) 2px, transparent 2px, transparent 8px)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "24rem", width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>Sign Out</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>Are you sure you want to logout?</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{ flex: 1, padding: "0.625rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "all 0.2s", outline: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{ flex: 1, padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#dc2626", fontSize: "0.875rem", fontWeight: 600, color: "#fff", cursor: "pointer", transition: "background 0.2s", outline: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background: "#003366", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>

          {/* Left: Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl && (
              <img src={logoUrl} alt="Logo" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", objectFit: "cover" }} />
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, margin: 0 }}>ProfScan</p>
              <p style={{ color: "#bfdbfe", fontSize: "0.7rem", margin: 0 }}>Instructor Portal</p>
            </div>
          </div>

          {/* Right: Username + Settings + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#bfdbfe" }}>{userName}</span>

            {/* Settings Dropdown */}
            <div ref={settingsRef} style={{ position: "relative" }}>
              <button
                onClick={() => setSettingsOpen(p => !p)}
                title="Settings"
                style={{
                  ...navBtnStyle,
                  background: SETTINGS_KEYS.includes(activeTab) || settingsOpen ? "#004c99" : "#002a52",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#004c99")}
                onMouseLeave={(e) => {
                  if (!SETTINGS_KEYS.includes(activeTab) && !settingsOpen)
                    e.currentTarget.style.background = "#002a52";
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

              {settingsOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", minWidth: "160px", zIndex: 50, overflow: "hidden" }}>
                  {settingsDropdownItems.map((item, idx) => (
                    <button
                      key={item.key}
                      onClick={() => { handleTabChange(item.key); setSettingsOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.625rem 1rem",
                        border: "none",
                        borderBottom: idx < settingsDropdownItems.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: activeTab === item.key ? "#eef2ff" : "#fff",
                        color: activeTab === item.key ? "#003366" : "#374151",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === item.key ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.2s",
                        outline: "none",
                      }}
                      onMouseEnter={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = "#fff"; }}
                    >
                      {item.icon}
                      {item.label}
                      {activeTab === item.key && (
                        <span style={{ marginLeft: "auto", color: "#003366" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogout(true)}
              title="Logout"
              style={navBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#002a52")}
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

      <style>{`
        .tab-btn { outline: none !important; box-shadow: none !important; background: none; border: none; cursor: pointer; transition: color 0.2s, border-color 0.2s; }
        .tab-btn:hover { color: #003366; }
        button { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem", position: "relative", zIndex: 1 }}>
        {/* Tab Bar */}
        <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem", background: "rgba(255,255,255,0.6)", borderRadius: "0.5rem", padding: "0 0.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            {navTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className="tab-btn"
                style={{
                  padding: "1rem 0.25rem",
                  borderBottom: `2px solid ${activeTab === tab.key ? "#003366" : "transparent"}`,
                  color: activeTab === tab.key ? "#003366" : "#64748b",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/*
          KEY FIX: All visited tabs stay mounted in the DOM.
          Show/hide with CSS display instead of unmounting —
          no Suspense fallback on every tab switch,
          no API re-fetching inside child components.
          A tab is only mounted on its FIRST visit (mountedTabs tracks this).
        */}
        <Suspense fallback={<TabLoadingFallback />}>
          {tabs.map(tab => {
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
    </div>
  );
}