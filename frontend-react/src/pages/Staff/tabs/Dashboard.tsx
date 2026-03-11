// src/pages/Staff/tabs/MyDashboardTab.tsx
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

interface Stats {
  total_attendances: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_rate: number;
}

export default function MyDashboardTab() {
  const [stats, setStats] = useState<Stats>({
    total_attendances: 0,
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    attendance_rate: 0
  });
  const [recentAttendances, setRecentAttendances] = useState<AttendanceLog[]>([]);
  const [todayStatus, setTodayStatus] = useState<'checked-in' | 'checked-out' | 'not-checked'>('not-checked');
  const [timeIn, setTimeIn] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff/dashboard');
      setStats(response.data.stats || {
        total_attendances: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        attendance_rate: 0
      });
      setRecentAttendances(response.data.recent_attendances || []);
      setTodayStatus(response.data.today_status || 'not-checked');
      setTimeIn(response.data.time_in || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty defaults on error
      setStats({
        total_attendances: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        attendance_rate: 0
      });
      setRecentAttendances([]);
      setTodayStatus('not-checked');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeIn = async () => {
    setProcessing(true);
    try {
      await axios.post('/api/staff/time-in');
      alert('Time in recorded successfully!');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error recording time in');
    } finally {
      setProcessing(false);
    }
  };

  const handleTimeOut = async () => {
    setProcessing(true);
    try {
      await axios.post('/api/staff/time-out');
      alert('Time out recorded successfully!');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error recording time out');
    } finally {
      setProcessing(false);
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

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Time In/Out Card */}
      <div style={{ ...cardStyle, marginBottom: "1.5rem", background: "linear-gradient(135deg, #f9fafb, #ffffff)" }}>
        <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
              {todayStatus === 'checked-in' ? 'You are checked in' : todayStatus === 'checked-out' ? 'You are checked out' : 'Ready to check in?'}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              {todayStatus === 'checked-in' ? `Checked in at ${timeIn}` : 
               todayStatus === 'checked-out' ? 'Have a great day!' : 
               'Record your attendance for today'}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            {todayStatus === 'not-checked' && (
              <button
                onClick={handleTimeIn}
                disabled={processing}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem 2rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => !processing && (e.currentTarget.style.background = "#059669")}
                onMouseLeave={e => !processing && (e.currentTarget.style.background = "#10b981")}
              >
                {processing ? "Processing..." : "⏱️ Time In"}
              </button>
            )}
            
            {todayStatus === 'checked-in' && (
              <button
                onClick={handleTimeOut}
                disabled={processing}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem 2rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => !processing && (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={e => !processing && (e.currentTarget.style.background = "#ef4444")}
              >
                {processing ? "Processing..." : "⌛ Time Out"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Attendances</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937" }}>{stats.total_attendances}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Present</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>{stats.present_count}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Late</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>{stats.late_count}</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "1.25rem" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Attendance Rate</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#4f46e5" }}>{stats.attendance_rate}%</p>
          </div>
        </div>
      </div>

      {/* Recent Attendances */}
      <div style={cardStyle}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1f2937" }}>Recent Attendances</h3>
        </div>
        <div style={{ padding: "1.25rem" }}>
          {recentAttendances.length > 0 ? (
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
                  {recentAttendances.map((attendance) => {
                    const badgeStyle = getStatusBadge(attendance.status);
                    return (
                      <tr key={attendance.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{new Date(attendance.date).toLocaleDateString()}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{getDayOfWeek(attendance.date)}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{attendance.time_in}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{attendance.time_out || '—'}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ 
                            padding: "0.25rem 0.75rem", 
                            borderRadius: "9999px", 
                            fontSize: "0.75rem", 
                            fontWeight: 500,
                            background: badgeStyle.background,
                            color: badgeStyle.color
                          }}>
                            {attendance.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>{attendance.device_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No attendance records found</p>
              <p style={{ fontSize: "0.875rem" }}>Your attendance history will appear here once you start checking in</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}