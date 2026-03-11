// src/pages/Staff/tabs/ProfileTab.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

interface StaffProfile {
  id: number;
  name: string;
  email: string;
  staff_id: string;
  department: string;
  contact_no: string;
  address: string;
  birth_date: string;
  gender: string;
  specialization: string;
  hire_date: string;
  emergency_contact: string;
  emergency_name: string;
  profile_url: string;
}

export default function ProfileTab() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff/profile');
      setProfile(response.data);
      setFormData(response.data || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      await axios.put('/api/staff/profile', formData);
      alert('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating profile');
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #f3f4f6",
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 1rem",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div style={cardStyle}>
        <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No profile information found</p>
          <p style={{ fontSize: "0.875rem" }}>Your profile information will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ 
        padding: "2rem", 
        background: "linear-gradient(135deg, #312e81, #4338ca)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem"
      }}>
        <div style={{
          width: "5rem",
          height: "5rem",
          borderRadius: "50%",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          fontWeight: 600,
          color: "#4f46e5"
        }}>
          {profile.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>{profile.name}</h2>
          <p style={{ color: "#a5b4fc", fontSize: "0.875rem" }}>{profile.staff_id} • {profile.department}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Profile Details */}
      <div style={{ padding: "2rem" }}>
        {editing ? (
          // Edit Mode
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Number</label>
                <input
                  type="text"
                  name="contact_no"
                  value={formData.contact_no || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Birth Date</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date?.split('T')[0] || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Address</label>
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_name"
                  value={formData.emergency_name || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Emergency Contact Number</label>
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: "0.625rem 1.5rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  background: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={processing}
                style={{
                  padding: "0.625rem 1.5rem",
                  background: processing ? "#c7d2fe" : "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: processing ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => !processing && (e.currentTarget.style.background = "#4338ca")}
                onMouseLeave={e => !processing && (e.currentTarget.style.background = "#4f46e5")}
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
            <div>
              <p style={labelStyle}>Full Name</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.name}</p>
              
              <p style={labelStyle}>Email</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.email}</p>
              
              <p style={labelStyle}>Contact Number</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.contact_no || '—'}</p>
              
              <p style={labelStyle}>Birth Date</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>
                {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '—'}
              </p>
              
              <p style={labelStyle}>Gender</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.gender || '—'}</p>
            </div>
            
            <div>
              <p style={labelStyle}>Department</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.department || '—'}</p>
              
              <p style={labelStyle}>Specialization</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>{profile.specialization || '—'}</p>
              
              <p style={labelStyle}>Hire Date</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "1rem" }}>
                {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : '—'}
              </p>
              
              <p style={labelStyle}>Emergency Contact</p>
              <p style={{ fontSize: "1rem", color: "#1f2937", marginBottom: "0.25rem" }}>{profile.emergency_name || '—'}</p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>{profile.emergency_contact || '—'}</p>
              
              <p style={labelStyle}>Address</p>
              <p style={{ fontSize: "1rem", color: "#1f2937" }}>{profile.address || '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}