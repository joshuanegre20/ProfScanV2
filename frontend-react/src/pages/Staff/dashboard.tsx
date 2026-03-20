// src/pages/Staff/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";

import MyDashboardTab       from "./tabs/Dashboard";
import MyAttendanceTab      from "./tabs/Attendance";
import MyScheduleTab        from "./tabs/Schedule";
import ProfileTab           from "./tabs/Profile";
import InstructorManagerTab from "./tabs/InstructorManage";

const tabs = [
  {
    key: "dashboard", label: "Dashboard",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  },
  {
    key: "instructors", label: "Instructors",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "schedule", label: "Schedule",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    key: "attendance", label: "Attendance",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    key: "profile", label: "My Profile",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logoUrl, setLogoUrl]     = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  const navigate   = useNavigate();
  const userName   = localStorage.getItem("name")       ?? "Checker";
  const staffId    = localStorage.getItem("staff_id")   ?? "";
  const department = localStorage.getItem("department") ?? "";

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then(res => setLogoUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
  }, []);

  const handleLogoutConfirm = async () => {
    try { await api.post("/logout"); } catch (_) {}
    ["token", "role", "name", "staff_id", "department"].forEach(k => localStorage.removeItem(k));
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
      <nav style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", objectFit: "cover" }} />
              : <img src="/images/tmclogo2.png" alt="TMC" style={{ width: "2.25rem", height: "2.25rem", objectFit: "contain" }} onError={e => (e.currentTarget.style.display = "none")} />
            }
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>Staff Portal</p>
              <p style={{ color: "#a5b4fc", fontSize: "0.75rem" }}>Trinidad Municipal College</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{userName}</p>
              <p style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>{staffId}{department ? ` · ${department}` : ""}</p>
            </div>
            <button onClick={() => setShowLogout(true)} title="Logout"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.borderColor = "#dc2626"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <style>{`.tab-btn{outline:none!important;box-shadow:none!important;background:none;border:none;cursor:pointer}.tab-btn:hover{color:#4f46e5}button{outline:none}`}</style>

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

        {activeTab === "dashboard"   && <MyDashboardTab  setActiveTab={setActiveTab} />}
        {activeTab === "instructors" && <InstructorManagerTab />}
        {activeTab === "schedule"    && <MyScheduleTab />}
        {activeTab === "attendance"  && <MyAttendanceTab />}
        {activeTab === "profile"     && <ProfileTab />}
      </div>
    </div>
  );
}