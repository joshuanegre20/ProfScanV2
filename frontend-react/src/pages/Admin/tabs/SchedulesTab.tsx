// src/pages/Admin/tabs/SchedulesTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

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
  day: "MWF" | "TTH" | "SAT" | "SUN" | "SAT-SUN";
  status: "Upcoming" | "Ongoing" | "Present" | "Absent" | "Attended" | "Excused";
  attendance: "Present" | "Absent";
  room: string;
  device_id?: number | null;
  scanned_at?: string | null;
}

interface ScheduleForm {
  instructor_id: string;
  name: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time: string;
  day: Schedule["day"];
  status: Schedule["status"];
  room: string;
  device_id: string;
}

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF:       { bg: "#e0e7ff", color: "#4338ca" },
  TTH:       { bg: "#f3e8ff", color: "#7e22ce" },
  SAT:       { bg: "#ffedd5", color: "#c2410c" },
  SUN:       { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
  Excused:  { bg: "#fff3cd", color: "#856404" },
};

const statusEmoji: Record<string, string> = {
  Upcoming: "🔵",
  Ongoing:  "🟡",
  Present:  "🟢",
  Absent:   "🔴",
  Attended: "🟣",
  Excused:  "📝",
};

// ── Helpers ──────────────────────────────────────────────────────
const isTimeUp = (endTime?: string): boolean => {
  if (!endTime) return false;
  const now = new Date();
  const [hours, minutes] = endTime.split(":").map(Number);
  const end = new Date();
  end.setHours(hours, minutes, 0, 0);
  return now > end;
};

const isTimeStarted = (startTime?: string): boolean => {
  if (!startTime) return false;
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  return now >= start;
};

const isTodaySchedule = (s: Schedule): boolean => {
  const d = new Date().getDay();
  const todayMap: Record<number, string[]> = {
    1: ["MWF"], 2: ["TTH"], 3: ["MWF"], 4: ["TTH"], 5: ["MWF"],
    6: ["SAT", "SAT-SUN"], 0: ["SUN", "SAT-SUN"],
  };
  return todayMap[d]?.includes(s.day) ?? false;
};

const getDisplayStatus = (s: Schedule): Schedule["status"] => {
  if (s.status === "Present" || s.status === "Attended" ||
      s.status === "Excused" || s.status === "Absent") return s.status;
  if (!isTodaySchedule(s)) return s.status;
  if ((s.status === "Upcoming" || s.status === "Ongoing") && isTimeUp(s.end_time)) return "Absent";
  if (s.status === "Upcoming" && isTimeStarted(s.time) && !isTimeUp(s.end_time)) return "Ongoing";
  return s.status;
};

export default function SchedulesTab() {
  const [schedules, setSchedules]               = useState<Schedule[]>([]);
  const [devices, setDevices]                   = useState<Device[]>([]);
  const [instructors, setInstructors]           = useState<Instructor[]>([]);
  const [subjects, setSubjects]                 = useState<Subject[]>([]);
  const [events, setEvents]                     = useState<Event[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [showModal, setShowModal]               = useState(false);
  const [editing, setEditing]                   = useState<Schedule | null>(null);
  const [search, setSearch]                     = useState("");
  const [dayFilter, setDayFilter]               = useState("");
  const [statusFilter, setStatusFilter]         = useState("");
  const [view, setView]                         = useState<"cards" | "table">("cards");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [lastUpdated, setLastUpdated]           = useState<Date>(new Date());
  const [fetchError, setFetchError]             = useState<string | null>(null);
  const [now, setNow]                           = useState(new Date());

  const reportedOngoing = React.useRef<Set<number>>(new Set());

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

  const handleMarkAbsent = async (s: Schedule) => {
    if (!confirm(`Mark ${s.name} absent for ${s.subject}?`)) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post("/admin/attendance-logs/mark-absent-manual", {
        instructor_id: s.instructor_id,
        schedule_id:   s.id,
        room:          s.room         ?? null,
        subject:       s.subject      ?? null,
        code:          s.subject_code ?? null,
        day:           s.day          ?? null,
        time_in:       null,
        time_out:      s.end_time     ?? null,
        date:          today,
        status:        "Absent",
      });
      fetchAll(true);
    } catch (err: any) {
      alert("Failed to mark absent.");
    }
  };

  const defaultForm = (devs: Device[]): ScheduleForm => {
    const onlineDevice = devs.find(d => d.status === "online") ?? devs[0];
    return {
      instructor_id: "",
      name:          "",
      subject:       "",
      subject_code:  "",
      time:          "",
      end_time:      "",
      day:           "MWF",
      status:        "Upcoming",
      room:          onlineDevice?.name ?? "",
      device_id:     onlineDevice?.id?.toString() ?? "",
    };
  };

  const [form, setForm] = useState<ScheduleForm>(() => defaultForm([]));
  const pairedDevices = devices.filter(d => d.paired);

  const fetchAll = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else { setLoading(true); reportedOngoing.current.clear(); }
    setFetchError(null);
    try {
      const results = await Promise.allSettled([
        api.get("/admin/schedules"),
        api.get("/devices"),
        api.get("/admin/instructors"),
        api.get("/admin/subjects"),
        api.get("/admin/events"),
      ]);

      if (results[0].status === "fulfilled") {
        const s = Array.isArray(results[0].value.data) ? results[0].value.data : results[0].value.data?.data ?? [];
        setSchedules(s);
      } else setSchedules([]);

      if (results[1].status === "fulfilled") {
        const d: Device[] = Array.isArray(results[1].value.data) ? results[1].value.data : results[1].value.data?.data ?? [];
        setDevices(d);
      } else setDevices([]);

      if (results[2].status === "fulfilled") {
        const instr: Instructor[] = Array.isArray(results[2].value.data) ? results[2].value.data : results[2].value.data?.data ?? [];
        setInstructors(instr.sort((a, b) => a.name.localeCompare(b.name)));
      } else setInstructors([]);

      if (results[3].status === "fulfilled") {
        const res = results[3].value;
        const subs: Subject[] = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.subjects ?? [];
        setSubjects(subs);
      } else setSubjects([]);

      if (results[4].status === "fulfilled") {
        const res = results[4].value;
        let evts: Event[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        evts = evts.map(event => {
          const start = new Date(event.date);      start.setHours(0, 0, 0, 0);
          const end   = new Date(event.date_ends); end.setHours(0, 0, 0, 0);
          const calculatedStatus: "Upcoming" | "Ongoing" | "Completed" =
            today > end ? "Completed" : today >= start ? "Ongoing" : "Upcoming";
          return { ...event, status: calculatedStatus };
        });
        setEvents(evts);
      } else setEvents([]);

      setForm(defaultForm(devices.filter(d => d.paired)));
      setLastUpdated(new Date());
    } catch (err) {
      setFetchError("Failed to load data. Please try refreshing.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) { setFetchError("Loading is taking too long."); setLoading(false); }
    }, 15000);
    fetchAll();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  const resetForm = () => { setForm(defaultForm(pairedDevices)); setEditing(null); setShowModal(false); };

  const handleSubjectChange = (subjectCode: string) => {
    const selected = subjects.find(s => s.subject_code === subjectCode);
    if (selected) setForm({ ...form, subject_code: selected.subject_code, subject: selected.subject });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.end_time && form.end_time <= form.time) return alert("End time must be after start time.");
    const payload: any = { ...form };
    if (!payload.end_time) delete payload.end_time;
    if (!payload.device_id) delete payload.device_id;
    else payload.device_id = parseInt(payload.device_id);
    if (!payload.room && payload.device_id) {
      const dev = pairedDevices.find(d => d.id === payload.device_id);
      if (dev) payload.room = dev.name;
    }
    try {
      setLoading(true);
      if (editing) await api.put(`/admin/schedules/${editing.id}`, payload);
      else         await api.post("/admin/schedules", payload);
      await fetchAll();
      resetForm();
    } catch { alert("Failed to save schedule."); }
    finally { setLoading(false); }
  };

  const handleEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      instructor_id: s.instructor_id ?? "",
      name:          s.name          ?? "",
      subject:       s.subject       ?? "",
      subject_code:  s.subject_code  ?? "",
      time:          s.time          ?? "",
      end_time:      s.end_time      ?? "",
      day:           s.day           ?? "MWF",
      status:        s.status        ?? "Upcoming",
      room:          s.room          ?? "",
      device_id:     s.device_id?.toString() ?? "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schedule?")) return;
    try { await api.delete(`/admin/schedules/${id}`); fetchAll(); }
    catch { alert("Failed to delete."); }
  };

  const getTodayCode = () => {
    const d = new Date().getDay();
    if (d === 1 || d === 3 || d === 5) return "MWF";
    if (d === 2 || d === 4)            return "TTH";
    if (d === 6)                       return "SAT";
    if (d === 0)                       return "SUN";
    return "";
  };
  const todayCode = getTodayCode();

  const departments = [...new Set(subjects.map(s => s.department))].sort();

  const filtered = schedules.filter(s => {
    const q           = search.toLowerCase();
    const matchSearch = !search ||
      s.name.toLowerCase().includes(q) ||
      s.instructor_id.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.subject_code.toLowerCase().includes(q);
    const subjectDept   = subjects.find(sub => sub.subject_code === s.subject_code)?.department;
    const displayStatus = getDisplayStatus(s);
    return matchSearch &&
      (!dayFilter        || s.day         === dayFilter) &&
      (!statusFilter     || displayStatus  === statusFilter) &&
      (!departmentFilter || subjectDept    === departmentFilter);
  });

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem", border: "1px solid #e5e7eb",
    borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 600,
    color: "#6b7280", textTransform: "uppercase",
    letterSpacing: "0.05em", marginBottom: "0.375rem",
  };

  const subjectsByDepartment = subjects.reduce((acc, subject) => {
    if (!acc[subject.department]) acc[subject.department] = [];
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  // ── Device Card ───────────────────────────────────────────────
  const DeviceCard = ({ device }: { device: Device }) => {
    const [excusing, setExcusing] = useState(false);

    const hasOngoingEvent = events.some(e => e.status === "Ongoing");

    const handleExcuseAll = async () => {
      if (!confirm(`Excuse all today's schedules for ${device.name}?`)) return;
      setExcusing(true);
      try {
        const res = await api.post("/admin/schedules/excuse-all-today", { device_id: device.id });
        alert(res.data.message);
        fetchAll(true);
      } catch (err: any) {
        alert(err.response?.data?.message ?? "Failed to excuse schedules.");
      } finally {
        setExcusing(false);
      }
    };

    const deviceSchedules = schedules.filter(s => s.device_id === device.id);
    const todaySchedules  = deviceSchedules.filter(s => s.day === todayCode || s.day === "SAT-SUN");

    const activeNow = todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing");
    const present   = todaySchedules.filter(s => getDisplayStatus(s) === "Present");
    const attended  = todaySchedules.filter(s => getDisplayStatus(s) === "Attended");
    const absent    = todaySchedules.filter(s => getDisplayStatus(s) === "Absent");

    const recentAttendance = [...deviceSchedules]
      .filter(s => ["Attended", "Present", "Excused"].includes(s.status))
      .sort((a, b) => {
        const dateA = a.scanned_at ? new Date(a.scanned_at).getTime() : 0;
        const dateB = b.scanned_at ? new Date(b.scanned_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    return (
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", flex: 1, minWidth: "300px" }}>

        {/* Card Header */}
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: device.status === "online" ? "#4ade80" : "#94a3b8", boxShadow: device.status === "online" ? "0 0 6px #4ade80" : "none" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{device.name}</h3>
            </div>
            <p style={{ color: "#c4b5fd", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {activeNow.length > 0 ? `${activeNow.length} active class` : "No active class"}
            </p>
            {device.chip_id && (
              <p style={{ color: "#a5b4fc", fontSize: "0.65rem", fontFamily: "monospace", marginTop: "0.125rem" }}>
                {device.chip_id}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700 }}>{todaySchedules.length}</div>
            <div style={{ color: "#c4b5fd", fontSize: "0.7rem" }}>today</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid #f3f4f6" }}>
          {[
            { label: "Total",    value: deviceSchedules.length, color: "#6366f1" },
            { label: "Today",    value: todaySchedules.length,  color: "#f59e0b" },
            { label: "Present",  value: present.length,         color: "#22c55e" },
            { label: "Attended", value: attended.length,        color: "#a855f7" },
            { label: "Absent",   value: absent.length,          color: "#ef4444" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "0.875rem", textAlign: "center", borderRight: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Ongoing Event Banner ── */}
        {hasOngoingEvent && (
          <div style={{ background: "#fff3cd", padding: "0.625rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ffeeba" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.9rem" }}>📅</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#856404" }}>
                Event ongoing today
              </span>
            </div>
            <button
              onClick={handleExcuseAll}
              disabled={excusing}
              style={{
                background: excusing ? "#d1d5db" : "#856404",
                color: "#fff", border: "none",
                padding: "0.3rem 0.875rem",
                borderRadius: "0.375rem",
                fontSize: "0.72rem", fontWeight: 600,
                cursor: excusing ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              {excusing ? (
                <>
                  <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Excusing...
                </>
              ) : "📝 Excuse All Today"}
            </button>
          </div>
        )}

        {/* Today's Schedules */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Schedule</p>
            <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          {todaySchedules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>No classes today</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: "280px", overflowY: "auto" }}>
              {todaySchedules.map(s => {
                const displayStatus = getDisplayStatus(s);
                return (
                  <div key={s.id} style={{
                    padding: "0.75rem", borderRadius: "0.5rem",
                    background:
                      displayStatus === "Present"  ? "#f0fdf4" :
                      displayStatus === "Attended" ? "#f3e8ff" :
                      displayStatus === "Absent"   ? "#fef2f2" :
                      displayStatus === "Excused"  ? "#fff3cd" :
                      displayStatus === "Ongoing"  ? "#fefce8" : "#f9fafb",
                    border: `1px solid ${
                      displayStatus === "Present"  ? "#bbf7d0" :
                      displayStatus === "Attended" ? "#d8b4fe" :
                      displayStatus === "Absent"   ? "#fecaca" :
                      displayStatus === "Excused"  ? "#ffeeba" :
                      displayStatus === "Ongoing"  ? "#fde68a" : "#f3f4f6"
                    }`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1f2937" }}>{s.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem" }}>{s.subject}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                          <svg width="12" height="12" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{s.time}{s.end_time ? ` – ${s.end_time}` : ""}</span>
                        </div>
                        {s.scanned_at && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                            <svg width="12" height="12" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
                        {(displayStatus === "Upcoming" || displayStatus === "Ongoing") && (
                          <button
                            onClick={() => handleMarkAbsent(s)}
                            style={{
                              background: "#fee2e2", border: "1px solid #fecaca",
                              cursor: "pointer", color: "#dc2626",
                              fontSize: "0.6rem", fontWeight: 600,
                              padding: "0.125rem 0.5rem", borderRadius: "0.375rem",
                              marginTop: "0.125rem",
                            }}
                          >
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

        {/* Recent Attendance */}
        <div style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Attendance</p>
            <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Last 5 records</span>
          </div>
          {recentAttendance.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.8rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
              No attendance records yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentAttendance.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "#f9fafb", borderRadius: "0.5rem", border: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: s.status === "Attended" ? "#a855f7" :
                                  s.status === "Excused"  ? "#856404" : "#22c55e",
                    }} />
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.75rem", color: "#1f2937" }}>{s.name}</p>
                      <p style={{ fontSize: "0.65rem", color: "#6b7280" }}>{s.subject}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: s.status === "Attended" ? "#a855f7" : s.status === "Excused" ? "#856404" : "#22c55e" }}>
                      {s.status}
                    </span>
                    {s.scanned_at && (
                      <p style={{ fontSize: "0.6rem", color: "#9ca3af", marginTop: "0.1rem" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "black" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}>Schedule Management</h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>
            {pairedDevices.length} device{pairedDevices.length !== 1 ? "s" : ""} paired · {subjects.length} subjects
          </p>
          <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>Last updated: {lastUpdated.toLocaleTimeString()}</p>
          {fetchError && (
            <p style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.5rem", background: "#fee2e2", padding: "0.5rem", borderRadius: "0.5rem" }}>⚠️ {fetchError}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            style={{ background: refreshing ? "#c7d2fe" : "#fff", color: refreshing ? "#9ca3af" : "#4f46e5", border: "1px solid #e5e7eb", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
            {(["cards", "table"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "0.375rem 0.75rem", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, background: view === v ? "#4f46e5" : "#fff", color: view === v ? "#fff" : "#6b7280" }}>
                {v === "cards" ? "📡 Devices" : "📋 Table"}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setForm(defaultForm(pairedDevices)); setShowModal(true); }}
            disabled={pairedDevices.length === 0}
            style={{ background: pairedDevices.length === 0 ? "#c7d2fe" : "#4f46e5", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: pairedDevices.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            onMouseEnter={e => pairedDevices.length > 0 && (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={e => pairedDevices.length > 0 && (e.currentTarget.style.background = "#4f46e5")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#9ca3af" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading schedules...
        </div>
      )}

      {!loading && (
        <>
          {pairedDevices.length === 0 && view === "cards" && (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: "1rem", border: "1px dashed #e5e7eb" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📡</div>
              <p style={{ fontWeight: 600, color: "#1f2937" }}>No paired devices</p>
              <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.375rem" }}>Go to the Devices tab and pair an ESP32 scanner first.</p>
            </div>
          )}

          {view === "cards" && pairedDevices.length > 0 && (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {pairedDevices.map(device => <DeviceCard key={device.id} device={device} />)}
            </div>
          )}

          {view === "table" && (
            <>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input type="text" placeholder="Search by name, ID, subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "180px" }} />
                <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Days</option>
                  {["MWF", "TTH", "SAT", "SUN", "SAT-SUN"].map(d => <option key={d}>{d}</option>)}
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
              <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                {filtered.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                          {["#", "Device", "Instructor ID", "Name", "Subject", "Code", "Dept", "Time", "Day", "Attendance", "Status", "Actions"].map(h => (
                            <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s, idx) => {
                          const dev           = devices.find(d => d.id === s.device_id);
                          const subjectDept   = subjects.find(sub => sub.subject_code === s.subject_code)?.department || "—";
                          const displayStatus = getDisplayStatus(s);
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <td style={{ padding: "0.875rem 1.25rem", color: "#9ca3af", fontSize: "0.75rem" }}>{idx + 1}</td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dev?.status === "online" ? "#22c55e" : "#d1d5db", display: "inline-block" }} />
                                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#374151" }}>{dev?.name ?? s.room ?? "—"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#4f46e5", fontWeight: 500 }}>{s.instructor_id}</td>
                              <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap" }}>{s.name}</td>
                              <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280" }}>{s.subject}</td>
                              <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#6b7280" }}>{s.subject_code}</td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{ background: "#eef2ff", color: "#4f46e5", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600 }}>{subjectDept}</span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280", whiteSpace: "nowrap" }}>{s.time}{s.end_time ? ` – ${s.end_time}` : ""}</td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: dayColors[s.day]?.bg, color: dayColors[s.day]?.color }}>{s.day}</span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                {(displayStatus === "Present" || displayStatus === "Attended" || displayStatus === "Absent" || displayStatus === "Excused") && (
                                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500,
                                    background: (displayStatus === "Present" || displayStatus === "Attended") ? "#dcfce7" : displayStatus === "Excused" ? "#fff3cd" : "#fee2e2",
                                    color: (displayStatus === "Present" || displayStatus === "Attended") ? "#15803d" : displayStatus === "Excused" ? "#856404" : "#dc2626",
                                  }}>
                                    {displayStatus === "Present" || displayStatus === "Attended" ? "✅ Present" : displayStatus === "Excused" ? "📝 Excused" : "❌ Absent"}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, background: statusColors[displayStatus]?.bg, color: statusColors[displayStatus]?.color }}>
                                  {statusEmoji[displayStatus]} {displayStatus}
                                </span>
                              </td>
                              <td style={{ padding: "0.875rem 1.25rem" }}>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                  <button onClick={() => handleEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 500, fontSize: "0.8rem" }}>Edit</button>
                                  <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 500, fontSize: "0.8rem" }}>Delete</button>
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
                    <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No schedules found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "32rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f2937" }}>{editing ? "Edit Schedule" : "Add Schedule"}</h2>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.125rem" }}>Fill in the instructor schedule details</p>
                </div>
                <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Assign to Device *</label>
                  {pairedDevices.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "#ef4444" }}>No paired devices available.</p>
                  ) : (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {pairedDevices.map(d => (
                        <label key={d.id} style={{ flex: 1, minWidth: "120px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.625rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, border: `2px solid ${form.device_id === d.id.toString() ? "#4338ca" : "#e5e7eb"}`, background: form.device_id === d.id.toString() ? "#e0e7ff" : "transparent", color: form.device_id === d.id.toString() ? "#4338ca" : "#6b7280" }}>
                          <input type="radio" name="device_id" value={d.id} checked={form.device_id === d.id.toString()} onChange={() => setForm({ ...form, device_id: d.id.toString() })} style={{ display: "none" }} />
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: d.status === "online" ? "#22c55e" : "#d1d5db" }} />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Instructor *</label>
                  <select value={form.instructor_id} required onChange={e => { const sel = instructors.find(i => i.instructor_id === e.target.value); setForm({ ...form, instructor_id: e.target.value, name: sel?.name ?? "" }); }} style={inputStyle}>
                    <option value="">Select Instructor</option>
                    {instructors.map(i => <option key={i.id} value={i.instructor_id}>{i.name}</option>)}
                  </select>
                </div>
                {form.instructor_id && (
                  <div>
                    <label style={labelStyle}>Instructor ID</label>
                    <input type="text" value={form.instructor_id} readOnly style={{ ...inputStyle, background: "#f9fafb", color: "#4f46e5", fontFamily: "monospace", fontWeight: 600, cursor: "default" }} />
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
                    <div>
                      <label style={labelStyle}>Subject Name</label>
                      <input type="text" value={form.subject} readOnly style={{ ...inputStyle, background: "#f9fafb", color: "#1f2937", cursor: "default" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Subject Code</label>
                      <input type="text" value={form.subject_code} readOnly style={{ ...inputStyle, background: "#f9fafb", color: "#4f46e5", fontFamily: "monospace", fontWeight: 600, cursor: "default" }} />
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Start Time *</label>
                    <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Day *</label>
                    <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value as Schedule["day"] })} style={inputStyle}>
                      <option value="MWF">MWF</option>
                      <option value="TTH">TTH</option>
                      <option value="SAT">SAT</option>
                      <option value="SUN">SUN</option>
                      <option value="SAT-SUN">SAT-SUN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Initial Status</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {(["Upcoming", "Ongoing", "Present", "Absent", "Attended", "Excused"] as const).map(s => (
                      <label key={s} style={{ flex: 1, minWidth: "80px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, border: `2px solid ${form.status === s ? statusColors[s]?.color : "#e5e7eb"}`, background: form.status === s ? statusColors[s]?.bg : "transparent", color: form.status === s ? statusColors[s]?.color : "#6b7280" }}>
                        <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} style={{ display: "none" }} />
                        {statusEmoji[s]} {s}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "0.25rem" }}>Status will be automatically evaluated based on time.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                  <button type="button" onClick={resetForm} style={{ padding: "0.5rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#6b7280" }}>Cancel</button>
                  <button type="submit" disabled={loading || pairedDevices.length === 0} style={{ padding: "0.5rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                    {editing ? "Update Schedule" : "Add Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}