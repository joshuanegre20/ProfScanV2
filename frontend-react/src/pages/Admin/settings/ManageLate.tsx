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

interface ModalState {
  open: boolean;
  type: "delete" | "bulkDelete";
  title: string;
  message: string;
  onConfirm?: () => void;
}

export default function ManageLate() {
  const [lateRecords, setLateRecords] = useState<LateRecord[]>([]);
  const [leaders, setLeaders] = useState<LateLeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "leaderboard">("records");
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: "delete",
    title: "",
    message: "",
  });

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

  const handleSelectAll = () => {
    if (selectedRecords.size === lateRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(lateRecords.map(r => r.id)));
    }
  };

  const handleSelectRecord = (id: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleDeleteSingle = async (record: LateRecord) => {
    setModal({
      open: true,
      type: "delete",
      title: "Delete Late Record",
      message: `Are you sure you want to delete the late record for ${record.name} (${record.subject})? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setDeleting(true);
          await api.delete(`/admin/attendance/late-records/${record.id}`);
          await fetchLateRecords();
          setSelectedRecords(new Set());
          closeModal();
        } catch (err) {
          console.error("Failed to delete:", err);
          alert("Failed to delete record");
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    
    setModal({
      open: true,
      type: "bulkDelete",
      title: "Delete Selected Records",
      message: `Are you sure you want to delete ${selectedRecords.size} selected late record(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setDeleting(true);
          const ids = Array.from(selectedRecords);
          await api.post("/admin/attendance/late-records/bulk-delete", { ids });
          await fetchLateRecords();
          setSelectedRecords(new Set());
          closeModal();
        } catch (err) {
          console.error("Failed to bulk delete:", err);
          alert("Failed to delete records");
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, open: false }));
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem" }}>
      {/* Modal */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: "#fff",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            width: "100%",
            maxWidth: "26rem",
            overflow: "hidden",
            animation: "modalPop 0.15s ease-out",
          }}>
            <div style={{
              background: "#fee2e2",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              borderBottom: "1px solid #e2e8f0",
            }}>
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{modal.title}</h3>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0 1.5rem 1.25rem" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  background: "none",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  modal.onConfirm?.();
                  closeModal();
                }}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "none",
                  borderRadius: "0.5rem",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#b91c1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: activeTab === "leaderboard" ? "#edbb07" : "#64748b",
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
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: activeTab === "records" ? "#edbb07" : "#64748b",
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
          <div style={{ background: "#f8fafc", padding: "0.75rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
              Late Records ({lateRecords.length})
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {selectedRecords.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  style={{
                    padding: "0.375rem 0.875rem",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
                >
                  🗑️ Delete Selected ({selectedRecords.size})
                </button>
              )}
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
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b", width: "2rem" }}>
                      <input
                        type="checkbox"
                        checked={selectedRecords.size === lateRecords.length && lateRecords.length > 0}
                        onChange={handleSelectAll}
                        style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Instructor</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Subject</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Date</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Schedule</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Time In</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Minutes Late</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Severity</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lateRecords.map((record, idx) => {
                    const severity = getSeverity(record.minutes_late);
                    return (
                      <tr key={record.id} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                            style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontWeight: 500, color: "#1e293b" }}>{record.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{record.instructor_id}</div>
                         </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{record.subject}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>
                          {record.scanned_at ? formatDate(record.scanned_at) : "--"}
                        </td>
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
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <button
                            onClick={() => handleDeleteSingle(record)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              fontSize: "1rem",
                              padding: "0.25rem",
                              borderRadius: "0.25rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}