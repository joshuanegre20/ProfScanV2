// src/pages/Admin/tabs/SettingsTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface LoginImage {
  id: number;
  image_path: string;
  image_url?: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface CarouselItem {
  id: number;
  image_path: string;
  image_url?: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface Settings {
  notifyLogin: boolean;
  notifyScan: boolean;
  notifyEvents: boolean;
}

interface ErrorModalState {
  isOpen: boolean;
  title: string;
  message: string;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: "1.5rem",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6",
  display: "flex", alignItems: "center", gap: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  border: "1px solid #e2e8f0",
  borderRadius: "0.5rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const DEFAULTS: Settings = {
  notifyLogin: true,
  notifyScan: true,
  notifyEvents: false,
};

// ─── Login Image Modal Component ───
interface LoginImageModalProps {
  show: boolean;
  editingItem: LoginImage | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { description: string; is_active: boolean; image: File | null };
  onChange: (form: { description: string; is_active: boolean; image: File | null }) => void;
  uploading: boolean;
  getImageUrl: (item: LoginImage) => string;
}

const LoginImageModal = ({ show, editingItem, onClose, onSubmit, form, onChange, uploading, getImageUrl }: LoginImageModalProps) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "500px", width: "90%", color: "black" }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
            {editingItem ? "Edit Login Background Image" : "Add Login Background Image"}
          </h3>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Image (Recommended: 1920x1080px)</label>
            <div style={{
              width: "100%", height: "150px", border: "2px dashed #e5e7eb",
              borderRadius: "0.5rem", marginBottom: "0.5rem", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafc",
            }}>
              {form.image ? (
                <img src={URL.createObjectURL(form.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
              ) : editingItem && editingItem.image_path ? (
                <img src={getImageUrl(editingItem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="current" />
              ) : (
                <span style={{ color: "#9ca3af" }}>No Image Selected</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onChange({ ...form, image: e.target.files?.[0] || null })}
              required={!editingItem}
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
            <p style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "0.25rem" }}>
              Max 5MB. JPG, PNG, GIF, or WebP format. Leave empty to keep current image.
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Description (Optional)</label>
            <input
              type="text"
              style={inputStyle}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Brief description of this background"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.875rem", color: "#1f2937" }}>Set as active background (display on login page)</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "none",
                background: uploading ? "#9ca3af" : "#4f46e5", color: "#fff",
                cursor: uploading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}
            >
              {uploading ? (editingItem ? "Updating..." : "Uploading...") : (editingItem ? "Save Changes" : "Add Background")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Toggle Button Component ───
const ToggleButton = ({ value, onChange, isAutoSaving }: { value: boolean; onChange: (v: boolean) => void; isAutoSaving?: boolean }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    disabled={isAutoSaving}
    style={{
      padding: "0.375rem 1rem", borderRadius: "0.5rem", border: "none",
      cursor: isAutoSaving ? "not-allowed" : "pointer",
      fontSize: "0.75rem", fontWeight: 600,
      background: value ? "#4f46e5" : "#ef4444", color: "#fff",
      transition: "all 0.2s", minWidth: "80px", opacity: isAutoSaving ? 0.7 : 1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
    }}
  >
    {value ? "ON" : "OFF"}
  </button>
);

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<Record<string, boolean>>({});

  // Login Images states
  const [loginImages, setLoginImages] = useState<LoginImage[]>([]);
  const [loadingLoginImages, setLoadingLoginImages] = useState(false);
  const [showLoginImageModal, setShowLoginImageModal] = useState(false);
  const [editingLoginImage, setEditingLoginImage] = useState<LoginImage | null>(null);
  const [uploadingLoginImage, setUploadingLoginImage] = useState(false);
  const [loginImageForm, setLoginImageForm] = useState({
    description: "",
    is_active: false,
    image: null as File | null,
  });

  // Carousel states
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(false);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [editingCarouselItem, setEditingCarouselItem] = useState<CarouselItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [carouselForm, setCarouselForm] = useState({
    description: "",
    is_active: true,
    image: null as File | null,
  });

  // Error modal state
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchCarouselItems();
    fetchLoginImages();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/settings");
      setSettings({ ...DEFAULTS, ...response.data });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      const savedLocal = localStorage.getItem("profscan_settings");
      if (savedLocal) setSettings({ ...DEFAULTS, ...JSON.parse(savedLocal) });
    } finally {
      setLoading(false);
    }
  };

  const fetchCarouselItems = async () => {
    try {
      setLoadingCarousel(true);
      const response = await api.get("/carousel");
      if (response.data.success) {
        setCarouselItems(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCarouselItems(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch carousel items:", error);
    } finally {
      setLoadingCarousel(false);
    }
  };

  const fetchLoginImages = async () => {
    try {
      setLoadingLoginImages(true);
      const response = await api.get("/login-images");
      console.log("Login images response:", response.data);
      if (response.data.success) {
        const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
        const baseUrl = apiUrl.replace(/\/api$/, "");
        const items = response.data.data.map((item: LoginImage) => ({
          ...item,
          image_url: `${baseUrl}/api/login-image/${item.image_path.split("/").pop()}`
        }));
        setLoginImages(items);
      }
    } catch (error) {
      console.error("Failed to fetch login images:", error);
    } finally {
      setLoadingLoginImages(false);
    }
  };

  const showError = (title: string, message: string) => {
    setErrorModal({ isOpen: true, title, message });
  };

  const saveToBackend = async (updatedSettings: Settings) => {
    try {
      await api.post("/admin/settings", updatedSettings);
      localStorage.setItem("profscan_settings", JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      return false;
    }
  };

  const set = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setAutoSaveStatus(prev => ({ ...prev, [key]: true }));
    const success = await saveToBackend(newSettings);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setAutoSaveStatus(prev => ({ ...prev, [key]: false }));
  };

  const handleReset = async () => {
    setSettings(DEFAULTS);
    await saveToBackend(DEFAULTS);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const validateImageFile = (file: File): Promise<{ valid: boolean; error?: string }> => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Promise.resolve({ valid: false, error: "Invalid file type. Please upload JPG, PNG, GIF, or WEBP images only." });
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Promise.resolve({ valid: false, error: `File too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` });
    }
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(objectUrl); resolve({ valid: true }); };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve({ valid: false, error: "Invalid or corrupted image file." }); };
      img.src = objectUrl;
    });
  };

  // Login Image Handlers
  const handleAddLoginImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginImageForm.image) {
      showError("No Image Selected", "Please select an image to upload.");
      return;
    }
    const validation = await validateImageFile(loginImageForm.image);
    if (!validation.valid) {
      showError("Invalid Photo", validation.error || "Please choose a valid image.");
      return;
    }
    setUploadingLoginImage(true);
    const formData = new FormData();
    formData.append("image", loginImageForm.image);
    formData.append("description", loginImageForm.description);
    formData.append("is_active", loginImageForm.is_active ? "1" : "0");
    try {
      const response = await api.post("/admin/login-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        await fetchLoginImages();
        setShowLoginImageModal(false);
        setLoginImageForm({ description: "", is_active: false, image: null });
        showError("Success!", "Login image added successfully!");
      }
    } catch (error: any) {
      showError("Upload Failed", error.response?.data?.error || "Failed to add image");
    } finally {
      setUploadingLoginImage(false);
    }
  };

  const handleUpdateLoginImage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingLoginImage) return;

  setUploadingLoginImage(true);
  const formData = new FormData();

  // ✅ Use loginImageForm values, not editingLoginImage
  formData.append("description", loginImageForm.description || "");
  formData.append("is_active", loginImageForm.is_active ? "1" : "0");

  if (loginImageForm.image) {
    const validation = await validateImageFile(loginImageForm.image);
    if (!validation.valid) {
      showError("Invalid Photo", validation.error || "Please choose a valid image.");
      setUploadingLoginImage(false);
      return;
    }
    formData.append("image", loginImageForm.image);
  }

  try {
    const response = await api.post(`/admin/login-images/${editingLoginImage.id}?_method=PUT`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    if (response.data.success) {
      await fetchLoginImages();
      setEditingLoginImage(null);
      setShowLoginImageModal(false);
      setLoginImageForm({ description: "", is_active: false, image: null });
      showError("Success!", "Login image updated successfully!");
    }
  } catch (error: any) {
    console.error("Update error:", error);
    showError("Update Failed", error.response?.data?.error || "Failed to update image");
  } finally {
    setUploadingLoginImage(false);
  }
};

  const handleSetActiveLoginImage = async (id: number) => {
    try {
      const response = await api.post(`/admin/login-images/${id}/set-active`);
      if (response.data.success) {
        await fetchLoginImages();
        showError("Success!", "Active background updated!");
      }
    } catch (error) {
      showError("Error", "Failed to set active background");
    }
  };

  const handleDeleteLoginImage = async (id: number) => {
    if (!confirm("Delete this background?")) return;
    try {
      await api.delete(`/admin/login-images/${id}`);
      await fetchLoginImages();
      showError("Deleted", "Background deleted successfully!");
    } catch (error) {
      showError("Error", "Failed to delete");
    }
  };

  const getLoginImageUrl = (item: LoginImage) => {
    if (!item.image_path) return "";
    if (item.image_url) return item.image_url;
    const filename = item.image_path.split("/").pop();
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    return `${baseUrl}/api/login-image/${filename}`;
  };

  // Carousel Handlers
  const handleAddCarouselItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carouselForm.image) {
      showError("No Image Selected", "Please select an image to upload.");
      return;
    }
    const validation = await validateImageFile(carouselForm.image);
    if (!validation.valid) {
      showError("Invalid Photo", validation.error || "The selected file is not a valid image.");
      return;
    }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", carouselForm.image);
    formData.append("description", carouselForm.description);
    formData.append("is_active", carouselForm.is_active ? "1" : "0");
    try {
      const response = await api.post("/admin/carousel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        await fetchCarouselItems();
        setShowCarouselModal(false);
        setCarouselForm({ description: "", is_active: true, image: null });
        showError("Success!", "Carousel item added successfully!");
      } else {
        showError("Upload Failed", response.data.error || "Failed to add carousel item");
      }
    } catch (error: any) {
      if (error.response?.status === 413) {
        showError("File Too Large", "The image file is too large. Maximum size is 5MB.");
      } else if (error.response?.status === 415) {
        showError("Unsupported Format", "The file format is not supported.");
      } else {
        showError("Upload Error", error.response?.data?.error || "Failed to add carousel item.");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateCarouselItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarouselItem) return;
    if (carouselForm.image) {
      const validation = await validateImageFile(carouselForm.image);
      if (!validation.valid) {
        showError("Invalid Photo", validation.error || "Please choose a valid image.");
        return;
      }
    }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("description", editingCarouselItem.description);
    formData.append("is_active", editingCarouselItem.is_active ? "1" : "0");
    if (carouselForm.image) formData.append("image", carouselForm.image);
    try {
      const response = await api.post(`/admin/carousel/${editingCarouselItem.id}?_method=PUT`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        await fetchCarouselItems();
        setEditingCarouselItem(null);
        setShowCarouselModal(false);
        setCarouselForm({ description: "", is_active: true, image: null });
        showError("Success!", "Carousel item updated successfully!");
      }
    } catch (error: any) {
      showError("Update Failed", error.response?.data?.error || "Failed to update item");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCarouselItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this carousel item?")) return;
    try {
      const response = await api.delete(`/admin/carousel/${id}`);
      if (response.data.success) {
        await fetchCarouselItems();
        showError("Deleted", "Carousel item deleted successfully!");
      }
    } catch (error) {
      showError("Delete Failed", "Failed to delete item");
    }
  };

  const toggleCarouselActive = async (item: CarouselItem) => {
    try {
      const formData = new FormData();
      formData.append("is_active", item.is_active ? "0" : "1");
      formData.append("description", item.description);
      const response = await api.post(`/admin/carousel/${item.id}?_method=PUT`, formData);
      if (response.data.success) await fetchCarouselItems();
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const getImageUrl = (item: CarouselItem) => {
    if (!item.image_path) return "";
    const filename = item.image_path.split("/").pop();
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    return `${baseUrl}/api/carousel-image/${filename}`;
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", maxWidth: "48rem", margin: "0 auto", paddingBottom: "4rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 2rem; height: 2rem; border: 2px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 3rem auto; }
        .spinner-small { width: 0.75rem; height: 0.75rem; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700 }}>System Preferences</h1>
        <p style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.25rem" }}>Manage notifications, homepage carousel & login backgrounds</p>
      </div>

      {/* Error/Success Modal */}
      {errorModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setErrorModal({ ...errorModal, isOpen: false })}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "400px", width: "90%", textAlign: "center", animation: "slideIn 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", margin: "0 auto 1rem", borderRadius: "50%", background: errorModal.title === "Success!" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {errorModal.title === "Success!" ? (
                <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem", color: "#1e293b" }}>{errorModal.title}</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>{errorModal.message}</p>
            <button onClick={() => setErrorModal({ ...errorModal, isOpen: false })} style={{ padding: "0.5rem 1.5rem", background: errorModal.title === "Success!" ? "#16a34a" : "#dc2626", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Close</button>
          </div>
        </div>
      )}

      {/* Notifications Card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Notification Preferences</h2>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { key: "notifyLogin", label: "Admin login alerts", desc: "Get notified when someone logs into the admin dashboard" },
            
            
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.875rem 1rem", background: "#f9fafc", borderRadius: "0.75rem", border: "1px solid #f3f4f6" }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{label}</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.125rem" }}>{desc}</p>
              </div>
              <ToggleButton
                value={settings[key as keyof Settings]}
                onChange={(v) => set(key as keyof Settings, v)}
                isAutoSaving={autoSaveStatus[key]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Login Images Manager Card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Login Page Backgrounds</h2>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Manage background images for the login page (only one can be active at a time)</p>
            <button
              onClick={() => { setEditingLoginImage(null); setLoginImageForm({ description: "", is_active: false, image: null }); setShowLoginImageModal(true); }}
              style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Background
            </button>
          </div>

          {loadingLoginImages ? (
            <div style={{ textAlign: "center", padding: "2rem" }}><div className="spinner-small" style={{ margin: "0 auto" }} /></div>
          ) : loginImages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: "#f9fafc", borderRadius: "0.5rem" }}>
              <p style={{ color: "#64748b" }}>No login backgrounds yet. Click "Add Background" to get started.</p>
            </div>
          ) : (
            loginImages.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: "1rem", padding: "1rem", background: item.is_active ? "#eef2ff" : "#f9fafc", borderRadius: "0.75rem", border: `2px solid ${item.is_active ? "#4f46e5" : "#e5e7eb"}`, marginBottom: "1rem" , color:'black'}}>
                <img src={getLoginImageUrl(item)} alt={item.description || "Login background"} style={{ width: "100px", height: "60px", borderRadius: "0.5rem", objectFit: "cover" }} onError={(e) => e.currentTarget.style.display = "none"} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "0 0 0.25rem 0" }}>{item.description || "Untitled Background"}</p>
                  <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600, background: item.is_active ? "#dcfce7" : "#fee2e2", color: item.is_active ? "#166534" : "#991b1b" }}>{item.is_active ? "● Active" : "● Inactive"}</span>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>Added: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {!item.is_active && (
                    <button onClick={() => handleSetActiveLoginImage(item.id)} style={{ padding: "0.375rem 0.75rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.75rem" }}>Set Active</button>
                  )}
                  <button
                    onClick={() => { setEditingLoginImage(item); setLoginImageForm({ description: item.description, is_active: item.is_active, image: null }); setShowLoginImageModal(true); }}
                    style={{ padding: "0.375rem", border: "1px solid #e2e8f0", borderRadius: "0.375rem", background: "#fff", cursor: "pointer" }}
                  >✏️</button>
                  <button
                    onClick={() => handleDeleteLoginImage(item.id)}
                    style={{ padding: "0.375rem", border: "1px solid #fecaca", borderRadius: "0.375rem", background: "#fff", cursor: "pointer" }}
                  >🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Carousel Manager Card */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <svg width="16" height="16" fill="none" stroke="#4f46e5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937" }}>Homepage Carousel</h2>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Manage images displayed on the homepage carousel</p>
            <button
              onClick={() => { setEditingCarouselItem(null); setCarouselForm({ description: "", is_active: true, image: null }); setShowCarouselModal(true); }}
              style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add New Image
            </button>
          </div>

          {loadingCarousel ? (
            <div style={{ textAlign: "center", padding: "2rem" }}><div className="spinner-small" style={{ margin: "0 auto" }} /></div>
          ) : carouselItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: "#f9fafc", borderRadius: "0.5rem" }}>
              <p style={{ color: "#64748b" }}>No carousel images yet. Click "Add New Image" to get started.</p>
            </div>
          ) : (
            carouselItems.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: "1rem", padding: "1rem", background: "#f9fafc", borderRadius: "0.75rem", border: `1px solid ${item.is_active ? "#4f46e5" : "#e5e7eb"}`, marginBottom: "1rem", opacity: item.is_active ? 1 : 0.6 , color:'black'}}>
                <img src={getImageUrl(item)} alt={item.description || "Carousel image"} style={{ width: "80px", height: "80px", borderRadius: "0.5rem", objectFit: "cover" }} onError={(e) => e.currentTarget.style.display = "none"} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "0 0 0.25rem 0" }}>{item.description || "Untitled Slide"}</p>
                  <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.7rem", fontWeight: 600, background: item.is_active ? "#dcfce7" : "#fee2e2", color: item.is_active ? "#166534" : "#991b1b" }}>{item.is_active ? "● Active" : "● Inactive"}</span>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>Added: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button onClick={() => toggleCarouselActive(item)} style={{ cursor: "pointer", border: "1px solid #e5e7eb", background: "#fff", borderRadius: "0.375rem", padding: "0.375rem" }}>{item.is_active ? "🔴" : "🟢"}</button>
                  <button onClick={() => { setEditingCarouselItem(item); setCarouselForm({ description: item.description, is_active: item.is_active, image: null }); setShowCarouselModal(true); }} style={{ cursor: "pointer", border: "1px solid #e5e7eb", background: "#fff", borderRadius: "0.375rem", padding: "0.375rem" }}>✏️</button>
                  <button onClick={() => handleDeleteCarouselItem(item.id)} style={{ cursor: "pointer", border: "1px solid #fecaca", background: "#fff", borderRadius: "0.375rem", padding: "0.375rem" }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
     
       

      {/* Login Image Modal */}
      <LoginImageModal
        show={showLoginImageModal}
        editingItem={editingLoginImage}
        onClose={() => { setShowLoginImageModal(false); setEditingLoginImage(null); }}
        onSubmit={editingLoginImage ? handleUpdateLoginImage : handleAddLoginImage}
        form={loginImageForm}
        onChange={setLoginImageForm}
        uploading={uploadingLoginImage}
        getImageUrl={getLoginImageUrl}
      />

      {/* Carousel Modal */}
      {showCarouselModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowCarouselModal(false)}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: "500px", width: "90%", color: "black" }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={editingCarouselItem ? handleUpdateCarouselItem : handleAddCarouselItem}>
              <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>{editingCarouselItem ? "Edit Carousel Item" : "Add New Carousel Image"}</h3>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Image (Recommended: 1200x600px)</label>
                <div style={{ width: "100%", height: "150px", border: "2px dashed #e5e7eb", borderRadius: "0.5rem", marginBottom: "0.5rem", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafc" }}>
                  {carouselForm.image
                    ? <img src={URL.createObjectURL(carouselForm.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                    : editingCarouselItem?.image_path
                      ? <img src={getImageUrl(editingCarouselItem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="current" />
                      : <span style={{ color: "#9ca3af" }}>No Image Selected</span>}
                </div>
                <input type="file" accept="image/*" onChange={(e) => setCarouselForm({ ...carouselForm, image: e.target.files?.[0] || null })} required={!editingCarouselItem} style={{ width: "100%", marginTop: "0.5rem" }} />
                <p style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "0.25rem" }}>Max 5MB. JPG, PNG, GIF, or WebP format.</p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Description (Optional)</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={editingCarouselItem ? editingCarouselItem.description : carouselForm.description}
                  onChange={(e) => editingCarouselItem ? setEditingCarouselItem({ ...editingCarouselItem, description: e.target.value }) : setCarouselForm({ ...carouselForm, description: e.target.value })}
                  placeholder="Brief description of this slide"
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingCarouselItem ? editingCarouselItem.is_active : carouselForm.is_active}
                    onChange={(e) => editingCarouselItem ? setEditingCarouselItem({ ...editingCarouselItem, is_active: e.target.checked }) : setCarouselForm({ ...carouselForm, is_active: e.target.checked })}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#1f2937" }}>Active (display on homepage)</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" onClick={() => setShowCarouselModal(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={uploadingImage} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: uploadingImage ? "#9ca3af" : "#4f46e5", color: "#fff", cursor: uploadingImage ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {uploadingImage ? "Processing..." : (editingCarouselItem ? "Save Changes" : "Add Image")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}