// src/pages/Staff/tabs/MyScheduleTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

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
  attendance?: "Present" | "Absent";
  room: string;
  device_id?: number | null;
  scanned_at?: string | null;
}

interface Event {
  id: number;
  title: string;
  date: string;
  date_ends: string;
  start: string;
  ends?: string;
  status: "Upcoming" | "Ongoing" | "Completed";
}

interface Device {
  id: number;
  name: string;
  paired: boolean;
}

const dayOrder = ["MWF", "TTH", "SAT", "SUN", "SAT-SUN"];

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
  Upcoming: "🔵", Ongoing: "🟡", Present: "🟢",
  Absent: "🔴", Attended: "🟣", Excused: "📝",
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

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", overflow: "hidden",
};

export default function MyScheduleTab() {
  const [schedules, setSchedules]           = useState<Schedule[]>([]);
  const [events, setEvents]                 = useState<Event[]>([]);
  const [devices, setDevices]               = useState<Device[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [now, setNow]                       = useState(new Date());
  const [excusingDevice, setExcusingDevice] = useState<number | null>(null);
  const [markingAllAbsent, setMarkingAllAbsent] = useState(false);

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
    ongoingSchedules.forEach(async s => {
      reportedOngoing.current.add(s.id);
      try {
        await api.post("/admin/schedules/set-ongoing", { schedule_id: s.id });
        fetchAll(true);
      } catch { reportedOngoing.current.delete(s.id); }
    });
  }, [schedules, now]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [schedRes, eventsRes, devRes] = await Promise.allSettled([
        api.get("/admin/schedules"),
        api.get("/admin/events"),
        api.get("/devices"),
      ]);
      if (schedRes.status === "fulfilled") {
        const data: Schedule[] = Array.isArray(schedRes.value.data)
          ? schedRes.value.data : schedRes.value.data?.data ?? [];
        setSchedules(data);
      }
      if (eventsRes.status === "fulfilled") {
        let evts: Event[] = Array.isArray(eventsRes.value.data)
          ? eventsRes.value.data : eventsRes.value.data?.data ?? [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        evts = evts.map(e => {
          const start = new Date(e.date); start.setHours(0, 0, 0, 0);
          const end   = new Date(e.date_ends); end.setHours(0, 0, 0, 0);
          const status: "Upcoming" | "Ongoing" | "Completed" =
            today > end ? "Completed" : today >= start ? "Ongoing" : "Upcoming";
          return { ...e, status };
        });
        setEvents(evts);
      }
      if (devRes.status === "fulfilled") {
        const d: Device[] = Array.isArray(devRes.value.data)
          ? devRes.value.data : devRes.value.data?.data ?? [];
        setDevices(d.filter(dev => dev.paired));
      }
    } catch {}
    finally { if (!silent) setLoading(false); }
  };

  // Mark single schedule absent
  const handleMarkAbsent = async (s: Schedule) => {
    if (!confirm(`Mark ${s.name} absent for ${s.subject}?`)) return;
    try {
      await api.post("/admin/attendance-logs/mark-absent-manual", {
        instructor_id: s.instructor_id,
        schedule_id:   s.id,
        room:          s.room         ?? null,
        subject:       s.subject      ?? null,
        code:          s.subject_code ?? null,
        day:           s.day          ?? null,
        time_in:       null,
        time_out:      s.end_time     ?? null,
        date:          new Date().toISOString().split("T")[0],
        status:        "Absent",
      });
      fetchAll(true);
    } catch { alert("Failed to mark absent."); }
  };

  // Mark ALL today's non-terminal schedules as absent
  const handleMarkAllAbsent = async () => {
    const todayCode = getTodayCode();
    const targets = schedules.filter(s => {
      if (!(s.day === todayCode || s.day === "SAT-SUN")) return false;
      const ds = getDisplayStatus(s);
      // Include Upcoming, Ongoing, and time-based Absent (status still Upcoming in DB)
      return ds === "Upcoming" || ds === "Ongoing" || ds === "Absent";
    });

    if (targets.length === 0) return alert("No schedules to mark absent.");
    if (!confirm(`Mark ${targets.length} schedule(s) as Absent?`)) return;

    setMarkingAllAbsent(true);
    const today = new Date().toISOString().split("T")[0];
    let success = 0;

    await Promise.allSettled(targets.map(async s => {
      try {
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
        success++;
      } catch {}
    }));

    setMarkingAllAbsent(false);
    alert(`Marked ${success} of ${targets.length} schedule(s) as Absent.`);
    fetchAll(true);
  };

  // Excuse all today regardless of device (for NULL device schedules)
const handleExcuseAll = async () => {
  if (!confirm("Excuse all today's schedules?")) return;
  setExcusingDevice(-1); // -1 = loading state for no-device
  try {
    // Call for each device + one for NULL
    const calls = [
      ...devices.map(dev =>
        api.post("/admin/schedules/excuse-all-today", { device_id: dev.id })
      ),
    ];
    await Promise.allSettled(calls);
    alert("All today's schedules excused.");
    fetchAll(true);
  } catch (err: any) {
    alert("Failed to excuse some schedules.");
  } finally { setExcusingDevice(null); }
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
  const hasOngoingEvent = events.some(e => e.status === "Ongoing");

  const filtered = schedules.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
           s.subject.toLowerCase().includes(q) ||
           s.instructor_id.toLowerCase().includes(q) ||
           s.room?.toLowerCase().includes(q);
  });

  const grouped = dayOrder.reduce((acc, day) => {
    const ds = filtered.filter(s => s.day === day);
    if (ds.length > 0) acc[day] = ds;
    return acc;
  }, {} as Record<string, Schedule[]>);

  const todaySchedules = schedules.filter(s => s.day === todayCode || s.day === "SAT-SUN");
  const todayPresent   = todaySchedules.filter(s => { const ds = getDisplayStatus(s); return ds === "Present" || ds === "Attended"; }).length;
  const todayAbsent    = todaySchedules.filter(s => getDisplayStatus(s) === "Absent").length;
  const todayOngoing   = todaySchedules.filter(s => getDisplayStatus(s) === "Ongoing").length;
  const todayExcused   = todaySchedules.filter(s => getDisplayStatus(s) === "Excused").length;

  // Schedules that can be marked absent (Upcoming, Ongoing, or time-based Absent)
  const absentableCount = todaySchedules.filter(s => {
    const ds = getDisplayStatus(s);
    return ds === "Upcoming" || ds === "Ongoing" || ds === "Absent";
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "black" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}>Instructor Schedules</h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>
            {schedules.length} total · statuses update in real-time
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>

          {/* ── Mark All Absent button ── */}
          {absentableCount > 0 && (
            <button
              onClick={handleMarkAllAbsent}
              disabled={markingAllAbsent}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.5rem 0.875rem",
                background: markingAllAbsent ? "#f3f4f6" : "#fee2e2",
                border: "1px solid #fecaca", borderRadius: "0.5rem",
                color: "#dc2626", fontSize: "0.8rem", fontWeight: 600,
                cursor: markingAllAbsent ? "not-allowed" : "pointer",
              }}
            >
              {markingAllAbsent ? (
                <>
                  <div style={{ width: "0.75rem", height: "0.75rem", border: "2px solid #dc2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Marking...
                </>
              ) : `❌ Mark All Absent (${absentableCount})`}
            </button>
          )}

          <input type="text" placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "0.5rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none", minWidth: "180px" }} />
          <button onClick={() => fetchAll()}
            style={{ padding: "0.5rem 0.875rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Ongoing event banner */}
      {hasOngoingEvent && devices.length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "0.875rem", padding: "0.875rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
            <span>📅</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#856404" }}>Event ongoing today — excuse schedules by device:</span>
          </div>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            {devices.map(dev => (
              <button onClick={handleExcuseAll}
  disabled={excusingDevice !== null}
  style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.375rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
  📝 Excuse All Devices
</button>
            ))}
          </div>
        </div>
      )}

      {/* Today summary */}
      {todaySchedules.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: "0.875rem", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p style={{ color: "#c4b5fd", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Today's Overview</p>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem" }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            {[
              { label: "Total",   value: todaySchedules.length, color: "#fff" },
              { label: "Ongoing", value: todayOngoing,          color: "#fde68a" },
              { label: "Present", value: todayPresent,          color: "#4ade80" },
              { label: "Absent",  value: todayAbsent,           color: "#f87171" },
              { label: "Excused", value: todayExcused,          color: "#fcd34d" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.375rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "0.65rem", color: "#a5b4fc", marginTop: "0.2rem" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "3rem", color: "#9ca3af" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading schedules...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ ...card, padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          <p>No schedules found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, daySchedules]) => {
          const isToday = day === todayCode;
          return (
            <div key={day} style={card}>
              <div style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: isToday ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ padding: "0.25rem 0.875rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 700, background: isToday ? "rgba(255,255,255,0.2)" : dayColors[day]?.bg, color: isToday ? "#fff" : dayColors[day]?.color }}>
                    {day}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isToday ? "#e0e7ff" : "#6b7280" }}>
                    {daySchedules.length} class{daySchedules.length !== 1 ? "es" : ""}{isToday && " · Today"}
                  </span>
                </div>
                {isToday && (
                  <span style={{ fontSize: "0.7rem", color: "#c4b5fd", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                    🕐 {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </span>
                )}
              </div>

              <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {daySchedules.map(s => {
                  const displayStatus = getDisplayStatus(s);
                  // Show Mark Absent button for: Upcoming, Ongoing, AND time-based Absent
                  const canMarkAbsent = displayStatus === "Upcoming" || displayStatus === "Ongoing" || displayStatus === "Absent";

                  return (
                    <div key={s.id} style={{
                      padding: "0.875rem 1rem", borderRadius: "0.625rem",
                      background:
                        displayStatus === "Present"  ? "#f0fdf4" :
                        displayStatus === "Attended" ? "#f3e8ff" :
                        displayStatus === "Absent"   ? "#fef2f2" :
                        displayStatus === "Excused"  ? "#fffbeb" :
                        displayStatus === "Ongoing"  ? "#fefce8" : "#f9fafb",
                      border: `1px solid ${
                        displayStatus === "Present"  ? "#bbf7d0" :
                        displayStatus === "Attended" ? "#d8b4fe" :
                        displayStatus === "Absent"   ? "#fecaca" :
                        displayStatus === "Excused"  ? "#fde68a" :
                        displayStatus === "Ongoing"  ? "#fde68a" : "#f3f4f6"
                      }`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1f2937" }}>{s.name}</p>
                            <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#a5b4fc" }}>{s.instructor_id}</span>
                          </div>
                          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.1rem" }}>
                            {s.subject}
                            {s.subject_code && <span style={{ fontFamily: "monospace", marginLeft: "0.4rem", color: "#9ca3af", fontSize: "0.75rem" }}>({s.subject_code})</span>}
                          </p>
                          <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {s.time}{s.end_time ? ` – ${s.end_time}` : ""}
                            </span>
                            {s.room && (
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {s.room}
                              </span>
                            )}
                          </div>
                          {s.scanned_at && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.375rem" }}>
                              <svg width="11" height="11" fill="none" stroke="#22c55e" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span style={{ fontSize: "0.68rem", color: "#22c55e", fontWeight: 600 }}>
                                Scanned at {new Date(s.scanned_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                          {(displayStatus === "Present" || displayStatus === "Attended" ||
                            displayStatus === "Absent"  || displayStatus === "Excused") && (
                            <span style={{
                              fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: "9999px",
                              background: (displayStatus === "Present" || displayStatus === "Attended") ? "#dcfce7" :
                                          displayStatus === "Excused" ? "#fff3cd" : "#fee2e2",
                              color:      (displayStatus === "Present" || displayStatus === "Attended") ? "#15803d" :
                                          displayStatus === "Excused" ? "#856404" : "#dc2626",
                            }}>
                              {displayStatus === "Present" || displayStatus === "Attended" ? "✅ Present" :
                               displayStatus === "Excused" ? "📝 Excused" : "❌ Absent"}
                            </span>
                          )}
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.6rem", borderRadius: "9999px",
                            background: statusColors[displayStatus]?.bg ?? "#f3f4f6",
                            color: statusColors[displayStatus]?.color ?? "#6b7280",
                          }}>
                            {statusEmoji[displayStatus]} {displayStatus}
                          </span>

                          {/* Mark Absent — shows for Upcoming, Ongoing AND Absent */}
                          {canMarkAbsent && isTodaySchedule(s) && (
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
            </div>
          );
        })
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}