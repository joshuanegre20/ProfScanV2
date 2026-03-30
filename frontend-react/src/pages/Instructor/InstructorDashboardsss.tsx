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
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "schedules", label: "My Schedules", icon: "📅" },
  { key: "logs", label: "Attendance Logs", icon: "📋" },
];

const settingsDropdownItems = [
  { key: "settings", label: "Settings", icon: "⚙️" },
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
    axios.get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
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
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Logout Confirmation Modal */}
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
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>Sign Out</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: "0.625rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleLogoutConfirm} style={{ flex: 1, padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#dc2626", fontSize: "0.875rem", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
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
            {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover",  }} />}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, margin: 0 }}>ProfScan</p>
              <p style={{ color: "#bfdbfe", fontSize: "0.7rem", margin: 0 }}>Instructor Portal</p>
            </div>
          </div>

          {/* Right: Username · Settings · Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#bfdbfe" }}>{userName}</span>

            {/* Settings Dropdown */}
            <div ref={settingsRef} style={{ position: "relative" }}>
              <button 
                onClick={() => setSettingsOpen(p => !p)} 
                title="Settings"
                style={{ background: SETTINGS_KEYS.includes(activeTab) || settingsOpen ? "#004c99" : "#002a52", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              >
                ⚙️
              </button>
              {settingsOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", minWidth: "160px", zIndex: 50, overflow: "hidden" }}>
                  {settingsDropdownItems.map((item, idx) => (
                    <button 
                      key={item.key} 
                      onClick={() => { setActiveTab(item.key); setSettingsOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.625rem 1rem", border: "none", borderBottom: idx < settingsDropdownItems.length - 1 ? "1px solid #f1f5f9" : "none", background: activeTab === item.key ? "#eef2ff" : "#fff", color: activeTab === item.key ? "#003366" : "#374151", fontSize: "0.875rem", fontWeight: activeTab === item.key ? 600 : 400, cursor: "pointer", textAlign: "left" }}
                    >
                      {item.icon} {item.label}
                      {activeTab === item.key && <span style={{ marginLeft: "auto" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <button 
              onClick={() => setShowLogout(true)} 
              title="Logout"
              style={{ background: "#002a52", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={e => (e.currentTarget.style.background = "#002a52")}
            >
              🚪
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            {tabs.map(tab => (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key)}
                style={{ 
                  padding: "0.75rem 0.25rem", 
                  borderBottom: `2px solid ${activeTab === tab.key ? "#003366" : "transparent"}`, 
                  color: activeTab === tab.key ? "#003366" : "#64748b", 
                  fontWeight: 500, 
                  fontSize: "0.875rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem", 
                  whiteSpace: "nowrap",
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}><DashboardTab setActiveTab={setActiveTab} /></div>
        <div style={{ display: activeTab === "schedules" ? "block" : "none" }}><SchedulesTab /></div>
        <div style={{ display: activeTab === "logs" ? "block" : "none" }}><LogsTab /></div>
        <div style={{ display: activeTab === "settings" ? "block" : "none" }}><SettingsTab /></div>
      </div>
    </div>
  );
}