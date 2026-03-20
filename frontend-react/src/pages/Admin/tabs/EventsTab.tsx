// src/pages/Admin/tabs/EventsTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface Instructor {
  id: number;
  name: string;
  employee_id: string;
  instructor_id: string;
  department: string;
  role: string;
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
  instructor_id?: string;
  instructor_name?: string;
  for_all_instructors?: boolean;
}

interface EventForm {
  title: string; 
  description: string; 
  date: string; 
  end_date: string;
  time: string; 
  end_time: string; 
  location: string;
  type: Event["type"]; 
  status: Event["status"];
  instructor_id: string;
  for_all_instructors: boolean;
}

const defaultForm: EventForm = {
  title: "", 
  description: "", 
  date: "", 
  end_date: "",
  time: "", 
  end_time: "", 
  location: "",
  type: "Academic", 
  status: "Upcoming",
  instructor_id: "",
  for_all_instructors: false,
};

const typeGradients: Record<string, string> = {
  Academic: "linear-gradient(135deg, #3b82f6, #2563eb)",
  Administrative: "linear-gradient(135deg, #a855f7, #9333ea)",
  Training: "linear-gradient(135deg, #22c55e, #16a34a)",
  Social: "linear-gradient(135deg, #f97316, #ea580c)",
};

const typeColors: Record<string, { bg: string; color: string }> = {
  Academic: { bg: "#dbeafe", color: "#1d4ed8" },
  Administrative: { bg: "#f3e8ff", color: "#7e22ce" },
  Training: { bg: "#dcfce7", color: "#15803d" },
  Social: { bg: "#ffedd5", color: "#c2410c" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dcfce7", color: "#15803d" },
  Ongoing: { bg: "#fef9c3", color: "#a16207" },
  Completed: { bg: "#f3f4f6", color: "#4b5563" },
};

// Helper function to calculate status based on dates
const calculateStatus = (startDate: string, endDate: string): "Upcoming" | "Ongoing" | "Completed" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  if (today > end) {
    return "Completed";
  } else if (today >= start && today <= end) {
    return "Ongoing";
  } else {
    return "Upcoming";
  }
};

export default function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/events");
      // Auto-update status based on current date when fetching
      const eventsWithUpdatedStatus = response.data.map((event: Event) => ({
        ...event,
        status: calculateStatus(event.date, event.date_ends)
      }));
      setEvents(eventsWithUpdatedStatus);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await api.get("/admin/instructors");
      if (Array.isArray(response.data)) {
        setInstructors(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setInstructors(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch instructors:", err);
    }
  };

  useEffect(() => { 
    fetchEvents();
    fetchInstructors();
    
    // Refresh every minute to update status if needed
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => { 
    setForm(defaultForm); 
    setEditing(null); 
    setShowModal(false); 
  };

  // Auto-calculate status whenever dates change
  useEffect(() => {
    if (form.date && form.end_date) {
      const calculatedStatus = calculateStatus(form.date, form.end_date);
      setForm(prev => ({ ...prev, status: calculatedStatus }));
    }
  }, [form.date, form.end_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.date)) {
      return alert("End date must be after start date");
    }
    
    // Calculate final status before submitting
    const finalStatus = calculateStatus(form.date, form.end_date);
    
    const payload: any = {
      title: form.title, 
      description: form.description,
      date: form.date, 
      date_ends: form.end_date,
      start: form.time, 
      ends: form.end_time,
      location: form.location, 
      type: form.type, 
      status: finalStatus,
      for_all_instructors: form.for_all_instructors,
    };
    
    // Add instructor_id if not for all instructors
    if (!form.for_all_instructors && form.instructor_id) {
      payload.instructor_id = form.instructor_id;
    }
    
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/admin/events/${editing.id}`, payload);
      } else {
        await api.post("/admin/events", payload);
      }
      await fetchEvents();
      resetForm();
      alert(editing ? "Event updated!" : "Event created!");
    } catch { 
      alert("Failed to save event."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEdit = (event: Event) => {
    setEditing(event);
    setForm({ 
      title: event.title, 
      description: event.description, 
      date: event.date, 
      end_date: event.date_ends, 
      time: event.start, 
      end_time: event.ends || "", 
      location: event.location, 
      type: event.type, 
      status: event.status,
      instructor_id: event.instructor_id || "",
      for_all_instructors: event.for_all_instructors || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    try { 
      await api.delete(`/admin/events/${id}`); 
      fetchEvents(); 
    } catch { 
      alert("Failed to delete."); 
    }
  };

  const filtered = events.filter(e => {
    const matchSearch = search === "" || 
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.instructor_name && e.instructor_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchType = typeFilter === "" || e.type === typeFilter;
    const matchStatus = statusFilter === "" || e.status === statusFilter;
    
    let matchInstructor = true;
    if (instructorFilter) {
      if (instructorFilter === "all") {
        matchInstructor = e.for_all_instructors === true;
      } else {
        matchInstructor = e.instructor_id === instructorFilter;
      }
    }
    
    return matchSearch && matchType && matchStatus && matchInstructor;
  });

  const inputStyle: React.CSSProperties = { 
    padding: "0.625rem 1rem", 
    border: "1px solid #e5e7eb", 
    borderRadius: "0.5rem", 
    fontSize: "0.875rem", 
    outline: "none", 
    width: "100%", 
    boxSizing: "border-box", 
    fontFamily: "inherit" 
  };
  
  const labelStyle: React.CSSProperties = { 
    display: "block", 
    fontSize: "0.7rem", 
    fontWeight: 600, 
    color: "#6b7280", 
    textTransform: "uppercase", 
    letterSpacing: "0.05em", 
    marginBottom: "0.375rem" 
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color:'black' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}>Events Management</h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.125rem" }}>
            Create and manage official events and activities
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); setShowModal(true); }}
          style={{ 
            background: "#4f46e5", 
            color: "#fff", 
            border: "none", 
            padding: "0.5rem 1rem", 
            borderRadius: "0.5rem", 
            fontSize: "0.875rem", 
            fontWeight: 500, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.4rem" 
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4338ca")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f46e5")}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Search events..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "180px" }} 
        />
        <select 
          value={typeFilter} 
          onChange={e => setTypeFilter(e.target.value)} 
          style={{ ...inputStyle, width: "auto" }}
        >
          <option value="">All Types</option>
          {["Academic", "Administrative", "Training", "Social"].map(t => <option key={t}>{t}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          style={{ ...inputStyle, width: "auto" }}
        >
          <option value="">All Status</option>
          {["Upcoming", "Ongoing", "Completed"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select 
          value={instructorFilter} 
          onChange={e => setInstructorFilter(e.target.value)} 
          style={{ ...inputStyle, width: "auto" }}
        >
          <option value="">All Instructors</option>
          <option value="all">All Instructors (College-wide)</option>
          {instructors.map(i => (
            <option key={i.id} value={i.instructor_id}>{i.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2.5rem", color: "#9ca3af" }}>
          <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading events...
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {filtered.map(event => {
            const instructor = instructors.find(i => i.instructor_id === event.instructor_id);
            return (
              <div 
                key={event.id} 
                style={{ 
                  background: "#fff", 
                  borderRadius: "0.75rem", 
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", 
                  overflow: "hidden", 
                  border: "1px solid #f3f4f6", 
                  transition: "box-shadow 0.2s" 
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)")}
              >
                <div style={{ background: typeGradients[event.type], padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.125rem 0.625rem", borderRadius: "9999px", fontWeight: 500 }}>
                      {event.type}
                    </span>
                    <span style={{ fontSize: "0.7rem", padding: "0.125rem 0.625rem", borderRadius: "9999px", fontWeight: 500, background: statusColors[event.status]?.bg, color: statusColors[event.status]?.color }}>
                      {event.status}
                    </span>
                  </div>
                  <h3 style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>{event.title}</h3>
                  {event.for_all_instructors ? (
                    <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "9999px", marginTop: "0.25rem", display: "inline-block" }}>
                      👥 All Instructors
                    </span>
                  ) : event.instructor_id && (
                    <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "9999px", marginTop: "0.25rem", display: "inline-block" }}>
                      👤 {instructor?.name || event.instructor_id}
                    </span>
                  )}
                </div>
                <div style={{ padding: "1rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {event.description}
                  </p>
                  <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: "0.75rem" }} />
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <p>📅 {new Date(event.date).toLocaleDateString()} – {new Date(event.date_ends).toLocaleDateString()}</p>
                    <p>🕐 {event.start}{event.ends ? ` – ${event.ends}` : ""}</p>
                    <p>📍 {event.location}</p>
                    <p>👥 {event.attendees} attendees</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                    <button onClick={() => handleEdit(event)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 500, fontSize: "0.875rem" }}>Edit</button>
                    <button onClick={() => handleDelete(event.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 500, fontSize: "0.875rem" }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <svg width="48" height="48" fill="none" stroke="#d1d5db" viewBox="0 0 24 24" style={{ margin: "0 auto 0.75rem" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No events found</p>
          <button onClick={() => setShowModal(true)} style={{ marginTop: "1rem", background: "none", border: "none", color: "#6366f1", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}>
            Create your first event
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", width: "100%", maxWidth: "32rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f2937" }}>{editing ? "Edit Event" : "Create Event"}</h2>
                <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Event Title *</label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    style={inputStyle} 
                    placeholder="e.g., Faculty Meeting" 
                    required 
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    rows={3} 
                    style={{ ...inputStyle, resize: "vertical" }} 
                    placeholder="Event details..." 
                    required 
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Start Date *</label>
                    <input 
                      type="date" 
                      value={form.date} 
                      min={today} 
                      onChange={e => setForm({ ...form, date: e.target.value })} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date *</label>
                    <input 
                      type="date" 
                      value={form.end_date} 
                      min={form.date || today} 
                      onChange={e => setForm({ ...form, end_date: e.target.value })} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Start Time *</label>
                    <input 
                      type="time" 
                      value={form.time} 
                      onChange={e => setForm({ ...form, time: e.target.value })} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End Time</label>
                    <input 
                      type="time" 
                      value={form.end_time} 
                      onChange={e => setForm({ ...form, end_time: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                </div>
                
                <div>
                  <label style={labelStyle}>Location *</label>
                  <input 
                    type="text" 
                    value={form.location} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    style={inputStyle} 
                    placeholder="e.g., Conference Room A" 
                    required 
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Type *</label>
                    <select 
                      value={form.type} 
                      onChange={e => setForm({ ...form, type: e.target.value as Event["type"] })} 
                      style={inputStyle}
                    >
                      {["Academic", "Administrative", "Training", "Social"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Status (Auto-calculated)</label>
                    <input 
                      type="text" 
                      value={form.status} 
                      readOnly 
                      style={{ 
                        ...inputStyle, 
                        background: "#f3f4f6", 
                        color: "#4b5563", 
                        cursor: "not-allowed",
                        fontWeight: 600
                      }} 
                    />
                  </div>
                </div>

                {/* Instructor Assignment */}
                <div>
                  <label style={labelStyle}>Assign to Instructor</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={form.for_all_instructors}
                        onChange={e => setForm({ ...form, for_all_instructors: e.target.checked, instructor_id: "" })}
                      />
                      All Instructors (College-wide)
                    </label>
                  </div>
                  
                  {!form.for_all_instructors && (
                    <select
                      value={form.instructor_id}
                      onChange={e => setForm({ ...form, instructor_id: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Specific Instructor</option>
                      {instructors.map(i => (
                        <option key={i.id} value={i.instructor_id}>{i.name}</option>
                      ))}
                    </select>
                  )}
                  <p style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Select an instructor or make it college-wide. This will mark their schedules as "Excused" during the event.
                  </p>
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={{ 
                      padding: "0.5rem 1.25rem", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "0.5rem", 
                      background: "none", 
                      fontSize: "0.875rem", 
                      cursor: "pointer", 
                      color: "#6b7280" 
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                      padding: "0.5rem 1.25rem", 
                      background: "#4f46e5", 
                      color: "#fff", 
                      border: "none", 
                      borderRadius: "0.5rem", 
                      fontSize: "0.875rem", 
                      fontWeight: 500, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.4rem", 
                      opacity: loading ? 0.6 : 1 
                    }}
                  >
                    {loading && <div style={{ width: "1rem", height: "1rem", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                    {editing ? "Update Event" : "Create Event"}
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