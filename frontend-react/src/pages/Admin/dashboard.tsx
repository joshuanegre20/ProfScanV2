// src/pages/Admin/Dashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardTab from "./tabs/DashboardTab";
import InstructorsTab from "./tabs/InstructorsTab";
import EventsTab from "./tabs/EventsTab";
import SchedulesTab from "./tabs/SchedulesTab";
import AddInstructorTab from "./tabs/AddInstructorTab";
import StaffTab from "./tabs/StaffTab";
import AddStaffTab from "./tabs/AddStaffTab";
import SecurityTab from './settings/Security';
import DeviceTab from "./settings/Device";
import SettingsTab from "./settings/Settings";
import api from "../../api/axios";
import AddSubjectTab from "./tabs/AddSubjectTab";
import AddDepartmentTab from "./tabs/AddDepartmentTab";

const tabs = [
  {
    key: "dashboard", label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    key: "instructors", label: "Instructors",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "staff", label: "Staff",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "events", label: "Events",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: "schedules", label: "Schedules",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const addDropdownItems = [
  {
    key: "add-instructor", label: "Add Instructor",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    key: "add-staff", label: "Add Staff",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    key: "add-subject", label: "Add Subject",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="12" y1="7" x2="12" y2="13" />
        <line x1="9" y1="10" x2="15" y2="10" />
      </svg>
    ),
  },
  {
    key: "add-department", label: "Add Department",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

const settingsDropdownItems = [
  {
    key: "security", label: "Security",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: "device", label: "Device",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
      </svg>
    ),
  },
 
];

const SETTINGS_KEYS = settingsDropdownItems.map(i => i.key);
const ADD_KEYS = addDropdownItems.map(i => i.key);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Admin";

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutConfirm = async () => {
    try { await api.post("/logout"); } catch (_) { }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const navBtn: React.CSSProperties = {
    background: "#002a52",
    border: "none",
    color: "#fff",
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    transition: "all 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Logout Confirmation Modal ── */}
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

      {/* ── Navbar ── */}
      <nav
        style={{
          background: "#003366",
          color: "#fff",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "4rem",
          }}
        >
          {/* Left: Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "50%",
                  objectFit: "cover",
                  
                }}
              />
            ) : (
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🏛️
              </div>
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, margin: 0 }}>Admin Dashboard</p>
              <p style={{ color: "#bfdbfe", fontSize: "0.7rem", margin: 0 }}>Trinidad Municipal College</p>
            </div>
          </div>

          {/* Right: Username · [+] · [⚙] · [logout] */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#bfdbfe" }}>{userName}</span>

            {/* ── + Add Dropdown ── */}
            <div ref={addRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setAddOpen(p => !p); setSettingsOpen(false); }}
                title="Add"
                style={{
                  ...navBtn,
                  background: ADD_KEYS.includes(activeTab) || addOpen ? "#004c99" : "#002a52",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
                onMouseLeave={e => {
                  if (!ADD_KEYS.includes(activeTab) && !addOpen)
                    e.currentTarget.style.background = "#002a52";
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} strokeLinecap="round" />
                </svg>
              </button>
              {addOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    minWidth: "180px",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {addDropdownItems.map((item, idx) => (
                    <button
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setAddOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.625rem 1rem",
                        border: "none",
                        borderBottom: idx < addDropdownItems.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: activeTab === item.key ? "#eef2ff" : "#fff",
                        color: activeTab === item.key ? "#003366" : "#374151",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === item.key ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#fff"; }}
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

            {/* ── Settings Dropdown ── */}
            <div ref={settingsRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setSettingsOpen(p => !p); setAddOpen(false); }}
                title="Settings"
                style={{
                  ...navBtn,
                  background: SETTINGS_KEYS.includes(activeTab) || settingsOpen ? "#004c99" : "#002a52",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
                onMouseLeave={e => {
                  if (!SETTINGS_KEYS.includes(activeTab) && !settingsOpen)
                    e.currentTarget.style.background = "#002a52";
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {settingsOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    minWidth: "160px",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {settingsDropdownItems.map((item, idx) => (
                    <button
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setSettingsOpen(false); }}
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
                      }}
                      onMouseEnter={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#fff"; }}
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

            {/* ── Logout ── */}
            <button
              onClick={() => setShowLogout(true)}
              title="Logout"
              style={{
                ...navBtn,
                background: "#002a52",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={e => (e.currentTarget.style.background = "#002a52")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <style>{`
        .tab-btn {
          outline: none !important;
          box-shadow: none !important;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .tab-btn:hover {
          color: #003366;
        }
        button {
          outline: none;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
        {/* ── Tab Bar ── */}
        <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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

        {/* ── Tab Content ── */}
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <DashboardTab setActiveTab={setActiveTab} />
        </div>
        <div style={{ display: activeTab === "instructors" ? "block" : "none" }}>
          <InstructorsTab setActiveTab={setActiveTab} />
        </div>
        <div style={{ display: activeTab === "staff" ? "block" : "none" }}>
          <StaffTab setActiveTab={setActiveTab} />
        </div>
        <div style={{ display: activeTab === "events" ? "block" : "none" }}>
          <EventsTab />
        </div>
        <div style={{ display: activeTab === "schedules" ? "block" : "none" }}>
          <SchedulesTab />
        </div>
        <div style={{ display: activeTab === "add-instructor" ? "block" : "none" }}>
          <AddInstructorTab />
        </div>
        <div style={{ display: activeTab === "add-staff" ? "block" : "none" }}>
          <AddStaffTab />
        </div>
        <div style={{ display: activeTab === "add-subject" ? "block" : "none" }}>
          <AddSubjectTab />
        </div>
        <div style={{ display: activeTab === "add-department" ? "block" : "none" }}>
          <AddDepartmentTab />
        </div>
        <div style={{ display: activeTab === "security" ? "block" : "none" }}>
          <SecurityTab />
        </div>
        <div style={{ display: activeTab === "device" ? "block" : "none" }}>
          <DeviceTab />
        </div>
        <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
          <SettingsTab />
        </div>
      </div>
    </div>
  );
}