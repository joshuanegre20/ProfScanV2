// src/pages/Staff/tabs/MyAttendanceTab.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

interface AttendanceLog {
  id: number;
  date: string;
  time_in: string;
  time_out: string | null;
  status: 'present' | 'late' | 'absent';
  device_name: string;
  location: string;
}

export default function MyAttendanceTab() {
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff/attendance', {
        params: { month: selectedMonth }
      });
      
      // Ensure data is an array
      const data = Array.isArray(response.data) ? response.data : 
                   response.data?.data ? (Array.isArray(response.data.data) ? response.data.data : []) : [];
      
      setAttendance(data);
      
      // Calculate stats safely
      const present = data.filter((a: AttendanceLog) => a.status === 'present').length;
      const late = data.filter((a: AttendanceLog) => a.status === 'late').length;
      const absent = data.filter((a: AttendanceLog) => a.status === 'absent').length;
      
      setStats({
        present,
        late,
        absent,
        total: data.length
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
      setStats({ present: 0, late: 0, absent: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      present: { background: "#d1fae5", color: "#065f46" },
      late: { background: "#fef3c7", color: "#92400e" },
      absent: { background: "#fee2e2", color: "#991b1b" },
    };
    return styles[status as keyof typeof styles] || styles.present;
  };

  const getDayOfWeek = (date: string) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date(date).getDay()];
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #f3f4f6",
    overflow: "hidden",
  };

  return (
    <div>
      {/* Month Selector and Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>Attendance History</h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>View your attendance records by month</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "0.625rem 1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem", textAlign: "center" }}>
            <p style={{ color: "#10b981", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Present</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>{stats.present}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem", textAlign: "center" }}>
            <p style={{ color: "#f59e0b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Late</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>{stats.late}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem", textAlign: "center" }}>
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Absent</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444" }}>{stats.absent}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem", textAlign: "center" }}>
            <p style={{ color: "#4f46e5", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Days</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#4f46e5" }}>{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div style={cardStyle}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}>
            Records for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div style={{ padding: "1.25rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading attendance records...</div>
          ) : attendance.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Date</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Day</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Time In</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Time Out</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "#4b5563" }}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => {
                    const badgeStyle = getStatusBadge(record.status);
                    return (
                      <tr key={record.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{new Date(record.date).toLocaleDateString()}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{getDayOfWeek(record.date)}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{record.time_in}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{record.time_out || '—'}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ 
                            padding: "0.25rem 0.75rem", 
                            borderRadius: "9999px", 
                            fontSize: "0.75rem", 
                            fontWeight: 500,
                            background: badgeStyle.background,
                            color: badgeStyle.color
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>{record.device_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No attendance records for this month</p>
              <p style={{ fontSize: "0.875rem" }}>Your attendance history will appear here once you start checking in</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}