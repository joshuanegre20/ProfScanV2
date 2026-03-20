// src/pages/Instructor/InstructorDashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";
import DashboardTab from "./tabs/DashboardTab";
import SchedulesTab from "./tabs/SchedulesTab";
import LogsTab from "./tabs/LogsTab";
import SettingsTab from "./tabs/SettingsTab";

const tabs = [
  {
    key: "dashboard", label: "Dashboard",
    icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
  },
  {
    key: "schedules", label: "My Schedules",
    icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  },
  {
    key: "logs", label: "Attendance Logs",
    icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>),
  },
];

const settingsDropdownItems = [
  {
    key: "settings", label: "Settings",
    icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>),
  },
];

const SETTINGS_KEYS = settingsDropdownItems.map(i => i.key);

export default function InstructorDashboard() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [logoUrl, setLogoUrl]           = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLogout, setShowLogout]     = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate    = useNavigate();
  const userName    = localStorage.getItem("name") ?? "Instructor";

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
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

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Logout Confirmation Modal ── */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "24rem", width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>Sign Out</h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowLogout(false)}
                style={{ flex: 1, padding: "0.625rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                Cancel
              </button>
              <button onClick={handleLogoutConfirm}
                style={{ flex: 1, padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#dc2626", fontSize: "0.875rem", fontWeight: 600, color: "#fff", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav style={{ background: "#3730a3", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>

          {/* Left: Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", objectFit: "cover" }} />}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, margin: 0 }}>ProfScan</p>
              <p style={{ color: "#a5b4fc", fontSize: "0.75rem", margin: 0 }}>Instructor Portal</p>
            </div>
          </div>

          {/* Right: Username · Settings · Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#c7d2fe" }}>{userName}</span>

            {/* ── Settings Dropdown ── */}
            <div ref={settingsRef} style={{ position: "relative" }}>
              <button onClick={() => setSettingsOpen(p => !p)} title="Settings"
                style={{ background: SETTINGS_KEYS.includes(activeTab) || settingsOpen ? "#4338ca" : "#312e81", border: "none", color: "#fff", width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
                onMouseLeave={e => { if (!SETTINGS_KEYS.includes(activeTab) && !settingsOpen) e.currentTarget.style.background = "#312e81"; }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9z"/>
                </svg>
              </button>
              {settingsOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.15)", minWidth: "160px", zIndex: 50, overflow: "hidden" }}>
                  {settingsDropdownItems.map((item, idx) => (
                    <button key={item.key} onClick={() => { setActiveTab(item.key); setSettingsOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.625rem 1rem", border: "none", borderBottom: idx < settingsDropdownItems.length - 1 ? "1px solid #f3f4f6" : "none", background: activeTab === item.key ? "#eef2ff" : "#fff", color: activeTab === item.key ? "#4f46e5" : "#374151", fontSize: "0.875rem", fontWeight: activeTab === item.key ? 600 : 400, cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#f9fafb"; }}
                      onMouseLeave={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#fff"; }}>
                      {item.icon}{item.label}
                      {activeTab === item.key && <span style={{ marginLeft: "auto" }}><svg width="14" height="14" fill="none" stroke="#4f46e5" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Logout ── */}
            <button onClick={() => setShowLogout(true)} title="Logout"
              style={{ background: "#312e81", border: "none", color: "#fff", width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={e => (e.currentTarget.style.background = "#312e81")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <style>{`
        .tab-btn { outline: none !important; box-shadow: none !important; background: none; border: none; cursor: pointer; }
        .tab-btn:hover { color: #4f46e5; }
        button { outline: none; }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="tab-btn"
                style={{ padding: "1rem 0.25rem", borderBottom: `2px solid ${activeTab === tab.key ? "#4f46e5" : "transparent"}`, color: activeTab === tab.key ? "#4f46e5" : "#6b7280", fontWeight: 500, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}><DashboardTab setActiveTab={setActiveTab} /></div>
        <div style={{ display: activeTab === "schedules" ? "block" : "none" }}><SchedulesTab /></div>
        <div style={{ display: activeTab === "logs"      ? "block" : "none" }}><LogsTab /></div>
        <div style={{ display: activeTab === "settings"  ? "block" : "none" }}><SettingsTab /></div>
      </div>
    </div>
  );
}