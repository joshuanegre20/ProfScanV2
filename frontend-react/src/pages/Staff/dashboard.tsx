// src/pages/Staff/Dashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MyDashboardTab from "./tabs/Dashboard";
import MyScheduleTab from "./tabs/Schedule";
import MyAttendanceTab from "./tabs/Attendance";
import ProfileTab from "./tabs/Profile";
import api from "../../api/axios";

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    key: "profile",
    label: "My Profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") ?? "Staff";
  const staffId = localStorage.getItem("staff_id") ?? "";
  const department = localStorage.getItem("department") ?? "";

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (_) {}
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("staff_id");
    localStorage.removeItem("department");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>

          {/* Left: Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <img src="/images/tmclogo2.png" alt="TMC" style={{ width: "2.25rem", height: "2.25rem", objectFit: "contain" }} />
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>Staff Portal</p>
              <p style={{ color: "#a5b4fc", fontSize: "0.75rem" }}>Trinidad Municipal College</p>
            </div>
          </div>

          {/* Right: Staff Info + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{userName}</p>
              <p style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>{staffId} • {department}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.borderColor = "#dc2626";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
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
        }
        .tab-btn:hover {
          color: #4f46e5;
        }
        button {
          outline: none;
        }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="tab-btn"
                style={{
                  padding: "1rem 0.25rem",
                  borderBottom: `2px solid ${activeTab === tab.key ? "#4f46e5" : "transparent"}`,
                  color: activeTab === tab.key ? "#4f46e5" : "#6b7280",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <MyDashboardTab />
        </div>
        
        <div style={{ display: activeTab === "attendance" ? "block" : "none" }}>
          <MyAttendanceTab />
        </div>
        <div style={{ display: activeTab === "schedule" ? "block" : "none" }}>
          <MyScheduleTab />
        </div>
        <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <ProfileTab />
        </div>
      </div>
    </div>
  );
}