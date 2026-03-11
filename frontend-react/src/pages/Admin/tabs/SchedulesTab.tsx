// src/pages/Admin/tabs/SchedulesTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface Schedule {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  subject_code: string;
  time: string;
  end_time?: string;
  day: "MWF" | "TTH" | "SAT" | "SUN" | "SAT-SUN";
  status: "Upcoming" | "Ongoing" | "Present" | "Absent" | "Attended";
  room: string;
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
}

const defaultForm: ScheduleForm = {
  instructor_id: "",
  name: "",
  subject: "",
  subject_code: "",
  time: "",
  end_time: "",
  day: "MWF",
  status: "Upcoming",
  room: "CL01",
};

const dayColors: Record<string, { bg: string; color: string }> = {
  MWF:     { bg: "#e0e7ff", color: "#4338ca" },
  TTH:     { bg: "#f3e8ff", color: "#7e22ce" },
  SAT:     { bg: "#ffedd5", color: "#c2410c" },
  SUN:     { bg: "#fee2e2", color: "#dc2626" },
  "SAT-SUN": { bg: "#fce7f3", color: "#be185d" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
};

const statusEmoji: Record<string, string> = {
  Upcoming: "🔵",
  Ongoing:  "🟡",
  Present:  "🟢",
  Absent:   "🔴",
  Attended: "🟣",
};

const ROOMS = ["CL01", "CL02"];

export default function SchedulesTab() {
  const [schedules, setSchedules]     = useState<Schedule[]>([]);
  const [loading, setLoading]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Schedule | null>(null);
  const [form, setForm]               = useState<ScheduleForm>(defaultForm);
  const [search, setSearch]           = useState("");
  const [dayFilter, setDayFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView]               = useState<"cards" | "table">("cards");

  const fetchSchedules = async () => {
    setLoading(true);
    api.get("/admin/schedules")
      .then(res => setSchedules(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditing(null);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.end_time && form.end_time <= form.time) {
      return alert("End time must be after start time.");
    }
    const payload: Partial<ScheduleForm> = { ...form };
    if (!payload.end_time) delete payload.end_time;
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/admin/schedules/${editing.id}`, payload);
      } else {
        await api.post("/admin/schedules", payload);
      }
      await fetchSchedules();
      resetForm();
      alert(editing ? "Schedule updated!" : "Schedule created!");
    } catch {
      alert("Failed to save schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      instructor_id: s.instructor_id,
      name:          s.name,
      subject:       s.subject,
      subject_code:  s.subject_code,
      time:          s.time,
      end_time:      s.end_time || "",
      day:           s.day,
      status:        s.status,
      room:          s.room || "CL01",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await api.delete(`/admin/schedules/${id}`);
      fetchSchedules();
    } catch {
      alert("Failed to delete.");
    }
  };

  const getTodayDayCode = () => {
    const d = new Date().getDay();
    if (d === 1 || d === 3 || d === 5) return "MWF";
    if (d === 2 || d === 4)            return "TTH";
    if (d === 6)                       return "SAT";
    if (d === 0)                       return "SUN";
    return "";
  };

  const todayCode = getTodayDayCode();

  const filtered = schedules.filter(s => {
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.instructor_id.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(search.toLowerCase());
    const matchDay    = dayFilter === "" || s.day === dayFilter;
    const matchStatus = statusFilter === "" || s.status === statusFilter;
    return matchSearch && matchDay && matchStatus;
  });

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
  };

  // ── Room Card ────────────────────────────────────────────────────
  const RoomCard = ({ room }: { room: string }) => {
    const roomSchedules  = schedules.filter(s => s.room === room);
    const todaySchedules = roomSchedules.filter(s => s.day === todayCode || s.day === "SAT-SUN");
    const activeNow      = todaySchedules.filter(s => s.status === "Ongoing" || s.status === "Present");
    const scanned        = todaySchedules.filter(s => s.status === "Present");

    return (
      <div style={{
        background: "#fff", borderRadius: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        overflow: "hidden", flex: 1, minWidth: "300px",
      }}>
        {/* Card Header */}
        <div style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          padding: "1.25rem 1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: activeNow.length > 0 ? "#4ade80" : "#94a3b8", boxShadow: activeNow.length > 0 ? "0 0 6px #4ade80" : "none" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>{room}</h3>
            </div>
            <p style={{ color: "#c4b5fd", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {activeNow.length > 0 ? `${activeNow.length} active class` : "No active class"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700 }}>{todaySchedules.length}</div>
            <div style={{ color: "#c4b5fd", fontSize: "0.7rem" }}>today</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f3f4f6" }}>
          {[
            { label: "Total",   value: roomSchedules.length,  color: "#6366f1" },
            { label: "Today",   value: todaySchedules.length, color: "#f59e0b" },
            { label: "Scanned", value: scanned.length,        color: "#22c55e" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "0.875rem", textAlign: "center", borderRight: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Today's Schedules */}
        <div style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Today's Schedule
            </p>
            <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>

          {todaySchedules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#9ca3af", fontSize: "0.8rem" }}>
              No classes today
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: "280px", overflowY: "auto" }}>
              {todaySchedules.map(s => (
                <div key={s.id} style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: s.status === "Present" ? "#f0fdf4" : s.status === "Absent" ? "#fef2f2" : s.status === "Ongoing" ? "#fefce8" : "#f9fafb",
                  border: `1px solid ${s.status === "Present" ? "#bbf7d0" : s.status === "Absent" ? "#fecaca" : s.status === "Ongoing" ? "#fde68a" : "#f3f4f6"}`,
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
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 600, padding: "0.125rem 0.5rem",
                        borderRadius: "9999px",
                        background: statusColors[s.status]?.bg,
                        color: statusColors[s.status]?.color,
                      }}>
                        {statusEmoji[s.status]} {s.status}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "0.7rem", fontWeight: 500 }}>Edit</button>
                        <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.7rem", fontWeight: 500 }}>Del</button>
                      </div>
                    </div>
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
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>Manage instructor class schedules by room</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* View Toggle */}
          <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
            {(["cards", "table"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "0.375rem 0.75rem", border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 500,
                background: view === v ? "#4f46e5" : "#fff",
                color: view === v ? "#fff" : "#6b7280",
              }}>
                {v === "cards" ? "🏫 Rooms" : "📋 Table"}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setForm(defaultForm); setShowModal(true); }}
            style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f46e5")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#9ca3af" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading schedules...
        </div>
      )}

      {!loading && (
        <>
          {/* ── CARDS VIEW ── */}
          {view === "cards" && (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {ROOMS.map(room => <RoomCard key={room} room={room} />)}
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {view === "table" && (
            <>
              {/* Filters */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search by name, ID, subject, or code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: "180px" }}
                />
                <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Days</option>
                  {["MWF", "TTH", "SAT", "SUN", "SAT-SUN"].map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="">All Status</option>
                  {["Upcoming", "Ongoing", "Present", "Absent", "Attended"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                {filtered.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                          {["#", "Room", "Instructor ID", "Name", "Subject", "Code", "Time", "Day", "Status", "Actions"].map(h => (
                            <th key={h} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s, idx) => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "0.875rem 1.25rem", color: "#9ca3af", fontSize: "0.75rem" }}>{idx + 1}</td>
                            <td style={{ padding: "0.875rem 1.25rem" }}>
                              <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, background: s.room === "CL01" ? "#e0e7ff" : "#fce7f3", color: s.room === "CL01" ? "#4338ca" : "#be185d" }}>
                                {s.room}
                              </span>
                            </td>
                            <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#4f46e5", fontWeight: 500 }}>{s.instructor_id}</td>
                            <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap" }}>{s.name}</td>
                            <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280" }}>{s.subject}</td>
                            <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#6b7280" }}>{s.subject_code}</td>
                            <td style={{ padding: "0.875rem 1.25rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                              {s.time}{s.end_time ? ` – ${s.end_time}` : ""}
                            </td>
                            <td style={{ padding: "0.875rem 1.25rem" }}>
                              <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: dayColors[s.day]?.bg, color: dayColors[s.day]?.color }}>
                                {s.day}
                              </span>
                            </td>
                            <td style={{ padding: "0.875rem 1.25rem" }}>
                              <span style={{ padding: "0.125rem 0.625rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 500, background: statusColors[s.status]?.bg, color: statusColors[s.status]?.color }}>
                                {statusEmoji[s.status]} {s.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.875rem 1.25rem" }}>
                              <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button onClick={() => handleEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 500, fontSize: "0.8rem" }}>Edit</button>
                                <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 500, fontSize: "0.8rem" }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

      {/* ── MODAL ── */}
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

                {/* Room */}
                <div>
                  <label style={labelStyle}>Room *</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {ROOMS.map(r => (
                      <label key={r} style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "0.4rem", padding: "0.625rem", borderRadius: "0.5rem", cursor: "pointer",
                        fontSize: "0.875rem", fontWeight: 600,
                        border: `2px solid ${form.room === r ? (r === "CL01" ? "#4338ca" : "#be185d") : "#e5e7eb"}`,
                        background: form.room === r ? (r === "CL01" ? "#e0e7ff" : "#fce7f3") : "transparent",
                        color: form.room === r ? (r === "CL01" ? "#4338ca" : "#be185d") : "#6b7280",
                      }}>
                        <input type="radio" name="room" value={r} checked={form.room === r} onChange={() => setForm({ ...form, room: r })} style={{ display: "none" }} />
                        🏫 {r}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Instructor ID *</label>
                  <input type="text" value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="e.g., 11-2223-333" required />
                </div>

                <div>
                  <label style={labelStyle}>Instructor Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g., Dr. Maria Santos" required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Subject *</label>
                    <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle} placeholder="e.g., Programming" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Subject Code *</label>
                    <input type="text" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="e.g., CS101" required />
                  </div>
                </div>

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

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status *</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {(["Upcoming", "Ongoing", "Present", "Absent", "Attended"] as const).map(s => (
                      <label key={s} style={{
                        flex: 1, minWidth: "80px", display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "0.3rem", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: 500,
                        border: `2px solid ${form.status === s ? statusColors[s].color : "#e5e7eb"}`,
                        background: form.status === s ? statusColors[s].bg : "transparent",
                        color: form.status === s ? statusColors[s].color : "#6b7280",
                      }}>
                        <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} style={{ display: "none" }} />
                        {statusEmoji[s]} {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                  <button type="button" onClick={resetForm} style={{ padding: "0.5rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "none", fontSize: "0.875rem", cursor: "pointer", color: "#6b7280" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} style={{ padding: "0.5rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
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