// src/pages/Admin/tabs/StaffTab.tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Staff {
  id: number;
  name: string;
  email: string;
  contact_no: string | null;
  status: string;
  profile_url: string | null;
  staff_id?: string;
  address?: string;
  gender?: string;
  age?: number;
  birth_date?: string;
}

const glassCardStyle = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
};

// ── Edit Staff Modal ─────────────────────────────────────────────────
function EditStaffModal({
  staff,
  onClose,
  onSuccess,
  avatarUrl,
}: {
  staff: Staff;
  onClose: () => void;
  onSuccess: () => void;
  avatarUrl?: string;
}) {
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    contact_no: staff.contact_no || "",
    address: staff.address || "",
    gender: staff.gender || "",
    age: staff.age?.toString() || "",
  });
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    avatarUrl || null
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("contact_no", formData.contact_no);
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("age", formData.age);
      if (photo) formDataToSend.append("photo", photo);

      await api.post(`/staff/${staff.id}?_method=PUT`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update staff:", err);
      alert(err.response?.data?.message || "Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.25rem",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
            Edit Staff
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              marginTop: "0.125rem",
            }}
          >
            Update staff member information
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Photo */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ position: "relative" }}>
              {/* Show image if we have a preview/blob URL, otherwise show fallback icon */}
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={staff.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #003366",
                    display: "block",
                  }}
                  onError={() => setPhotoPreview(null)}
                />
              ) : (
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #003366, #0055a4)",
                    border: "2px solid #003366",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    stroke="#ffd700"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}

              {/* Camera button overlay */}
              <label
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#003366",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="#fff"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Contact & Gender */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Contact No.</label>
              <input
                type="text"
                value={formData.contact_no}
                onChange={(e) =>
                  setFormData({ ...formData, contact_no: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Age & Address */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                background: "#003366",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffTab({
  setActiveTab,
}: {
  setActiveTab: (t: string) => void;
}) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [avatars, setAvatars] = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const loadAvatar = useCallback(async (s: Staff) => {
    if (!s.profile_url) return;
    try {
      const res = await api.get(`/staff/${s.id}/photo`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      setAvatars((prev) => ({ ...prev, [s.id]: url }));
    } catch {}
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/staff", { params: { search } });
      setStaff(res.data);
      res.data.forEach((s: Staff) => {
        if (s.profile_url) loadAvatar(s);
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, loadAvatar]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useSocket({
    room: "admin",
    onStaffUpdate: (data) => {
      if (
        data.action === "created" ||
        data.action === "updated" ||
        data.action === "deleted"
      ) {
        fetchStaff();
      }
    },
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/staff/${id}`);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      if (avatars[id]) {
        URL.revokeObjectURL(avatars[id]);
        setAvatars((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/staff/${id}/status`, { status: newStatus });
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch {}
  };

  const Avatar = ({ s }: { s: Staff }) => (
    <div
      style={{
        width: "3rem",
        height: "3rem",
        borderRadius: "50%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #003366, #0055a4)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {avatars[s.id] ? (
        <img
          src={avatars[s.id]}
          alt={s.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="#ffd700"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )}
    </div>
  );

  return (
    <div
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", color: "black" }}
    >
      {/* Edit Modal */}
      {showEditModal && editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          avatarUrl={avatars[editingStaff.id]} // ← pass the already-loaded blob URL
          onClose={() => {
            setShowEditModal(false);
            setEditingStaff(null);
          }}
          onSuccess={fetchStaff}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1e293b" }}>
            Staff
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.8rem",
              marginTop: "0.125rem",
            }}
          >
            {staff.length} member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "0.5rem 1rem 0.5rem 2.25rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                outline: "none",
                width: "200px",
                background: "#fff",
                color: "#1e293b",
              }}
            />
            <svg
              style={{
                position: "absolute",
                left: "0.625rem",
                top: "50%",
                transform: "translateY(-50%)",
              }}
              width="14"
              height="14"
              fill="none"
              stroke="#94a3b8"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
            </svg>
          </div>
          <button
            onClick={() => setActiveTab("add-staff")}
            style={{
              padding: "0.5rem 1rem",
              background: "#003366",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#004c99")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#003366")
            }
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4rem",
          }}
        >
          <div
            style={{
              width: "2rem",
              height: "2rem",
              border: "3px solid #e2e8f0",
              borderTopColor: "#003366",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
      ) : staff.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            background: "#fff",
            borderRadius: "1rem",
            border: "1px dashed #e2e8f0",
          }}
        >
          <p style={{ fontWeight: 600, color: "#1e293b" }}>No staff found</p>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.8rem",
              marginTop: "0.375rem",
            }}
          >
            Click Add Staff to register a new member.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {staff.map((s) => (
            <div
              key={s.id}
              style={{
                ...glassCardStyle,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              {/* Avatar + name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                }}
              >
                <Avatar s={s} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.email}
                  </p>
                </div>
              </div>

              {/* Contact */}
              {s.contact_no && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    stroke="#64748b"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "#475569" }}>
                    {s.contact_no}
                  </span>
                </div>
              )}

              {/* Status + role */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "#eef2ff",
                    color: "#003366",
                    textTransform: "uppercase",
                  }}
                >
                  Staff
                </span>
                <button
                  onClick={() => handleToggleStatus(s.id, s.status)}
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      s.status === "Active" ? "#dcfce7" : "#f1f5f9",
                    color:
                      s.status === "Active" ? "#15803d" : "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  {s.status}
                </button>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "0.75rem",
                }}
              >
                <button
                  onClick={() => handleEdit(s)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    border: "1px solid #bfdbfe",
                    borderRadius: "0.5rem",
                    background: "#fff",
                    color: "#003366",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                    flex: 1,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#eff6ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deleting === s.id}
                  style={{
                    padding: "0.4rem 0.75rem",
                    border: "1px solid #fecaca",
                    borderRadius: "0.5rem",
                    background: "#fff",
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                    flex: 1,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#fef2f2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  {deleting === s.id ? "..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}