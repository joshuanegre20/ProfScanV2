// src/pages/Admin/tabs/SchedulesTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Device {
  id: number;
  name: string;
  status: "online" | "offline";
  paired: boolean;
  chip_id: string | null;
}

interface Instructor {
  id: number;
  name: string;
  employee_id: string;
  instructor_id: string;
  department: string;
  role: string;
}

interface Subject {
  id: number;
  subject: string;
  subject_code: string;
  department: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  date_ends: string;
  start: string;
  ends?: string;
  location: string;
  type: "Academic" | "Administrative" | "Social" | "Training";
  status: "Upcoming" | "Ongoing" | "Completed";
  attendees: number;
}

interface Schedule {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time?: string;
  day: string;
  status: "Upcoming" | "Ongoing" | "Present" | "Absent" | "Attended" | "Excused";
  attendance: "Attended" | "Unattented";
  room: string;
  device_id?: number | null;
  scanned_at?: string | null;
  block: string;
}

interface ScheduleForm {
  instructor_id: string;
  name: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time: string;
  day: string;
  status: Schedule["status"];
  room: string;
  device_id: string;
  block: string;
}

// ─── Modal Types ────────────────────────────────────────────────────────────
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
  open: false,
  type: "alert",
  title: "",
  message: "",
  confirmLabel: "OK",
  cancelLabel: "Cancel",
  variant: "info",
};
// ────────────────────────────────────────────────────────────────────────────

const groupOrder = ["MWF", "TTH", "SAT", "SUN", "SAT-SUN"];

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF: { bg: "#e0e7ff", color: "#4338ca" },
  TTH: { bg: "#f3e8ff", color: "#7e22ce" },
  SAT: { bg: "#ffedd5", color: "#c2410c" },
  SUN: { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing: { bg: "#fef9c3", color: "#a16207" },
  Present: { bg: "#dcfce7", color: "#15803d" },
  Absent: { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
  Excused: { bg: "#fff3cd", color: "#856404" },
};

const statusEmoji: Record<string, string> = {
  Upcoming: "🔵",
  Ongoing: "🟡",
  Present: "🟢",
  Absent: "🔴",
  Attended: "🟣",
  Excused: "📝",
};

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const isTimeUp = (endTime?: string): boolean => {
  if (!endTime) return false;
  const now = new Date();
  const [h, m] = endTime.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m, 0, 0);
  return now > end;
};

const isTimeStarted = (startTime?: string): boolean => {
  if (!startTime) return false;
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  return now >= start;
};

const getTodayGroup = () => {
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

const getDisplayStatus = (s: Schedule): Schedule["status"] => {
  if (s.status === "Present" || s.status === "Attended" ||
      s.status === "Excused" || s.status === "Absent") return s.status;
  if (!isTodaySchedule(s)) return s.status;
  if ((s.status === "Upcoming" || s.status === "Ongoing") && isTimeUp(s.end_time)) return "Absent";
  if (s.status === "Upcoming" && isTimeStarted(s.time) && !isTimeUp(s.end_time)) return "Ongoing";
  return s.status;
};

const defaultFormValue: ScheduleForm = {
  instructor_id: "",
  name: "",
  subject: "",
  subject_code: "",
  time: "",
  end_time: "",
  day: "MWF",
  status: "Upcoming",
  room: "",
  device_id: "",
  block: ""
};

// ─── AppModal Component ──────────────────────────────────────────────────────
function AppModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  if (!modal.open) return null;

  const variantColors = {
    danger: { header: "#fee2e2", icon: "❌", accent: "#dc2626", btnBg: "#dc2626", btnHover: "#b91c1c" },
    warning: { header: "#fff3cd", icon: "⚠️", accent: "#d97706", btnBg: "#d97706", btnHover: "#b45309" },
    info: { header: "#dbeafe", icon: "ℹ️", accent: "#1d4ed8", btnBg: "#003366", btnHover: "#004c99" },
  };
  const v = variantColors[modal.variant ?? "info"];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "1rem",
        boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: "26rem", overflow: "hidden",
        animation: "modalPop 0.15s ease-out",
      }}>
        <div style={{ background: v.header, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.625rem", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "1.1rem" }}>{v.icon}</span>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{modal.title}</h3>
        </div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0 1.5rem 1.25rem" }}>
          {modal.type === "confirm" && (
            <button
              onClick={onClose}
              style={{
                padding: "0.5rem 1.25rem", border: "1px solid #e2e8f0",
                borderRadius: "0.5rem", background: "none",
                fontSize: "0.875rem", cursor: "pointer", color: "#64748b",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {modal.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            onClick={() => {
              modal.onConfirm?.();
              onClose();
            }}
            style={{
              padding: "0.5rem 1.25rem", border: "none",
              borderRadius: "0.5rem", background: v.btnBg,
              color: "#fff", fontSize: "0.875rem",
              fontWeight: 600, cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = v.btnHover)}
            onMouseLeave={e => (e.currentTarget.style.background = v.btnBg)}
          >
            {modal.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function SchedulesTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [form, setForm] = useState<ScheduleForm>(defaultFormValue);

  // ─── Modal state ────────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>(defaultModal);

  const showAlert = (title: string, message: string, variant: ModalState["variant"] = "info") => {
    setModal({ open: true, type: "alert", title, message, variant, confirmLabel: "OK" });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: ModalState["variant"] = "danger",
    confirmLabel = "Confirm",
  ) => {
    setModal({ open: true, type: "confirm", title, message, onConfirm, variant, confirmLabel, cancelLabel: "Cancel" });
  };

  const closeModal = () => setModal(prev => ({ ...prev, open: false }));
  // ────────────────────────────────────────────────────────────────────────

  const reportedOngoing = React.useRef<Set<number>>(new Set());
  const pairedDevices = devices.filter(d => d.paired);

  useSocket({
    room: "admin",
    onScan: () => fetchAll(true),
    onScheduleUpdate: () => fetchAll(true),
    onAttendanceUpdate: () => fetchAll(true),
    onEventUpdate: () => fetchAll(true),
  });

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (schedules.length === 0) return;
    const ongoingSchedules = schedules.filter(s => {
      if (s.status !== "Upcoming") return false;
      if (reportedOngoing.current.has(s.id)) return false;
      if (!isTodaySchedule(s)) return false;
      return isTimeStarted(s.time) && !isTimeUp(s.end_time);
    });
    if (ongoingSchedules.length === 0) return;
    ongoingSchedules.forEach(async (s) => {
      reportedOngoing.current.add(s.id);
      try {
        await api.post("/admin/schedules/set-ongoing", { schedule_id: s.id });
        fetchAll(true);
      } catch (err: any) {
        reportedOngoing.current.delete(s.id);
      }
    });
  }, [schedules, now]);

  const fetchAll = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else { setLoading(true); reportedOngoing.current.clear(); }
    setFetchError(null);

    try {
      const [schedRes, devicesRes, instructorsRes, subjectsRes, eventsRes] = await Promise.allSettled([
        api.get("/admin/schedules"),
        api.get("/devices"),
        api.get("/admin/instructors"),
        api.get("/admin/subjects"),
        api.get("/admin/events"),
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
      } else {
        setSchedules([]);
      }

      if (devicesRes.status === "fulfilled") {
        const data = devicesRes.value.data;
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

      if (instructorsRes.status === "fulfilled") {
        const data = instructorsRes.value.data;
        let instructorsData: Instructor[] = [];
        if (Array.isArray(data)) {
          instructorsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          instructorsData = data.data;
        }
        setInstructors(instructorsData.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setInstructors([]);
      }

      if (subjectsRes.status === "fulfilled") {
        const data = subjectsRes.value.data;
        let subjectsData: Subject[] = [];
        if (Array.isArray(data)) {
          subjectsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          subjectsData = data.data;
        } else if (data?.subjects && Array.isArray(data.subjects)) {
          subjectsData = data.subjects;
        }
        setSubjects(subjectsData);
      } else {
        setSubjects([]);
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

  const resetForm = () => {
    const firstDevice = pairedDevices[0];
    setForm({
      instructor_id: "",
      name: "",
      subject: "",
      subject_code: "",
      time: "",
      end_time: "",
      day: "MWF",
      status: "Upcoming",
      room: firstDevice?.name ?? "",
      device_id: firstDevice?.id?.toString() ?? "",
      block: ""
    });
    setEditing(null);
    setShowModal(false);
  };

  const handleSubjectChange = (subjectCode: string) => {
    const selected = subjects.find(s => s.subject_code === subjectCode);
    if (selected) setForm({ ...form, subject_code: selected.subject_code, subject: selected.subject });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.end_time && form.end_time <= form.time) {
      showAlert("Invalid Time", "End time must be after start time.", "warning");
      return;
    }

    const payload: any = { ...form };

    if (!payload.end_time) delete payload.end_time;

    if (payload.device_id && payload.device_id !== "") {
      payload.device_id = parseInt(payload.device_id);
    } else {
      payload.device_id = null;
    }

    if (!payload.room && payload.device_id) {
      const dev = pairedDevices.find(d => d.id === payload.device_id);
      if (dev) payload.room = dev.name;
    }

    try {
      setLoading(true);
      if (editing) {
        await api.put(`/admin/schedules/${editing.id}`, payload);
      } else {
        await api.post("/admin/schedules", payload);
      }
      await fetchAll();
      resetForm();
    } catch (err: any) {
      console.error("Failed to save schedule:", err);
      showAlert("Error", err.response?.data?.message || "Failed to save schedule.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      instructor_id: s.instructor_id ?? "",
      name: s.name ?? "",
      subject: s.subject ?? "",
      subject_code: s.subject_code ?? "",
      time: s.time ?? "",
      end_time: s.end_time ?? "",
      day: s.day,
      status: s.status ?? "Upcoming",
      room: s.room ?? "",
      device_id: s.device_id?.toString() ?? "",
      block: s.block ?? ""
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    showConfirm(
      "Delete Schedule",
      "Are you sure you want to delete this schedule? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/admin/schedules/${id}`);
          fetchAll();
        } catch {
          showAlert("Error", "Failed to delete schedule.", "danger");
        }
      },
      "danger",
      "Delete",
    );
  };

  const todayGroup = getTodayGroup();

  const departments = [...new Set(subjects.map(s => s.department))].sort();

  const filtered = schedules.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      s.name.toLowerCase().includes(q) ||
      s.instructor_id.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.subject_code.toLowerCase().includes(q) ||
      (s.block && s.block.toLowerCase().includes(q));
    const subjectDept = subjects.find(sub => sub.subject_code === s.subject_code)?.department;
    const displayStatus = getDisplayStatus(s);
    return matchSearch &&
      (!dayFilter || s.day === dayFilter) &&
      (!statusFilter || displayStatus === statusFilter) &&
      (!departmentFilter || subjectDept === departmentFilter);
  });

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem", border: "1px solid #e2e8f0",
    borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
    background: "#fff", color: "#1e293b",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 600,
    color: "#64748b", textTransform: "uppercase",
    letterSpacing: "0.05em", marginBottom: "0.375rem",
  };

  const subjectsByDepartment = subjects.reduce((acc, subject) => {
    if (!acc[subject.department]) acc[subject.department] = [];
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const schedulesByDevice: Record<number, { device: Device; schedules: Schedule[] }> = {};

  schedules.forEach(schedule => {
    if (schedule.device_id && pairedDevices.some(d => d.id === schedule.device_id)) {
      if (!schedulesByDevice[schedule.device_id]) {
        const device = pairedDevices.find(d => d.id === schedule.device_id);
        if (device) {
          schedulesByDevice[schedule.device_id] = {
            device: device,
            schedules: []
          };
        }
      }
      schedulesByDevice[schedule.device_id].schedules.push(schedule);
    }
  });

  const allDeviceEntries = Object.values(schedulesByDevice).filter(entry => entry.schedules.length > 0);

// Replace the getOngoingEventForRoom function with this fixed version:

const getOngoingEventForRoom = (deviceName: string): Event | null => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`\n🔍 ========== CHECKING DEVICE: "${deviceName}" ==========`);
  console.log(`📅 Today (ISO string): ${today}`);
  console.log(`🕐 Current time: ${currentTime}`);
  
  // Log all events for debugging
  console.log(`📋 All events in state:`);
  events.forEach(event => {
    console.log(`   - "${event.title}" | Location: "${event.location}" | Date: ${event.date} to ${event.date_ends} | Status: ${event.status}`);
  });
  
  const found = events.find(event => {
    console.log(`\n   Checking event: "${event.title}"`);
    console.log(`      Location: "${event.location}" vs "${deviceName}"`);
    
    // Must be ongoing status
    if (event.status !== "Ongoing") { 
      console.log(`      ❌ Status is ${event.status}, not Ongoing`);
      return false;
    }
    
    // Location must match device name (case-insensitive)
    const eventLocation = event.location?.trim().toLowerCase() || "";
    const targetDevice = deviceName.trim().toLowerCase();
    const locationMatches = eventLocation === targetDevice;
    
    if (!locationMatches) {
      console.log(`      ❌ Location mismatch: "${event.location}" !== "${deviceName}"`);
      return false;
    }
    console.log(`      ✅ Location matches`);
    
    // Today must be within the event date range
    console.log(`      Date check: ${today} between ${event.date} and ${event.date_ends}?`);
    if (today < event.date || today > event.date_ends) {
      console.log(`      ❌ Date out of range`);
      return false;
    }
    console.log(`      ✅ Date in range`);
    
    // Normalize times
    const rawStart = (event.start || "").substring(0, 5);
    const rawEnd   = (event.ends  || "").substring(0, 5);
    
    const isAllDay = (!rawStart || rawStart === "00:00") && (!rawEnd || rawEnd === "00:00");
    
    if (isAllDay) {
      console.log(`      ✅ All-day event - ACTIVE!`);
      return true;
    }
    
    // Check time range
    if (rawEnd && currentTime > rawEnd) {
      console.log(`      ❌ Time out of range: ${currentTime} > ${rawEnd}`);
      return false;
    }
    if (rawStart && currentTime < rawStart) {
      console.log(`      ❌ Time before start: ${currentTime} < ${rawStart}`);
      return false;
    }
    
    console.log(`      ✅ Time in range - ACTIVE!`);
    return true;
  });
  
  console.log(`\n📢 RESULT for ${deviceName}: ${found ? `FOUND "${found.title}"` : "NOT FOUND"}`);
  return found || null;
};

  const DeviceCard = ({ device, deviceSchedules }: { device: Device; deviceSchedules: Schedule[] }) => {
    const [excusing, setExcusing] = useState(false);
    
    // Debug log for device rendering
    console.log(`🏷️ Rendering DeviceCard for: "${device.name}"`);
    
    const ongoingEvent = getOngoingEventForRoom(device.name);
    const hasOngoingEvent = !!ongoingEvent;
    
    console.log(`📌 Device "${device.name}" has ongoing event: ${hasOngoingEvent}`, ongoingEvent);

    const handleExcuseAll = async () => {
      if (!ongoingEvent) return;
      
      showConfirm(
        "Excuse All Today",
        `Excuse all today's schedules for ${device.name} due to ongoing event: "${ongoingEvent.title}"?`,
        async () => {
          setExcusing(true);
          try {
            const res = await api.post("/admin/schedules/excuse-all-today", { 
              device_id: device.id,
              event_id: ongoingEvent.id,
              reason: ongoingEvent.title
            });
            showAlert("Success", res.data.message, "info");
            fetchAll(true);
          } catch (err: any) {
            showAlert("Error", err.response?.data?.message ?? "Failed to excuse schedules.", "danger");
          } finally {
            setExcusing(false);
          }
        },
        "warning",
        "Excuse All",
      );
    };

    const todaySchedules = deviceSchedules.filter(s => s.day === todayGroup);
    const activeNow = todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing");
    const present = todaySchedules.filter(s => getDisplayStatus(s) === "Present");
    const attended = todaySchedules.filter(s => getDisplayStatus(s) === "Attended");
    const absent = todaySchedules.filter(s => getDisplayStatus(s) === "Absent");

    const todayAttendance = deviceSchedules
      .filter(s => s.day === todayGroup && (s.status === "Attended" || s.status === "Present" || s.status === "Excused"))
      .sort((a, b) => {
        const dateA = a.scanned_at ? new Date(a.scanned_at).getTime() : 0;
        const dateB = b.scanned_at ? new Date(b.scanned_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    return (
      <div style={glassCardStyle}>
        <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: device.status === "online" ? "#4ade80" : "#94a3b8", boxShadow: device.status === "online" ? "0 0 6px #4ade80" : "none" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{device.name}</h3>
            </div>
            <p style={{ color: "#bfdbfe", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {activeNow.length > 0 ? `${activeNow.length} active class` : "No active class"}
            </p>
            {device.chip_id && (
              <p style={{ color: "#bfdbfe", fontSize: "0.65rem", fontFamily: "monospace", marginTop: "0.125rem" }}>
                {device.chip_id}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#ffd700", fontSize: "1.5rem", fontWeight: 700 }}>{todaySchedules.length}</div>
            <div style={{ color: "#bfdbfe", fontSize: "0.7rem" }}>today</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid #e2e8f0" }}>
          {[
            { label: "Total", value: deviceSchedules.length, color: "#003366" },
            { label: "Today", value: todaySchedules.length, color: "#f59e0b" },
            { label: "Present", value: present.length, color: "#22c55e" },
            { label: "Attended", value: attended.length, color: "#a855f7" },
            { label: "Absent", value: absent.length, color: "#ef4444" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "0.875rem", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Only show Excuse button if there's an ongoing event for THIS SPECIFIC device/room */}
        {hasOngoingEvent && (
          <div style={{ background: "#fff3cd", padding: "0.625rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ffeeba" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.9rem" }}>📅</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#856404" }}>
                Event ongoing: "{ongoingEvent?.title}" at {device.name}
              </span>
            </div>
            <button onClick={handleExcuseAll} disabled={excusing} style={{ background: excusing ? "#d1d5db" : "#856404", color: "#fff", border: "none", padding: "0.3rem 0.875rem", borderRadius: "0.375rem", fontSize: "0.72rem", fontWeight: 600, cursor: excusing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {excusing ? (<><div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Excusing...</>) : "📝 Excuse All Today"}
            </button>
          </div>
        )}

        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Schedule</p>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          {todaySchedules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.8rem" }}>No classes today</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: "280px", overflowY: "auto" }}>
              {todaySchedules.map(s => {
                const displayStatus = getDisplayStatus(s);
                return (
                  <div key={s.id} style={{
                    padding: "0.75rem", borderRadius: "0.5rem",
                    background: displayStatus === "Present" ? "#f0fdf4" : displayStatus === "Attended" ? "#f3e8ff" : displayStatus === "Absent" ? "#fef2f2" : displayStatus === "Excused" ? "#fff3cd" : displayStatus === "Ongoing" ? "#fefce8" : "#f8fafc",
                    border: `1px solid ${
                      displayStatus === "Present" ? "#bbf7d0" :
                      displayStatus === "Attended" ? "#d8b4fe" :
                      displayStatus === "Absent" ? "#fecaca" :
                      displayStatus === "Excused" ? "#ffeeba" :
                      displayStatus === "Ongoing" ? "#fde68a" : "#e2e8f0"
                    }`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b" }}>{s.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.1rem" }}>{s.subject}</p>
                        {s.block && (
                          <p style={{ fontSize: "0.7rem", color: "#003366", marginTop: "0.1rem", fontWeight: 500 }}>
                            Block: {s.block}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                          <svg width="12" height="12" fill="none" stroke="#64748b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{s.time}{s.end_time ? ` – ${s.end_time}` : ""}</span>
                        </div>
                        {s.scanned_at && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                            <svg width="12" height="12" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span style={{ fontSize: "0.65rem", color: "#22c55e" }}>Scanned: {new Date(s.scanned_at).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                        {(displayStatus === "Present" || displayStatus === "Attended" || displayStatus === "Absent" || displayStatus === "Excused") && (
                          <span style={{
                            fontSize: "0.65rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "9999px",
                            background: (displayStatus === "Present" || displayStatus === "Attended") ? "#dcfce7" :
                                        displayStatus === "Excused" ? "#fff3cd" : "#fee2e2",
                            color: (displayStatus === "Present" || displayStatus === "Attended") ? "#15803d" :
                                   displayStatus === "Excused" ? "#856404" : "#dc2626",
                          }}>
                            {displayStatus === "Present" || displayStatus === "Attended" ? "✅ Present" :
                             displayStatus === "Excused" ? "📝 Excused" : "❌ Absent"}
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 600, padding: "0.125rem 0.5rem", borderRadius: "9999px",
                          background: statusColors[displayStatus]?.bg,
                          color: statusColors[displayStatus]?.color,
                        }}>
                          {statusEmoji[displayStatus]} {displayStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Attendance</p>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Last 5 records</span>
          </div>
          {todayAttendance.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.8rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
              No attendance records for today
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {todayAttendance.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: s.status === "Attended" ? "#a855f7" :
                                  s.status === "Excused" ? "#856404" : "#22c55e",
                    }} />
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.75rem", color: "#1e293b" }}>{s.name}</p>
                      <p style={{ fontSize: "0.65rem", color: "#64748b" }}>{s.subject}</p>
                      {s.block && (
                        <p style={{ fontSize: "0.6rem", color: "#003366", marginTop: "0.1rem" }}>Block: {s.block}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: s.status === "Attended" ? "#a855f7" : s.status === "Excused" ? "#856404" : "#22c55e" }}>
                      {s.status}
                    </span>
                    {s.scanned_at && (
                      <p style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "0.1rem" }}>
                        {new Date(s.scanned_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ─── App-wide Modal ─────────────────────────────────────────────── */}
      <AppModal modal={modal} onClose={closeModal} />

      {/* Debug Info Panel */}
      <div style={{ background: "#eef2ff", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#1e293b", border: "1px solid #e2e8f0", marginBottom: "0.5rem" }}>
        <strong>📅 Today's Date:</strong> {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
        <br />
        <strong>🏷️ Today's Group:</strong> {todayGroup}
        <br />
        <strong>📊 Total Schedules:</strong> {schedules.length}
        <br />
        <strong>📋 Total Events:</strong> {events.length}
        <br />
        <strong>📱 Paired Devices:</strong> {pairedDevices.map(d => d.name).join(", ")}
      </div>

      {/* Ongoing Events Debug Panel */}
      <div style={{ background: "#fef3c7", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#92400e", border: "1px solid #fde68a", marginBottom: "0.5rem" }}>
        <strong>🔍 Ongoing Events:</strong><br />
        {events.filter(e => e.status === "Ongoing").length > 0 ? (
          events.filter(e => e.status === "Ongoing").map(e => (
            <div key={e.id}>
              📅 <strong>{e.title}</strong> at <strong>"{e.location}"</strong> from {e.start} to {e.ends} ({e.date} to {e.date_ends})
            </div>
          ))
        ) : (
          <div>⚠️ No ongoing events at this moment</div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Schedule Management</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.125rem" }}>
            {pairedDevices.length} device{pairedDevices.length !== 1 ? "s" : ""} paired · {subjects.length} subjects
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
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
            {(["cards", "table"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "0.375rem 0.75rem", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, background: view === v ? "#003366" : "#fff", color: view === v ? "#fff" : "#64748b" }}>
                {v === "cards" ? "📡 Devices" : "📋 Table"}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ background: "#003366", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#004c99")}
            onMouseLeave={e => (e.currentTarget.style.background = "#003366")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#94a3b8" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #003366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading schedules...
        </div>
      )}

      {!loading && (
        <>
          {view === "cards" && allDeviceEntries.length > 0 && (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {allDeviceEntries.map(entry => (
                <DeviceCard
                  key={entry.device.id}
                  device={entry.device}
                  deviceSchedules={entry.schedules}
                />
              ))}
            </div>
          )}

          {view === "table" && (
            <>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input type="text" placeholder="Search by name, ID, subject, block..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "180px" }} />
                <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Days</option>
                  {groupOrder.map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Status</option>
                  {["Upcoming", "Ongoing", "Present", "Absent", "Attended", "Excused"].map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ ...glassCardStyle }}>
                {filtered.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          {["Device", "Block", "Instructor ID", "Subject", "Code", "Dept", "Time", "Day", "Attendance", "Status", "Actions"].map(h => (
                            <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s, idx) => {
                          const dev = devices.find(d => d.id === s.device_id);
                          const subjectDept = subjects.find(sub => sub.subject_code === s.subject_code)?.department || "—";
                          const displayStatus = getDisplayStatus(s);
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #e2e8f0" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dev?.status === "online" ? "#22c55e" : "#d1d5db", display: "inline-block" }} />
                                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1e293b" }}>{dev?.name ?? s.room ?? "—"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                {s.block ? (
                                  <span style={{
                                    background: "#e0e7ff",
                                    color: "#4338ca",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.25rem",
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                  }}>
                                    {s.block}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#003366", fontWeight: 500 }}>{s.instructor_id}</td>
                              <td style={{ padding: "0.875rem 1.25rem", color: "#475569" }}>{s.subject}</td>
                              <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>{s.subject_code}</td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{ background: "#eef2ff", color: "#003366", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600 }}>{subjectDept}</span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem", color: "#64748b", whiteSpace: "nowrap" }}>{s.time}{s.end_time ? ` – ${s.end_time}` : ""}</td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: dayColors[s.day]?.bg, color: dayColors[s.day]?.color }}>{s.day}</span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                {(displayStatus === "Present" || displayStatus === "Attended" || displayStatus === "Absent" || displayStatus === "Excused") && (
                                  <span style={{
                                    padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500,
                                    background: (displayStatus === "Present" || displayStatus === "Attended") ? "#dcfce7" : displayStatus === "Excused" ? "#fff3cd" : "#fee2e2",
                                    color: (displayStatus === "Present" || displayStatus === "Attended") ? "#15803d" : displayStatus === "Excused" ? "#856404" : "#dc2626",
                                  }}>
                                    {displayStatus === "Present" || displayStatus === "Attended" ? "✅ Attended" : displayStatus === "Excused" ? "📝 Excused" : "❌ Unattended"}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{
                                  padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500,
                                  background: statusColors[displayStatus]?.bg,
                                  color: statusColors[displayStatus]?.color,
                                }}>
                                  {statusEmoji[displayStatus]} {displayStatus}
                                </span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                  <button onClick={() => handleEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#003366", fontWeight: 500, fontSize: "0.8rem", transition: "color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#004c99")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#003366")}>Edit</button>
                                  <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 500, fontSize: "0.8rem" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "4rem" }}>
                    <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No schedules found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Schedule Form Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "32rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>{editing ? "Edit Schedule" : "Add Schedule"}</h2>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>Fill in the instructor schedule details</p>
                </div>
                <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Assign to Device *</label>
                  {pairedDevices.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "#ef4444" }}>No paired devices available. Please add a device first.</p>
                  ) : (
                    <select
                      value={form.device_id}
                      onChange={e => {
                        const deviceId = e.target.value;
                        const selectedDevice = pairedDevices.find(d => d.id.toString() === deviceId);
                        setForm({
                          ...form,
                          device_id: deviceId,
                          room: selectedDevice?.name ?? ""
                        });
                      }}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select a device</option>
                      {pairedDevices.map(device => (
                        <option key={device.id} value={device.id.toString()}>
                          {device.name} {device.status === "online" ? "🟢 Online" : "⚪ Offline"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Instructor *</label>
                  <select value={form.instructor_id} required onChange={e => {
                    const sel = instructors.find(i => i.instructor_id === e.target.value);
                    setForm({ ...form, instructor_id: e.target.value, name: sel?.name ?? "" });
                  }} style={inputStyle}>
                    <option value="">Select Instructor</option>
                    {instructors.map(i => <option key={i.id} value={i.instructor_id}>{i.name}</option>)}
                  </select>
                </div>
                {form.instructor_id && (
                  <div>
                    <label style={labelStyle}>Instructor ID</label>
                    <input type="text" value={form.instructor_id} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#003366", fontFamily: "monospace", fontWeight: 600, cursor: "default" }} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Subject *</label>
                  <select value={form.subject_code} required onChange={e => handleSubjectChange(e.target.value)} style={inputStyle}>
                    <option value="">Select Subject</option>
                    {Object.entries(subjectsByDepartment).map(([dept, deptSubjects]) => (
                      <optgroup key={dept} label={`${dept} Department`}>
                        {deptSubjects.map(subject => (
                          <option key={subject.id} value={subject.subject_code}>{subject.subject_code} — {subject.subject}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {form.subject_code && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div><label style={labelStyle}>Subject Name</label><input type="text" value={form.subject} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#1e293b", cursor: "default" }} /></div>
                    <div><label style={labelStyle}>Subject Code</label><input type="text" value={form.subject_code} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#003366", fontFamily: "monospace", fontWeight: 600, cursor: "default" }} /></div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Block</label>
                  <input 
                    type="text" 
                    placeholder="Block number (01-99)"
                    maxLength={2}
                    pattern="[0-9]{2}"
                    value={form.block}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9]/g, '');
                      if (value.length > 2) {
                        value = value.slice(0, 2);
                      }
                      setForm({ ...form, block: value });
                    }}
                    style={inputStyle}
                  />
                  <p style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                  }}>
                    Enter 2-digit block number (e.g., 01, 02, 15)
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div><label style={labelStyle}>Start Time *</label><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inputStyle} required /></div>
                  <div><label style={labelStyle}>End Time</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Day *</label>
                    <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} style={inputStyle}>
                      <option value="MWF">MWF</option>
                      <option value="TTH">TTH</option>
                      <option value="SAT">SAT</option>
                      <option value="SUN">SUN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Initial Status</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {(["Upcoming", "Ongoing", "Present", "Absent", "Attended", "Excused"] as const).map(s => (
                      <label key={s} style={{ flex: 1, minWidth: "80px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, border: `2px solid ${form.status === s ? statusColors[s]?.color : "#e2e8f0"}`, background: form.status === s ? statusColors[s]?.bg : "transparent", color: form.status === s ? statusColors[s]?.color : "#64748b" }}>
                        <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} style={{ display: "none" }} />
                        {statusEmoji[s]} {s}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.25rem" }}>Status will be automatically evaluated based on time.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                  <button type="button" onClick={resetForm} style={{ padding: "0.5rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#64748b", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>Cancel</button>
                  <button type="submit" disabled={loading || pairedDevices.length === 0} style={{ padding: "0.5rem 1.25rem", background: loading || pairedDevices.length === 0 ? "#cbd5e1" : "#003366", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: loading || pairedDevices.length === 0 ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => { if (!loading && pairedDevices.length > 0) e.currentTarget.style.background = "#004c99"; }}
                    onMouseLeave={e => { if (!loading && pairedDevices.length > 0) e.currentTarget.style.background = "#003366"; }}>
                    {editing ? "Update Schedule" : "Add Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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