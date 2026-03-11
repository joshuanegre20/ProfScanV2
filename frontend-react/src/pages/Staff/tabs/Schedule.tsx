// src/pages/Staff/tabs/MyScheduleTab.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

interface Schedule {
  id: number;
  day_of_week: string;
  time_in: string;
  time_out: string;
  subject: string;
  room: string;
}

export default function MyScheduleTab() {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff/schedule');
      
      // Ensure data is an array
      const data = Array.isArray(response.data) ? response.data : 
                   response.data?.data ? (Array.isArray(response.data.data) ? response.data.data : []) : [];
      
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #f3f4f6",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: "1.5rem",
    borderBottom: "1px solid #f3f4f6",
    background: "linear-gradient(135deg, #f9fafb, #ffffff)"
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
        Loading schedule...
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>My Weekly Schedule</h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Your class schedule for the current semester
        </p>
      </div>
      
      <div style={{ padding: "1.5rem" }}>
        {schedule.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No schedule found</p>
            <p style={{ fontSize: "0.875rem" }}>Your class schedule will appear here once assigned</p>
          </div>
        ) : (
          daysOfWeek.map(day => {
            const daySchedule = schedule.filter(s => s.day_of_week === day);
            
            return (
              <div key={day} style={{ 
                border: "1px solid #f3f4f6", 
                borderRadius: "0.75rem", 
                marginBottom: "1rem",
                overflow: "hidden" 
              }}>
                {/* Day header */}
                <div style={{ 
                  background: daySchedule.length > 0 ? "#4f46e5" : "#f3f4f6", 
                  padding: "0.75rem 1rem",
                  color: daySchedule.length > 0 ? "#fff" : "#6b7280"
                }}>
                  <h3 style={{ fontWeight: 600, margin: 0 }}>{day}</h3>
                </div>
                
                {/* Day content */}
                <div style={{ padding: "1rem" }}>
                  {daySchedule.length > 0 ? (
                    daySchedule.map((s) => (
                      <div key={s.id} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "1rem", 
                        background: "#f9fafb", 
                        borderRadius: "0.75rem",
                        border: "1px solid #f3f4f6",
                        marginBottom: "0.75rem"
                      }}>
                        <div>
                          <p style={{ fontWeight: 600, color: "#1f2937", margin: "0 0 0.25rem 0" }}>
                            {s.subject}
                          </p>
                          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                            📍 {s.room}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#4f46e5", margin: 0 }}>
                            {formatTime(s.time_in)}
                          </p>
                          <p style={{ fontSize: "0.875rem", color: "#9ca3af", margin: "0.25rem 0" }}>to</p>
                          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#4f46e5", margin: 0 }}>
                            {formatTime(s.time_out)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#9ca3af", textAlign: "center", margin: 0 }}>
                      No classes scheduled
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}