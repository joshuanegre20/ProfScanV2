// src/pages/Admin/settings/ManageLate.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface LateRecord {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  minutes_late: number;
  scanned_at: string;
  schedule_time: string;
  status: string;
  department: string;
}

interface LateLeader {
  instructor_id: string;
  name: string;
  department: string;
  total_late_count: number;
  total_minutes_late: number;
  avg_minutes_late: number;
}

export default function ManageLate() {
  const [lateRecords, setLateRecords] = useState<LateRecord[]>([]);
  const [leaders, setLeaders] = useState<LateLeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "leaderboard">("records");

  useEffect(() => {
    fetchLateRecords();
  }, []);

  const fetchLateRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/attendance/late-records");
      const records = res.data.data || [];
      setLateRecords(records);
      
      // Calculate leaderboard from records
      const instructorMap = new Map<string, LateLeader>();
      
      records.forEach((record: LateRecord) => {
        const existing = instructorMap.get(record.instructor_id);
        if (existing) {
          existing.total_late_count += 1;
          existing.total_minutes_late += record.minutes_late;
          existing.avg_minutes_late = existing.total_minutes_late / existing.total_late_count;
        } else {
          instructorMap.set(record.instructor_id, {
            instructor_id: record.instructor_id,
            name: record.name,
            department: record.department,
            total_late_count: 1,
            total_minutes_late: record.minutes_late,
            avg_minutes_late: record.minutes_late
          });
        }
      });
      
      // Convert to array and sort by total late count
      const leaderArray = Array.from(instructorMap.values())
        .sort((a, b) => b.total_late_count - a.total_late_count);
      
      setLeaders(leaderArray);
    } catch (err) {
      console.error("Failed to fetch late records:", err);
    }
    setLoading(false);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "--:--";
    return timeStr.substring(0, 5);
  };

  const getSeverity = (minutes: number) => {
    if (minutes <= 15) return { bg: "#fef3c7", text: "#d97706", label: "Mild" };
    if (minutes <= 30) return { bg: "#fed7aa", text: "#c2410c", label: "Moderate" };
    if (minutes <= 60) return { bg: "#fee2e2", text: "#dc2626", label: "Late" };
    return { bg: "#fef2f2", text: "#b91c1c", label: "Very Late" };
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return { bg: "#ffd700", color: "#8b6914", label: "🥇" };
    if (index === 1) return { bg: "#c0c0c0", color: "#6b6b6b", label: "🥈" };
    if (index === 2) return { bg: "#cd7f32", color: "#8b4513", label: "🥉" };
    return { bg: "#f1f5f9", color: "#64748b", label: `${index + 1}` };
  };

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.5rem" }}>
          Late Arrivals Management
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Track and manage instructor late arrivals
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: activeTab === "leaderboard" ? "#003366" : "#64748b",
            borderBottom: activeTab === "leaderboard" ? "2px solid #003366" : "none",
          }}
        >
          🏆 Late Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("records")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: activeTab === "records" ? "#003366" : "#64748b",
            borderBottom: activeTab === "records" ? "2px solid #003366" : "none",
          }}
        >
          📋 Late Records
        </button>
      </div>

      {activeTab === "leaderboard" ? (
        /* Leaderboard Section */
        <div style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #003366, #0055a4)", padding: "1rem 1.5rem", color: "#fff" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🏆</span> Top Late Comers Leaderboard
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#bfdbfe", marginTop: "0.25rem", marginBottom: 0 }}>
              Instructors with most late arrivals
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <div style={{ width: "2rem", height: "2rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : leaders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <p>No late records found</p>
            </div>
          ) : (
            <div>
              {/* Top 3 Podium */}
              {leaders.slice(0, 3).map((leader, idx) => {
                const medal = getMedalColor(idx);
                return (
                  <div
                    key={leader.instructor_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem 1.5rem",
                      borderBottom: "1px solid #e2e8f0",
                      background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f8fafc" : "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        background: medal.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: medal.color,
                      }}>
                        {medal.label}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{leader.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{leader.instructor_id} · {leader.department}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#dc2626" }}>{leader.total_late_count}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>total lates</div>
                    </div>
                  </div>
                );
              })}

              {/* Rest of the list */}
              {leaders.slice(3).map((leader, idx) => (
                <div
                  key={leader.instructor_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.875rem 1.5rem",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#64748b",
                    }}>
                      {idx + 4}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>{leader.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{leader.instructor_id}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#dc2626" }}>{leader.total_late_count}</div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>{leader.total_minutes_late} min total</div>
                  </div>
                </div>
              ))}

              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#003366" }}>{leaders.length}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Instructors with lates</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#003366" }}>
                    {leaders.reduce((sum, l) => sum + l.total_late_count, 0)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Total late arrivals</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#003366" }}>
                    {Math.round(leaders.reduce((sum, l) => sum + l.total_minutes_late, 0) / (leaders.reduce((sum, l) => sum + l.total_late_count, 0) || 1))}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Avg minutes late</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Late Records Table */
        <div style={{ background: "#fff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ background: "#f8fafc", padding: "0.75rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
              Late Records ({lateRecords.length})
            </h2>
            <button
              onClick={fetchLateRecords}
              disabled={loading}
              style={{
                padding: "0.375rem 0.875rem",
                background: "#003366",
                color: "#fff",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#004d99")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#003366")}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <div style={{ width: "2rem", height: "2rem", border: "2px solid #e2e8f0", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : lateRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: "0 auto 0.75rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No late records found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Instructor</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Subject</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Schedule</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Time In</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Minutes Late</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {lateRecords.map((record, idx) => {
                    const severity = getSeverity(record.minutes_late);
                    return (
                      <tr key={record.id} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontWeight: 500, color: "#1e293b" }}>{record.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{record.instructor_id}</div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{record.subject}</td>
                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#64748b" }}>{formatTime(record.schedule_time)}</td>
                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#64748b" }}>{formatTime(record.scanned_at)}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ fontWeight: 600, color: "#dc2626" }}>{Math.round(record.minutes_late)} min</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: severity.bg,
                            color: severity.text,
                          }}>
                            {severity.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}