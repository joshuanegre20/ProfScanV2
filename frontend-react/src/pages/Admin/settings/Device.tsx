// src/pages/Admin/tabs/DeviceTab.tsx
import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Device {
  id: number;
  chip_id: string | null;
  mac_address: string | null;
  name: string;
  wifi_ssid: string | null;
  wifi_password: string | null;
  server_url: string | null;
  scan_cooldown: number;
  status: "online" | "offline";
  paired: boolean;
  last_seen: string | null;
  pairing_token: string;
}

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e2e8f0",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1e293b",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const focus = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,51,102,0.15)");
const blur = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.boxShadow = "none");

type ModalMode = "add" | "edit";

async function buildQRUrl(device: Device): Promise<string> {
  const payload = JSON.stringify({
    pairing_token: device.pairing_token,
    name: device.name,
    wifi_ssid: device.wifi_ssid,
    wifi_password: device.wifi_password,
    server_url: device.server_url,
    scan_cooldown: device.scan_cooldown,
    register_url: device.server_url
      ? device.server_url.replace(/\/api\/scan$/, '/api/devices/register')
      : `${window.location.origin.replace(":5173", ":8000")}/api/devices/register`,
  });

  return QRCode.toDataURL(payload, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: "L",
    color: { dark: "#003366", light: "#ffffff" },
  });
}

function UnpairedCard({ device, onConfigure }: { device: Device; onConfigure: () => void }) {
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    setQrError(false);
    buildQRUrl(device)
      .then(setQrUrl)
      .catch(() => setQrError(true));
  }, [device]);

  return (
    <div style={{ ...glassCardStyle, border: "2px dashed #e0e7ff", padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>{device.name}</p>
          <p style={{ fontSize: "0.7rem", color: "#a16207", marginTop: "0.1rem" }}>⏳ Waiting for ESP32</p>
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#fef9c3", color: "#a16207", textTransform: "uppercase" }}>
          Unpaired
        </span>
      </div>

      {qrError ? (
        <div style={{ width: "220px", height: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fef2f2", borderRadius: "0.75rem", border: "1px solid #fecaca", gap: "0.5rem" }}>
          <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p style={{ fontSize: "0.7rem", color: "#dc2626", textAlign: "center" }}>QR generation failed</p>
        </div>
      ) : qrUrl ? (
        <div style={{ padding: "0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.875rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <img src={qrUrl} alt="Pairing QR" style={{ width: "220px", height: "220px", display: "block", imageRendering: "pixelated" }} />
        </div>
      ) : (
        <div style={{ width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "1.5rem", height: "1.5rem", border: "3px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      )}

      <p style={{ fontSize: "0.7rem", color: "#64748b", textAlign: "center", lineHeight: 1.5, margin: "0 0.25rem" }}>
        Point your ESP32 scanner at this QR to pair the device
      </p>

      <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
        <button
          disabled={!qrUrl}
          onClick={() => {
            const a = document.createElement("a");
            a.href = qrUrl;
            a.download = `${device.name}-pairing-qr.png`;
            a.click();
          }}
          style={{ flex: 1, padding: "0.45rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: qrUrl ? "#f8fafc" : "#f1f5f9", color: qrUrl ? "#1e293b" : "#94a3b8", fontSize: "0.72rem", fontWeight: 600, cursor: qrUrl ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download
        </button>
        <button
          onClick={onConfigure}
          style={{ flex: 1, padding: "0.45rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", color: "#1e293b", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Configure
        </button>
      </div>
    </div>
  );
}

function PairedCard({ device, onConfigure, formatLastSeen }: {
  device: Device;
  onConfigure: () => void;
  formatLastSeen: (ts: string | null) => string;
}) {
  return (
    <div style={glassCardStyle}>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", background: device.status === "online" ? "#eef2ff" : "#f1f5f9", borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke={device.status === "online" ? "#003366" : "#94a3b8"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>
              Paired
            </span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: device.status === "online" ? "#dcfce7" : "#f1f5f9", color: device.status === "online" ? "#15803d" : "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: device.status === "online" ? "#22c55e" : "#94a3b8", display: "inline-block" }} />
              {device.status}
            </span>
          </div>
        </div>

        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "0.15rem" }}>{device.name}</p>
        {device.chip_id && (
          <p style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace", marginBottom: "0.75rem" }}>
            ID: {device.chip_id}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
          {device.mac_address && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="M8 12h8M12 8v8" />
              </svg>
              <span style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "monospace" }}>{device.mac_address}</span>
            </div>
          )}
          {device.wifi_ssid && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span style={{ fontSize: "0.75rem", color: "#475569" }}>{device.wifi_ssid}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <polyline points="12 6 12 12 16 14" strokeWidth={2} />
            </svg>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Last seen: {formatLastSeen(device.last_seen)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeWidth={2} d="M12 8v4l3 3" />
            </svg>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Cooldown: {device.scan_cooldown / 1000}s</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.875rem" }}>
          <button onClick={onConfigure}
            style={{ width: "100%", padding: "0.45rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", color: "#1e293b", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeviceTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selected, setSelected] = useState<Device | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showWifiPw, setShowWifiPw] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "", wifi_ssid: "", wifi_password: "", server_url: "", scan_cooldown: 3000,
  });
  const [editForm, setEditForm] = useState({
    name: "", wifi_ssid: "", wifi_password: "", server_url: "", scan_cooldown: 3000,
  });

  useSocket({
    room: "admin",
    onScan: (data) => {
      if (data.device_id) {
        setDevices(prev => prev.map(d =>
          d.id === data.device_id
            ? { ...d, status: "online", last_seen: new Date().toISOString() }
            : d
        ));
      }
      fetchDevices();
    },
  });

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const formatLastSeen = (ts: string | null) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post("/devices", addForm);
      setDevices(prev => [res.data, ...prev]);
      closeModal();
      setAddForm({ name: "", wifi_ssid: "", wifi_password: "", server_url: "", scan_cooldown: 3000 });
    } catch { }
    finally { setProcessing(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setProcessing(true);
    setSuccess("");
    try {
      await api.put(`/devices/${selected.id}`, editForm);
      setDevices(prev => prev.map(d => d.id === selected.id ? { ...d, ...editForm } : d));
      setSuccess("Device updated! ESP32 will use new config on next boot.");
    } catch { }
    finally { setProcessing(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Remove "${selected.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/devices/${selected.id}`);
      setDevices(prev => prev.filter(d => d.id !== selected.id));
      closeModal();
    } catch { }
    finally { setDeleting(false); }
  };

  const openEdit = (device: Device) => {
    setSelected(device);
    setEditForm({
      name: device.name,
      wifi_ssid: device.wifi_ssid ?? "",
      wifi_password: device.wifi_password ?? "",
      server_url: device.server_url ?? "",
      scan_cooldown: device.scan_cooldown,
    });
    setSuccess("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setSuccess("");
    setShowWifiPw(false);
  };

  const setAdd = (k: string, v: string | number) => setAddForm(p => ({ ...p, [k]: v }));
  const setEdit = (k: string, v: string | number) => setEditForm(p => ({ ...p, [k]: v }));

  const onlineCount = devices.filter(d => d.status === "online").length;
  const pairedCount = devices.filter(d => d.paired).length;

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", maxWidth: "56rem", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Devices</h1>
          <p style={{ color: "#bfdbfe", fontSize: "0.8rem", marginTop: "0.25rem" }}>Manage your ESP32 QR scanners</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
            {onlineCount} online
          </span>
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
            {pairedCount}/{devices.length} paired
          </span>
          <button onClick={() => { setModalMode("add"); setSuccess(""); }}
            style={{ background: "#ffd700", border: "none", color: "#003366", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fbbf24")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ffd700")}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth={2.5} strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            Add Device
          </button>
          <button onClick={fetchDevices} title="Refresh"
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "2rem", height: "2rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "2rem", height: "2rem", border: "3px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: "1rem", border: "1px dashed #e2e8f0" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "#eef2ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="28" height="28" fill="none" stroke="#003366" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: "#1e293b" }}>No devices yet</p>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.375rem" }}>
            Click <strong>Add Device</strong> to generate a pairing QR code for your ESP32.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {devices.map(device =>
            device.paired
              ? <PairedCard key={device.id} device={device} onConfigure={() => openEdit(device)} formatLastSeen={formatLastSeen} />
              : <UnpairedCard key={device.id} device={device} onConfigure={() => openEdit(device)} />
          )}
        </div>
      )}

      {/* MODAL */}
      {modalMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: "28rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>

            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                {modalMode === "add" ? "Add New Device" : `Configure "${selected?.name}"`}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ADD FORM */}
            {modalMode === "add" && (
              <form onSubmit={handleAdd} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div>
                  <label style={labelStyle}>Device Name *</label>
                  <input type="text" value={addForm.name} onChange={e => setAdd("name", e.target.value)} required placeholder="e.g. Scanner Room 1" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>WiFi SSID *</label>
                  <input type="text" value={addForm.wifi_ssid} onChange={e => setAdd("wifi_ssid", e.target.value)} required placeholder="Your WiFi name" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>WiFi Password *</label>
                  <div style={{ position: "relative" }}>
                    <input type={showWifiPw ? "text" : "password"} value={addForm.wifi_password} onChange={e => setAdd("wifi_password", e.target.value)} required style={{ ...inputStyle, paddingRight: "2.5rem" }} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowWifiPw(p => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showWifiPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Server URL *</label>
                  <input type="text" value={addForm.server_url} onChange={e => setAdd("server_url", e.target.value)} required placeholder="http://192.168.x.x:8000/api/scan" style={inputStyle} onFocus={focus} onBlur={blur} />
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem" }}>Run <code style={{ background: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>ipconfig</code> to find your local IP</p>
                </div>
                <div>
                  <label style={labelStyle}>Scan Cooldown (ms)</label>
                  <input type="number" value={addForm.scan_cooldown} onChange={e => setAdd("scan_cooldown", parseInt(e.target.value))} min={1000} max={10000} step={500} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem" }}>{addForm.scan_cooldown / 1000}s between scans</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.625rem", paddingTop: "0.5rem" }}>
                  <button type="button" onClick={closeModal} style={{ padding: "0.625rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>Cancel</button>
                  <button type="submit" disabled={processing}
                    style={{ padding: "0.625rem 1.25rem", background: processing ? "#cbd5e1" : "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
                    onMouseEnter={e => !processing && (e.currentTarget.style.background = "#004c99")}
                    onMouseLeave={e => !processing && (e.currentTarget.style.background = "#003366")}>
                    {processing
                      ? <><div style={{ width: "0.875rem", height: "0.875rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creating...</>
                      : <>Create & Show QR</>}
                  </button>
                </div>
              </form>
            )}

            {/* EDIT FORM */}
            {modalMode === "edit" && selected && (
              <form onSubmit={handleEdit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div style={{ background: "#f8fafc", borderRadius: "0.75rem", padding: "0.875rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Chip ID</p>
                    <p style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#1e293b" }}>{selected.chip_id ?? "Not paired yet"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Last Seen</p>
                    <p style={{ fontSize: "0.7rem", color: "#1e293b" }}>{formatLastSeen(selected.last_seen)}</p>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Device Name *</label>
                  <input type="text" value={editForm.name} onChange={e => setEdit("name", e.target.value)} required style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>WiFi SSID</label>
                  <input type="text" value={editForm.wifi_ssid} onChange={e => setEdit("wifi_ssid", e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>WiFi Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showWifiPw ? "text" : "password"} value={editForm.wifi_password} onChange={e => setEdit("wifi_password", e.target.value)} style={{ ...inputStyle, paddingRight: "2.5rem" }} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowWifiPw(p => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showWifiPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Server URL</label>
                  <input type="text" value={editForm.server_url} onChange={e => setEdit("server_url", e.target.value)} placeholder="http://192.168.x.x:8000/api/scan" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Scan Cooldown (ms)</label>
                  <input type="number" value={editForm.scan_cooldown} onChange={e => setEdit("scan_cooldown", parseInt(e.target.value))} min={1000} max={10000} step={500} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem" }}>{editForm.scan_cooldown / 1000}s between scans</p>
                </div>

                {success && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.625rem 0.875rem" }}>
                    <svg width="14" height="14" fill="none" stroke="#15803d" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    <p style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 500 }}>{success}</p>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", background: "none", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {deleting ? "Removing..." : "Remove"}
                  </button>
                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <button type="button" onClick={closeModal} style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>Cancel</button>
                    <button type="submit" disabled={processing}
                      style={{ padding: "0.5rem 1.25rem", background: processing ? "#cbd5e1" : "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
                      onMouseEnter={e => !processing && (e.currentTarget.style.background = "#004c99")}
                      onMouseLeave={e => !processing && (e.currentTarget.style.background = "#003366")}>
                      {processing
                        ? <><div style={{ width: "0.875rem", height: "0.875rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Saving...</>
                        : <>Save Config</>}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}