// src/pages/Staff/tabs/MyScheduleTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Schedule {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time?: string;
  day: string;
  status: "Upcoming" | "Ongoing" | "Present" | "Late" | "Absent" | "Attended" | "Excused";
  attendance?: "Present" | "Absent";
  room: string;
  device_id?: number | null;
  scanned_at?: string | null;
  block?: string;
  late_minutes?: number | null;
}

interface Event {
  id: number;
  title: string;
  date: string;
  date_ends: string;
  start: string;
  ends?: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  location?: string;
}

interface Device {
  id: number;
  name: string;
  paired: boolean;
  status?: "online" | "offline";
}

// ─── Modal Types ─────────────────────────────────────────────────────────────
type ModalType = "confirm" | "alert";

interface ModalState {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: "danger" | "warning" | "info";
}

const defaultModal: ModalState = {
  open: false, type: "alert", title: "", message: "",
  confirmLabel: "OK", cancelLabel: "Cancel", variant: "info",
};

function AppModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  if (!modal.open) return null;
  const v = {
    danger:  { header: "#fee2e2", icon: "❌", btnBg: "#dc2626", btnHover: "#b91c1c" },
    warning: { header: "#fff3cd", icon: "⚠️", btnBg: "#d97706", btnHover: "#b45309" },
    info:    { header: "#dbeafe", icon: "ℹ️", btnBg: "#003366", btnHover: "#004c99" },
  }[modal.variant ?? "info"];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", width: "100%", maxWidth: "26rem", overflow: "hidden", animation: "modalPop 0.15s ease-out" }}>
        <div style={{ background: v.header, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.625rem", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "1.1rem" }}>{v.icon}</span>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{modal.title}</h3>
        </div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0 1.5rem 1.25rem" }}>
          {modal.type === "confirm" && (
            <button onClick={onClose}
              style={{ padding: "0.5rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#64748b" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              {modal.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            onClick={() => { modal.onConfirm?.(); onClose(); }}
            style={{ padding: "0.5rem 1.25rem", border: "none", borderRadius: "0.5rem", background: v.btnBg, color: "#fff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = v.btnHover)}
            onMouseLeave={e => (e.currentTarget.style.background = v.btnBg)}>
            {modal.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
const dayOrder = ["MWF", "TTH", "SAT", "SUN"];

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF: { bg: "#e0e7ff", color: "#4338ca" },
  TTH: { bg: "#f3e8ff", color: "#7e22ce" },
  SAT: { bg: "#ffedd5", color: "#c2410c" },
  SUN: { bg: "#fee2e2", color: "#dc2626" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Late:     { bg: "#fed7aa", color: "#c2410c" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
  Excused:  { bg: "#fff3cd", color: "#856404" },
};

const statusEmoji: Record<string, string> = {
  Upcoming: "🔵", Ongoing: "🟡", Present: "🟢", Late: "⏱️",
  Absent: "🔴", Attended: "🟣", Excused: "📝",
};

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

const isTimeUp = (endTime?: string): boolean => {
  if (!endTime) return false;
  const [h, m] = endTime.split(":").map(Number);
  const end = new Date(); end.setHours(h, m, 0, 0);
  return new Date() > end;
};

const isTimeStarted = (startTime?: string): boolean => {
  if (!startTime) return false;
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(); start.setHours(h, m, 0, 0);
  return new Date() >= start;
};

const getTodayGroup = (): string => {
  const d = new Date().getDay();
  if (d === 1 || d === 3 || d === 5) return "MWF";
  if (d === 2 || d === 4) return "TTH";
  if (d === 6) return "SAT";
  if (d === 0) return "SUN";
  return "";
};

const isTodaySchedule = (s: Schedule): boolean => {
  const todayGroup = getTodayGroup();
  return s.day === todayGroup;
};

// FIXED: Only calculate Ongoing/Upcoming for TODAY's schedules
const getDisplayStatus = (s: Schedule): Schedule["status"] => {
  // If status is already finalized, return it
  if (s.status === "Present" || s.status === "Attended" ||
      s.status === "Excused" || s.status === "Absent" || s.status === "Late") return s.status;
  
  // For non-today schedules, just return the status as is (Upcoming or Ongoing from DB)
  if (!isTodaySchedule(s)) return s.status;
  
  // For today's schedules, calculate based on current time
  if ((s.status === "Upcoming" || s.status === "Ongoing") && isTimeUp(s.end_time)) return "Absent";
  if (s.status === "Upcoming" && isTimeStarted(s.time) && !isTimeUp(s.end_time)) return "Ongoing";
  
  return s.status;
};

export default function MyScheduleTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [modal, setModal] = useState<ModalState>(defaultModal);

  const showAlert = (title: string, message: string, variant: ModalState["variant"] = "info") =>
    setModal({ open: true, type: "alert", title, message, variant, confirmLabel: "OK" });

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant: ModalState["variant"] = "danger", confirmLabel = "Confirm") =>
    setModal({ open: true, type: "confirm", title, message, onConfirm, variant, confirmLabel, cancelLabel: "Cancel" });

  const closeModal = () => setModal(prev => ({ ...prev, open: false }));

  const reportedOngoing = React.useRef<Set<number>>(new Set());
  const pairedDevices = devices.filter(d => d.paired);

  useSocket({
    room: "staff",
    onScan: () => fetchAll(true),
    onScheduleUpdate: () => fetchAll(true),
    onAttendanceUpdate: () => fetchAll(true),
    onEventUpdate: () => fetchAll(true),
  });

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  // FIXED: Only set Ongoing for TODAY's schedules that meet the time criteria
  useEffect(() => {
    if (schedules.length === 0) return;
    
    const todayGroup = getTodayGroup();
    const ongoingSchedules = schedules.filter(s => {
      // Only proceed if status is Upcoming
      if (s.status !== "Upcoming") return false;
      // Skip if already reported
      if (reportedOngoing.current.has(s.id)) return false;
      // CRITICAL: Only consider TODAY's schedules
      if (s.day !== todayGroup) return false;
      // Check if time has started and not ended
      return isTimeStarted(s.time) && !isTimeUp(s.end_time);
    });
    
    if (ongoingSchedules.length === 0) return;
    
    ongoingSchedules.forEach(async (s) => {
      reportedOngoing.current.add(s.id);
      try {
        await api.post("/admin/schedules/set-ongoing", { schedule_id: s.id });
        fetchAll(true);
      } catch {
        reportedOngoing.current.delete(s.id);
      }
    });
  }, [schedules, now]);

  const fetchAll = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);
    reportedOngoing.current.clear();

    try {
      const [schedRes, eventsRes, devRes] = await Promise.allSettled([
        api.get("/admin/schedules"),
        api.get("/admin/events"),
        api.get("/devices"),
      ]);

      if (schedRes.status === "fulfilled") {
        const data = schedRes.value.data;
        let schedulesData: Schedule[] = [];
        if (Array.isArray(data)) {
          schedulesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          schedulesData = data.data;
        } else if (data?.schedules && Array.isArray(data.schedules)) {
          schedulesData = data.schedules;
        } else {
          schedulesData = [];
        }
        setSchedules(schedulesData);
        
        // Initialize collapsed groups
        const todayGroup = getTodayGroup();
        const initialCollapsed: Record<string, boolean> = {};
        dayOrder.forEach(day => {
          initialCollapsed[day] = day !== todayGroup;
        });
        setCollapsedGroups(initialCollapsed);
      } else {
        setSchedules([]);
      }

      if (eventsRes.status === "fulfilled") {
        const data = eventsRes.value.data;
        let eventsData: Event[] = [];
        if (Array.isArray(data)) {
          eventsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          eventsData = data.data;
        }
        const today = new Date(); today.setHours(0, 0, 0, 0);
        eventsData = eventsData.map(event => {
          const start = new Date(event.date); start.setHours(0, 0, 0, 0);
          const end = new Date(event.date_ends); end.setHours(0, 0, 0, 0);
          const calculatedStatus: "Upcoming" | "Ongoing" | "Completed" =
            today > end ? "Completed" : today >= start ? "Ongoing" : "Upcoming";
          return { ...event, status: calculatedStatus };
        });
        setEvents(eventsData);
      } else {
        setEvents([]);
      }

      if (devRes.status === "fulfilled") {
        const data = devRes.value.data;
        let devicesData: Device[] = [];
        if (Array.isArray(data)) {
          devicesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          devicesData = data.data;
        }
        setDevices(devicesData);
      } else {
        setDevices([]);
      }

      setLastUpdated(new Date());

    } catch (err: any) {
      setFetchError(err?.message || "Failed to load data. Please try refreshing.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const todayGroup = getTodayGroup();

  const filtered = schedules.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      s.name.toLowerCase().includes(q) ||
      s.instructor_id.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.subject_code.toLowerCase().includes(q) ||
      (s.block && s.block.toLowerCase().includes(q));
    const displayStatus = getDisplayStatus(s);
    return matchSearch &&
      (!dayFilter || s.day === dayFilter) &&
      (!statusFilter || displayStatus === statusFilter);
  });

  const grouped = dayOrder.reduce((acc, day) => {
    const ds = filtered.filter(s => s.day === day);
    if (ds.length > 0) acc[day] = ds;
    return acc;
  }, {} as Record<string, Schedule[]>);

  const todaySchedules = schedules.filter(s => isTodaySchedule(s));
  const todayPresent = todaySchedules.filter(s => { const ds = getDisplayStatus(s); return ds === "Present" || ds === "Attended"; }).length;
  const todayLate = todaySchedules.filter(s => getDisplayStatus(s) === "Late").length;
  const todayAbsent = todaySchedules.filter(s => getDisplayStatus(s) === "Absent").length;
  const todayOngoing = todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing").length;
  const todayExcused = todaySchedules.filter(s => getDisplayStatus(s) === "Excused").length;

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getOngoingEventForRoom = (deviceName: string): Event | null => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date();
    const currentTime = `${nowTime.getHours().toString().padStart(2, '0')}:${nowTime.getMinutes().toString().padStart(2, '0')}`;
    
    return events.find(event => {
      if (event.status !== "Ongoing") return false;
      
      const eventLocation = event.location?.trim().toLowerCase() || "";
      const targetDevice = deviceName.trim().toLowerCase();
      if (eventLocation !== targetDevice) return false;
      
      if (today < event.date || today > event.date_ends) return false;
      
      const rawStart = (event.start || "").substring(0, 5);
      const rawEnd = (event.ends || "").substring(0, 5);
      
      const isAllDay = (!rawStart || rawStart === "00:00") && (!rawEnd || rawEnd === "00:00");
      if (isAllDay) return true;
      
      if (rawEnd && currentTime > rawEnd) return false;
      if (rawStart && currentTime < rawStart) return false;
      
      return true;
    }) || null;
  };

  const handleMarkAbsent = (s: Schedule) => {
    showConfirm(
      "Mark as Absent",
      `Mark ${s.name} absent for ${s.subject}?`,
      async () => {
        try {
          await api.post("/admin/attendance-logs/mark-absent-manual", {
            instructor_id: s.instructor_id,
            schedule_id: s.id,
            room: s.room ?? null,
            subject: s.subject ?? null,
            code: s.subject_code ?? null,
            day: s.day ?? null,
            time_in: null,
            time_out: s.end_time ?? null,
            date: new Date().toISOString().split("T")[0],
            status: "Absent",
          });
          fetchAll(true);
        } catch {
          showAlert("Error", "Failed to mark absent.", "danger");
        }
      },
      "danger", "Mark Absent",
    );
  };

  const handleMarkAllAbsent = () => {
    const targets = todaySchedules.filter(s => {
      const ds = getDisplayStatus(s);
      return ds === "Ongoing" || ds === "Absent";
    });

    if (targets.length === 0) {
      showAlert("No Schedules", "No schedules to mark absent.", "info");
      return;
    }

    showConfirm(
      "Mark All Absent",
      `Mark ${targets.length} schedule(s) as Absent?`,
      async () => {
        const today = new Date().toISOString().split("T")[0];
        let success = 0;

        await Promise.allSettled(targets.map(async s => {
          try {
            await api.post("/admin/attendance-logs/mark-absent-manual", {
              instructor_id: s.instructor_id,
              schedule_id: s.id,
              room: s.room ?? null,
              subject: s.subject ?? null,
              code: s.subject_code ?? null,
              day: s.day ?? null,
              time_in: null,
              time_out: s.end_time ?? null,
              date: today,
              status: "Absent",
            });
            success++;
          } catch {}
        }));

        showAlert(
          "Done",
          `Marked ${success} of ${targets.length} schedule(s) as Absent.`,
          success === targets.length ? "info" : "warning",
        );
        fetchAll(true);
      },
      "danger", "Mark All Absent",
    );
  };

  const handleExcuseAll = (deviceId: number, deviceName: string) => {
    showConfirm(
      "Excuse All Today",
      `Excuse all today's schedules for ${deviceName}?`,
      async () => {
        try {
          const res = await api.post("/admin/schedules/excuse-all-today", { device_id: deviceId });
          showAlert("Success", res.data.message, "info");
          fetchAll(true);
        } catch (err: any) {
          showAlert("Error", err.response?.data?.message ?? "Failed to excuse schedules.", "danger");
        }
      },
      "warning", "Excuse All",
    );
  };

  const handleExcuseAllDevices = () => {
    showConfirm(
      "Excuse All Devices",
      "Excuse ALL today's schedules across all devices?",
      async () => {
        try {
          const res = await api.post("/admin/schedules/excuse-all-today", {});
          showAlert("Success", res.data.message, "info");
          fetchAll(true);
        } catch (err: any) {
          showAlert("Error", err.response?.data?.message ?? "Failed to excuse schedules.", "danger");
        }
      },
      "warning", "Excuse All",
    );
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem", border: "1px solid #e2e8f0",
    borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
    background: "#fff", color: "#1e293b",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      <AppModal modal={modal} onClose={closeModal} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Instructor Schedules</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
            {pairedDevices.length} device{pairedDevices.length !== 1 ? "s" : ""} paired
          </p>
          <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>Last updated: {lastUpdated.toLocaleTimeString()}</p>
          {fetchError && (
            <p style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.5rem", background: "#fee2e2", padding: "0.5rem", borderRadius: "0.5rem" }}>⚠️ {fetchError}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            style={{ background: refreshing ? "#e2e8f0" : "#fff", color: refreshing ? "#94a3b8" : "#003366", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={handleMarkAllAbsent}
            disabled={todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing" || getDisplayStatus(s) === "Absent").length === 0}
            style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", color: "#dc2626" }}>
            ❌ Mark All Absent ({todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing" || getDisplayStatus(s) === "Absent").length})
          </button>
        </div>
      </div>

      {events.filter(e => e.status === "Ongoing").length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "0.875rem", padding: "0.875rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
            <span>📅</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#856404" }}>Event ongoing today — excuse schedules by device:</span>
          </div>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            <button
              onClick={handleExcuseAllDevices}
              style={{ background: "#003366", color: "#fff", border: "none", borderRadius: "0.375rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              📝 Excuse All Today
            </button>
            {pairedDevices.map(dev => {
              const hasEvent = getOngoingEventForRoom(dev.name);
              if (!hasEvent) return null;
              return (
                <button key={dev.id} onClick={() => handleExcuseAll(dev.id, dev.name)}
                  style={{ background: "#856404", color: "#fff", border: "none", borderRadius: "0.375rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  📝 {dev.name} - {hasEvent.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {todaySchedules.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", borderRadius: "0.875rem", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p style={{ color: "#bfdbfe", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Today's Overview</p>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })} · {todayGroup}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            {[
              { label: "Total", value: todaySchedules.length, color: "#fff" },
              { label: "Ongoing", value: todayOngoing, color: "#fde68a" },
              { label: "Present", value: todayPresent, color: "#4ade80" },
              { label: "Late", value: todayLate, color: "#fb923c" },
              { label: "Absent", value: todayAbsent, color: "#f87171" },
              { label: "Excused", value: todayExcused, color: "#fcd34d" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.375rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "0.65rem", color: "#bfdbfe", marginTop: "0.2rem" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by name, ID, subject, block..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "180px" }} />
        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Days</option>
          {dayOrder.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Status</option>
          {["Upcoming", "Ongoing", "Present", "Late", "Absent", "Attended", "Excused"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#94a3b8" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading schedules...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ ...glassCardStyle, padding: "3rem", textAlign: "center", color: "#64748b" }}>
          <p>No schedules found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, daySchedules]) => {
          const isToday = day === todayGroup;
          const isCollapsed = collapsedGroups[day] ?? (day !== todayGroup);

          return (
            <div key={day} style={glassCardStyle}>
              <div
                style={{
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isToday ? "linear-gradient(135deg, #003366, #0055a4)" : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
                onClick={() => toggleGroup(day)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{
                    padding: "0.25rem 0.875rem", borderRadius: "9999px",
                    fontSize: "0.8rem", fontWeight: 700,
                    background: isToday ? "rgba(255,255,255,0.2)" : dayColors[day]?.bg,
                    color: isToday ? "#ffd700" : dayColors[day]?.color,
                  }}>
                    {day}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isToday ? "#fff" : "#475569" }}>
                    {daySchedules.length} class{daySchedules.length !== 1 ? "es" : ""}{isToday && " · Today"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {isToday && (
                    <span style={{ fontSize: "0.7rem", color: "#ffd700", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                      🕐 {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleGroup(day); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0.25rem", borderRadius: "0.375rem", transition: "all 0.2s",
                      color: isToday ? "#ffd700" : "#64748b",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isToday ? "rgba(255,255,255,0.2)" : "#e2e8f0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  >
                    <svg
                      width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {daySchedules.map(s => {
                    const displayStatus = getDisplayStatus(s);
                    const canMarkAbsent = (displayStatus === "Ongoing" || displayStatus === "Absent") && isTodaySchedule(s);

                    return (
                      <div key={s.id} style={{
                        padding: "0.875rem 1rem", borderRadius: "0.625rem",
                        background:
                          displayStatus === "Present"  ? "#f0fdf4" :
                          displayStatus === "Attended" ? "#f3e8ff" :
                          displayStatus === "Late"     ? "#fff7ed" :
                          displayStatus === "Absent"   ? "#fef2f2" :
                          displayStatus === "Excused"  ? "#fffbeb" :
                          displayStatus === "Ongoing"  ? "#fefce8" : "#f8fafc",
                        border: `1px solid ${
                          displayStatus === "Present"  ? "#bbf7d0" :
                          displayStatus === "Attended" ? "#d8b4fe" :
                          displayStatus === "Late"     ? "#fed7aa" :
                          displayStatus === "Absent"   ? "#fecaca" :
                          displayStatus === "Excused"  ? "#fde68a" :
                          displayStatus === "Ongoing"  ? "#fde68a" : "#e2e8f0"
                        }`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b" }}>{s.name}</p>
                              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#3b82f6" }}>{s.instructor_id}</span>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.1rem" }}>
                              {s.subject}
                              {s.subject_code && <span style={{ fontFamily: "monospace", marginLeft: "0.4rem", color: "#64748b", fontSize: "0.75rem" }}>({s.subject_code})</span>}
                            </p>
                            {s.block && (
                              <p style={{ fontSize: "0.7rem", color: "#003366", marginTop: "0.1rem", fontWeight: 500 }}>
                                📚 Block: {s.block}
                              </p>
                            )}
                            <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {s.time}{s.end_time ? ` – ${s.end_time}` : ""}
                              </span>
                              {s.room && (
                                <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  {s.room}
                                </span>
                              )}
                            </div>
                            {s.scanned_at && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.375rem" }}>
                                {displayStatus === "Late" ? (
                                  <>
                                    <svg width="11" height="11" fill="none" stroke="#c2410c" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span style={{ fontSize: "0.68rem", color: "#c2410c", fontWeight: 600 }}>
                                      Late by {s.late_minutes ?? "?"} min • Scanned at {new Date(s.scanned_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <svg width="11" height="11" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span style={{ fontSize: "0.68rem", color: "#22c55e", fontWeight: 600 }}>
                                      Scanned at {new Date(s.scanned_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                            {(displayStatus === "Present" || displayStatus === "Attended" ||
                              displayStatus === "Late"  || displayStatus === "Absent"  || displayStatus === "Excused") && (
                              <span style={{
                                fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "9999px",
                                background: (displayStatus === "Present" || displayStatus === "Attended") ? "#dcfce7" :
                                            displayStatus === "Late" ? "#fed7aa" :
                                            displayStatus === "Excused" ? "#fff3cd" : "#fee2e2",
                                color:      (displayStatus === "Present" || displayStatus === "Attended") ? "#15803d" :
                                            displayStatus === "Late" ? "#c2410c" :
                                            displayStatus === "Excused" ? "#856404" : "#dc2626",
                              }}>
                                {displayStatus === "Present" || displayStatus === "Attended" ? "✅ Present" :
                                 displayStatus === "Late" ? "⏱️ Late" :
                                 displayStatus === "Excused" ? "📝 Excused" : "❌ Absent"}
                              </span>
                            )}
                            <span style={{
                              fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.6rem", borderRadius: "9999px",
                              background: statusColors[displayStatus]?.bg ?? "#f1f5f9",
                              color: statusColors[displayStatus]?.color ?? "#475569",
                            }}>
                              {statusEmoji[displayStatus]} {displayStatus}
                            </span>

                            {canMarkAbsent && (
                              <button onClick={() => handleMarkAbsent(s)}
                                style={{ background: "#fee2e2", border: "1px solid #fecaca", cursor: "pointer", color: "#dc2626", fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", marginTop: "0.125rem" }}>
                                ❌ Mark Absent
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}