// src/pages/Admin/tabs/DeviceTab.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import api from "../../../api/axios";

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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
  borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1f2937",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const focus = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)");
const blur = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.boxShadow = "none");

type ModalMode = "add" | "qr" | "edit";

export default function DeviceTab() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 1,
      chip_id: "ESP32-A4B2C1",
      mac_address: "A4:B2:C1:D3:E4:F5",
      name: "Scanner Room 1",
      wifi_ssid: "OfficeNet_5G",
      wifi_password: "secret123",
      server_url: "http://192.168.1.100:8000/api/scan",
      scan_cooldown: 3000,
      status: "online",
      paired: true,
      last_seen: new Date(Date.now() - 45000).toISOString(),
      pairing_token: "tok_sample_abc123",
    },
  ]);
  const [loading, setLoading]       = useState(false);
  const [modalMode, setModalMode]   = useState<ModalMode | null>(null);
  const [selected, setSelected]     = useState<Device | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState("");
  const [deleting, setDeleting]     = useState(false);
  const [showWifiPw, setShowWifiPw] = useState(false);
  const [qrDataUrl, setQrDataUrl]   = useState<string>("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  const [addForm, setAddForm] = useState({
    name: "", wifi_ssid: "", wifi_password: "",
    server_url: "", scan_cooldown: 3000,
  });

  const [editForm, setEditForm] = useState({
    name: "", wifi_ssid: "", wifi_password: "",
    server_url: "", scan_cooldown: 3000,
  });

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // fetchDevices(); // uncomment to load from API
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Generate QR from device config
  const generateQR = async (device: Device) => {
    const payload = JSON.stringify({
      pairing_token: device.pairing_token,
      name:          device.name,
      wifi_ssid:     device.wifi_ssid,
      wifi_password: device.wifi_password,
      server_url:    device.server_url,
      scan_cooldown: device.scan_cooldown,
      register_url:  `${window.location.origin.replace(':5173', ':8000')}/api/devices/register`,
    });

    const url = await QRCode.toDataURL(payload, {
      width: 260, margin: 2,
      color: { dark: "#1f2937", light: "#ffffff" },
    });
    setQrDataUrl(url);
  };

  // Add device
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post("/devices", addForm);
      const newDevice: Device = res.data;
      setDevices(prev => [newDevice, ...prev]);
      await generateQR(newDevice);
      setSelected(newDevice);
      setModalMode("qr");
      setAddForm({ name: "", wifi_ssid: "", wifi_password: "", server_url: "", scan_cooldown: 3000 });
    } catch {}
    finally { setProcessing(false); }
  };

  // Edit device
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setProcessing(true);
    setSuccess("");
    try {
      await api.put(`/devices/${selected.id}`, editForm);
      setDevices(prev => prev.map(d => d.id === selected.id ? { ...d, ...editForm } : d));
      setSuccess("Device updated! ESP32 will use new config on next boot.");
    } catch {}
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
    } catch {}
    finally { setDeleting(false); }
  };

  const openEdit = (device: Device) => {
    setSelected(device);
    setEditForm({
      name:          device.name,
      wifi_ssid:     device.wifi_ssid     ?? "",
      wifi_password: device.wifi_password ?? "",
      server_url:    device.server_url    ?? "",
      scan_cooldown: device.scan_cooldown,
    });
    setSuccess("");
    setModalMode("edit");
  };

  const openQR = async (device: Device) => {
    setSelected(device);
    await generateQR(device);
    setModalMode("qr");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setSuccess("");
    setQrDataUrl("");
    setShowWifiPw(false);
  };

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${selected?.name ?? "device"}-pairing-qr.png`;
    a.click();
  };

  const formatLastSeen = (ts: string | null) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString();
  };

  const setAdd  = (k: string, v: string | number) => setAddForm(p  => ({ ...p, [k]: v }));
  const setEdit = (k: string, v: string | number) => setEditForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", maxWidth: "56rem", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Devices</h1>
          <p style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.25rem" }}>Manage your ESP32 QR scanners</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
            {devices.filter(d => d.status === "online").length} online
          </span>
          <button onClick={() => { setModalMode("add"); setSuccess(""); }}
            style={{ background: "#fff", border: "none", color: "#4338ca", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
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

      {/* Device List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "2rem", height: "2rem", border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: "1rem", border: "1px dashed #e5e7eb" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", background: "#eef2ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="28" height="28" fill="none" stroke="#a5b4fc" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: "#1f2937" }}>No devices yet</p>
          <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.375rem" }}>
            Click <strong>Add Device</strong> to generate a pairing QR code for your ESP32.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {devices.map(device => (
            <div key={device.id}
              style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

              {/* Card top */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", background: device.status === "online" ? "#eef2ff" : "#f3f4f6", borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" fill="none" stroke={device.status === "online" ? "#4f46e5" : "#9ca3af"} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
                  </svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: device.paired ? "#dcfce7" : "#fef9c3", color: device.paired ? "#16a34a" : "#a16207", textTransform: "uppercase" }}>
                    {device.paired ? "Paired" : "Pending"}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: device.status === "online" ? "#dcfce7" : "#f3f4f6", color: device.status === "online" ? "#16a34a" : "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: device.status === "online" ? "#16a34a" : "#9ca3af", display: "inline-block" }} />
                    {device.status}
                  </span>
                </div>
              </div>

              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1f2937", marginBottom: "0.2rem" }}>{device.name}</p>
              {device.chip_id && (
                <p style={{ fontSize: "0.7rem", color: "#9ca3af", fontFamily: "monospace", marginBottom: "0.75rem" }}>ID: {device.chip_id}</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1rem" }}>
                {device.wifi_ssid && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="12" height="12" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{device.wifi_ssid}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="12" height="12" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <polyline points="12 6 12 12 16 14" strokeWidth={2} />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Last seen: {formatLastSeen(device.last_seen)}</span>
                </div>
              </div>

              {/* Card actions */}
              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.875rem" }}>
                <button onClick={() => openQR(device)}
                  style={{ flex: 1, padding: "0.45rem", border: "1px solid #e0e7ff", borderRadius: "0.5rem", background: "#eef2ff", color: "#4f46e5", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Show QR
                </button>
                <button onClick={() => openEdit(device)}
                  style={{ flex: 1, padding: "0.45rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", color: "#374151", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {modalMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", width: "100%", maxWidth: "28rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>

            {/* Modal header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1f2937" }}>
                {modalMode === "add"  && "Add New Device"}
                {modalMode === "qr"  && `Pair "${selected?.name}"`}
                {modalMode === "edit" && `Configure "${selected?.name}"`}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── ADD FORM ── */}
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
                    <input type={showWifiPw ? "text" : "password"} value={addForm.wifi_password} onChange={e => setAdd("wifi_password", e.target.value)} required placeholder="Your WiFi password" style={{ ...inputStyle, paddingRight: "2.5rem" }} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowWifiPw(p => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                      {showWifiPw
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Server URL *</label>
                  <input type="text" value={addForm.server_url} onChange={e => setAdd("server_url", e.target.value)} required placeholder="http://192.168.x.x:8000/api/scan" style={inputStyle} onFocus={focus} onBlur={blur} />
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.3rem" }}>Run <code style={{ background: "#f3f4f6", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>ipconfig</code> to find your PC's local IP</p>
                </div>
                <div>
                  <label style={labelStyle}>Scan Cooldown (ms)</label>
                  <input type="number" value={addForm.scan_cooldown} onChange={e => setAdd("scan_cooldown", parseInt(e.target.value))} min={1000} max={10000} step={500} style={inputStyle} onFocus={focus} onBlur={blur} />
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.3rem" }}>{addForm.scan_cooldown / 1000}s between scans</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.625rem", paddingTop: "0.5rem" }}>
                  <button type="button" onClick={closeModal} style={{ padding: "0.625rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={processing}
                    style={{ padding: "0.625rem 1.25rem", background: processing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    onMouseEnter={e => !processing && (e.currentTarget.style.background = "#4338ca")}
                    onMouseLeave={e => !processing && (e.currentTarget.style.background = "#4f46e5")}>
                    {processing
                      ? <><div style={{ width: "0.875rem", height: "0.875rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creating...</>
                      : <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Create & Generate QR</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* ── QR SCREEN ── */}
            {modalMode === "qr" && selected && (
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
                <div style={{ background: "#eef2ff", border: "1px solid #e0e7ff", borderRadius: "0.75rem", padding: "0.875rem 1.25rem", width: "100%" }}>
                  <p style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 600, marginBottom: "0.25rem" }}>📋 Instructions</p>
                  <p style={{ fontSize: "0.75rem", color: "#6366f1", lineHeight: 1.6 }}>
                    Point your ESP32's barcode scanner at this QR code. It will read the config, connect to WiFi, and register itself automatically.
                  </p>
                </div>

                {qrDataUrl ? (
                  <div style={{ padding: "1rem", background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                    <img src={qrDataUrl} alt="Pairing QR" style={{ width: "220px", height: "220px", display: "block" }} />
                  </div>
                ) : (
                  <div style={{ width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "2rem", height: "2rem", border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  </div>
                )}

                <div style={{ width: "100%", background: "#f9fafb", borderRadius: "0.75rem", padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Device</span>
                    <span style={{ fontSize: "0.75rem", color: "#1f2937", fontWeight: 600 }}>{selected.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>WiFi</span>
                    <span style={{ fontSize: "0.75rem", color: "#1f2937" }}>{selected.wifi_ssid}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Status</span>
                    <span style={{ fontSize: "0.75rem", color: selected.paired ? "#16a34a" : "#a16207", fontWeight: 600 }}>{selected.paired ? "✓ Paired" : "⏳ Waiting for ESP32..."}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.625rem", width: "100%" }}>
                  <button onClick={downloadQR}
                    style={{ flex: 1, padding: "0.625rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", color: "#374151", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download QR
                  </button>
                  <button onClick={closeModal}
                    style={{ flex: 1, padding: "0.625rem", background: "#4f46e5", border: "none", borderRadius: "0.5rem", color: "#fff", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── EDIT FORM ── */}
            {modalMode === "edit" && selected && (
              <form onSubmit={handleEdit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

                <div style={{ background: "#f9fafb", borderRadius: "0.75rem", padding: "0.875rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Chip ID</p>
                    <p style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#374151" }}>{selected.chip_id ?? "Not paired yet"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Last Seen</p>
                    <p style={{ fontSize: "0.7rem", color: "#374151" }}>{formatLastSeen(selected.last_seen)}</p>
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
                    <button type="button" onClick={() => setShowWifiPw(p => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                      {showWifiPw
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
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
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.3rem" }}>{editForm.scan_cooldown / 1000}s between scans</p>
                </div>

                {success && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.625rem 0.875rem" }}>
                    <svg width="14" height="14" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    <p style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 500 }}>{success}</p>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.875rem", background: "none", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {deleting ? "Removing..." : "Remove"}
                  </button>
                  <div style={{ display: "flex", gap: "0.625rem" }}>
                    <button type="button" onClick={closeModal} style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
                    <button type="submit" disabled={processing}
                      style={{ padding: "0.5rem 1.25rem", background: processing ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                      onMouseEnter={e => !processing && (e.currentTarget.style.background = "#4338ca")}
                      onMouseLeave={e => !processing && (e.currentTarget.style.background = "#4f46e5")}>
                      {processing
                        ? <><div style={{ width: "0.875rem", height: "0.875rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Saving...</>
                        : <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Config</>
                      }
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