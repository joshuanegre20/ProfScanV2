// src/pages/Admin/tabs/SettingsTab.tsx
import React, { useState, useEffect } from "react";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: "1.5rem",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6",
  display: "flex", alignItems: "center", gap: "0.5rem",
};

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1f2937",
  outline: "none", background: "#fff", fontFamily: "inherit",
  cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center",
  paddingRight: "2.5rem",
};

interface Settings {
  theme: "light" | "dark";
  dateFormat: string;
  timeFormat: string;
  language: string;
  notifyLogin: boolean;
  notifyScan: boolean;
  notifyEvents: boolean;
}

const DEFAULTS: Settings = {
  theme: "light",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  language: "en",
  notifyLogin: true,
  notifyScan: true,
  notifyEvents: false,
};

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem("profscan_settings");
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved]       = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    localStorage.setItem("profscan_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    localStorage.setItem("profscan_settings", JSON.stringify(DEFAULTS));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Toggle component
  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "2.75rem", height: "1.5rem", borderRadius: "9999px",
        background: value ? "#4f46e5" : "#e5e7eb",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "0.125rem",
        left: value ? "1.375rem" : "0.125rem",
        width: "1.25rem", height: "1.25rem",
        background: "#fff", borderRadius: "50%",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", maxWidth: "48rem", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>System Preferences</h1>
          <p style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.25rem" }}>Customize your dashboard experience</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "50%", padding: "0.75rem", display: "flex" }}>
          <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9z" />
          </svg>
        </div>
      </div>

      {/* ── Theme ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Appearance</h2>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <label style={labelStyle}>Theme</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {(["light", "dark"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set("theme", t)}
                style={{
                  padding: "1rem", borderRadius: "0.75rem", cursor: "pointer",
                  border: `2px solid ${settings.theme === t ? "#4f46e5" : "#e5e7eb"}`,
                  background: settings.theme === t ? "#eef2ff" : "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                  transition: "all 0.15s",
                }}
              >
                {t === "light" ? (
                  <svg width="24" height="24" fill="none" stroke={settings.theme === t ? "#4f46e5" : "#9ca3af"} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" strokeWidth={2} />
                    <path strokeLinecap="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg width="24" height="24" fill="none" stroke={settings.theme === t ? "#4f46e5" : "#9ca3af"} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: settings.theme === t ? "#4f46e5" : "#6b7280", textTransform: "capitalize" }}>{t}</span>
                {settings.theme === t && (
                  <span style={{ fontSize: "0.65rem", color: "#6366f1", background: "#e0e7ff", borderRadius: "9999px", padding: "0.1rem 0.5rem", fontWeight: 600 }}>Active</span>
                )}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.625rem" }}>
            Note: Dark mode styling is saved but full theme application requires implementation in your app's CSS.
          </p>
        </div>
      </div>

      {/* ── Date & Time ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Date & Time</h2>
        </div>
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Date Format</label>
            <div style={{ position: "relative" }}>
              <select value={settings.dateFormat} onChange={e => set("dateFormat", e.target.value)} style={selectStyle}
                onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                onBlur={e => (e.currentTarget.style.boxShadow = "none")}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY</option>
              </select>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.375rem" }}>
              Preview: {new Date().toLocaleDateString("en-US", {
                month: settings.dateFormat.startsWith("MMM") ? "short" : "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <label style={labelStyle}>Time Format</label>
            <div style={{ position: "relative" }}>
              <select value={settings.timeFormat} onChange={e => set("timeFormat", e.target.value)} style={selectStyle}
                onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
                onBlur={e => (e.currentTarget.style.boxShadow = "none")}>
                <option value="12h">12-hour (2:30 PM)</option>
                <option value="24h">24-hour (14:30)</option>
              </select>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.375rem" }}>
              Preview: {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit",
                hour12: settings.timeFormat === "12h",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Language ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Language</h2>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <label style={labelStyle}>Display Language</label>
          <div style={{ position: "relative", maxWidth: "300px" }}>
            <select value={settings.language} onChange={e => set("language", e.target.value)} style={selectStyle}
              onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)")}
              onBlur={e => (e.currentTarget.style.boxShadow = "none")}>
              <option value="en">🇺🇸 English</option>
              <option value="fil">🇵🇭 Filipino</option>
              <option value="ceb">🇵🇭 Cebuano</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="zh">🇨🇳 Chinese</option>
              <option value="ja">🇯🇵 Japanese</option>
            </select>
          </div>
          <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.375rem" }}>
            Note: Full language switching requires i18n implementation.
          </p>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Notifications</h2>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { key: "notifyLogin" as const,  label: "Admin login alerts",       desc: "Get notified when someone logs into the admin dashboard" },
            { key: "notifyScan"  as const,  label: "QR scan activity",         desc: "Get notified when an instructor scans their QR code" },
            { key: "notifyEvents" as const, label: "Upcoming event reminders", desc: "Get notified before scheduled events" },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.875rem 1rem", background: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #f3f4f6" }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{label}</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.125rem" }}>{desc}</p>
              </div>
              <Toggle value={settings[key] as boolean} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Save / Reset */}
      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <svg width="15" height="15" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          <p style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 500 }}>Settings saved successfully!</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button" onClick={handleReset}
          style={{ padding: "0.625rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
          Reset to Defaults
        </button>
        <button
          type="button" onClick={handleSave}
          style={{ padding: "0.625rem 1.5rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f46e5")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Save Settings
        </button>
      </div>
    </div>
  );
}