// src/pages/Instructor/tabs/DashboardTab.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import api from "../../../api/axios";
import QRCode from "qrcode";

interface Props {
  setActiveTab: (tab: string) => void;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
  instructor_id: string;
  department?: string;
  specialization?: string;
  role: string;
  status: string;
  profile_url?: string;
  scan_status?: string;
  last_scanned_at?: string;
  qr_payload?: string;
}

interface Schedule {
  id: number;
  subject: string;
  subject_code: string;
  day: string;
  time: string;
  end_time?: string;
  room?: string;
  status: string;
}

interface ScanLog {
  id: number;
  subject?: string;
  room?: string;
  scanned_at: string;
}

// SVG fallback for avatar
const avatarFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23e2e8f0'/%3E%3Ctext x='50' y='65' font-size='40' text-anchor='middle' fill='%2394a3b8' font-family='Arial'%3E👤%3C/text%3E%3C/svg%3E";

const statusColors: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: "#dbeafe", color: "#1d4ed8" },
  Ongoing:  { bg: "#fef9c3", color: "#a16207" },
  Present:  { bg: "#dcfce7", color: "#15803d" },
  Absent:   { bg: "#fee2e2", color: "#dc2626" },
  Attended: { bg: "#f3e8ff", color: "#7e22ce" },
};

const dayColors: Record<string, { bg: string; color: string }> = {
  'Monday': { bg: "#e0e7ff", color: "#4338ca" },
  'Tuesday': { bg: "#f3e8ff", color: "#7e22ce" },
  'Wednesday': { bg: "#dbeafe", color: "#1d4ed8" },
  'Thursday': { bg: "#fce7f3", color: "#be185d" },
  'Friday': { bg: "#dcfce7", color: "#15803d" },
  'Saturday': { bg: "#ffedd5", color: "#c2410c" },
  'Sunday': { bg: "#fee2e2", color: "#dc2626" },
};

const dayMap: Record<string, string> = {
  'Monday': 'MWF',
  'Tuesday': 'TTH',
  'Wednesday': 'MWF',
  'Thursday': 'TTH',
  'Friday': 'MWF',
  'Saturday': 'SAT',
  'Sunday': 'SUN'
};

export default function DashboardTab({ setActiveTab }: Props) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [photo, setPhoto] = useState<string>(avatarFallback);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    totalHours: "0",
    attendanceRate: 0
  });
  const [currentScheduleMessage, setCurrentScheduleMessage] = useState<string>("");
  const [currentScheduleStatus, setCurrentScheduleStatus] = useState<string>("");

  useEffect(() => {
    // Fetch instructor data
    api.get("/instructor/me")
      .then(res => {
        setInstructor(res.data);
        
        // Fetch photo as blob with auth token
        if (res.data.profile_url) {
          api.get("/instructor/photo", { responseType: "blob" })
            .then(photoRes => {
              const blobUrl = URL.createObjectURL(photoRes.data);
              setPhoto(blobUrl);
            })
            .catch(() => setPhoto(avatarFallback));
        }
        
        if (res.data.qr_payload) {
          QRCode.toDataURL(res.data.qr_payload, {
            width: 200, margin: 2,
            color: { dark: "#1f2937", light: "#ffffff" }
          }).then(url => setQrCodeDataUrl(url))
            .catch(err => console.error("Failed to generate QR code:", err));
        }
      })
      .catch(err => console.error("Failed to fetch instructor:", err));

    // Fetch schedules
    api.get("/instructor/schedules")
      .then(res => {
        const scheds = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setSchedules(scheds);
        
        // Check current schedule status
        checkCurrentSchedule(scheds);
      })
      .catch(err => console.error("Failed to fetch schedules:", err));

    // Fetch scan logs
    api.get("/instructor/scan-logs?limit=5")
      .then(res => {
        const logs = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecentScans(logs);
        
        // Calculate stats from logs
        if (logs.length > 0) {
          const uniqueDays = new Set(logs.map((log: ScanLog) => 
            new Date(log.scanned_at).toDateString()
          )).size;
          
          setStats({
            totalDays: uniqueDays || 24,
            presentDays: uniqueDays || 22,
            absentDays: Math.max(0, (uniqueDays || 24) - (uniqueDays || 22)),
            totalHours: (uniqueDays * 8).toFixed(1),
            attendanceRate: Math.round((uniqueDays / (uniqueDays + 2)) * 100) || 92
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch scan logs:", err);
      });

    // Clock tick
    const tick = setInterval(() => {
      setClock(new Date());
      // Recheck schedule every minute
      if (schedules.length > 0) {
        checkCurrentSchedule(schedules);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const checkCurrentSchedule = (scheds: Schedule[]) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const scheduleDayCode = dayMap[currentDay];
    
    // Find today's schedules
    const todaySchedules = scheds.filter(s => {
      const schedDayCode = dayMap[s.day] || s.day;
      return schedDayCode === scheduleDayCode;
    });
    
    if (todaySchedules.length === 0) {
      setCurrentScheduleMessage("No classes scheduled for today");
      setCurrentScheduleStatus("");
      return;
    }
    
    // Find current or next schedule
    let found = false;
    for (const schedule of todaySchedules.sort((a, b) => a.time.localeCompare(b.time))) {
      const scheduleTime = schedule.time.substring(0, 5);
      const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : null;
      
      if (currentTime >= scheduleTime && (!endTime || currentTime <= endTime)) {
        // Currently in class
        if (schedule.status === "Present") {
          setCurrentScheduleMessage(`You are marked PRESENT for ${schedule.subject}`);
        } else if (schedule.status === "Absent") {
          setCurrentScheduleMessage(`You were marked ABSENT for ${schedule.subject}`);
        } else {
          setCurrentScheduleMessage(`⏰ TIME TO SCAN! ${schedule.subject} is ongoing (${scheduleTime} - ${endTime || 'ongoing'})`);
        }
        setCurrentScheduleStatus(schedule.status);
        found = true;
        break;
      } else if (currentTime < scheduleTime) {
        // Upcoming class
        const minsUntil = Math.round((new Date(`1970-01-01T${scheduleTime}:00`).getTime() - new Date(`1970-01-01T${currentTime}:00`).getTime()) / 60000);
        setCurrentScheduleMessage(`Next class: ${schedule.subject} at ${scheduleTime} (in ${minsUntil} mins)`);
        setCurrentScheduleStatus("Upcoming");
        found = true;
        break;
      }
    }
    
    if (!found && todaySchedules.length > 0) {
      // All classes for today are over
      setCurrentScheduleMessage("All classes for today are completed");
      setCurrentScheduleStatus("Completed");
    }
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return alert("File size must be less than 2MB");
    setSelectedFile(file);
    setIsEditing(true);
    setImageError(false);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setIsEditing(false);
    const formData = new FormData();
    formData.append("photo", selectedFile);
    try {
      const res = await api.post("/instructor/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.profile_url) {
        setPhoto(res.data.profile_url);
        setInstructor(prev => prev ? { ...prev, profile_url: res.data.profile_url } : null);
      }
      setSelectedFile(null);
      alert("Photo updated successfully!");
    } catch {
      alert("Failed to upload photo.");
      setIsEditing(true);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setPhoto(instructor?.profile_url || avatarFallback);
    setSelectedFile(null);
    setIsEditing(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setPhoto(avatarFallback);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !instructor) return;
    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = `qr-${instructor.instructor_id}.png`;
    link.click();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-PH", { 
        month: "short", 
        day: "numeric", 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch {
      return iso;
    }
  };

  const getScheduleStatusDisplay = (schedule: Schedule) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const scheduleTime = schedule.time.substring(0, 5);
    const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : null;
    
    if (currentTime >= scheduleTime && (!endTime || currentTime <= endTime)) {
      return "🔴 ONGOING";
    }
    return "";
  };

  if (!instructor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Sort schedules by day and time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={imageError ? avatarFallback : photo}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                  onError={handleImageError}
                />
                
                {!isEditing && !uploading && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoSelect}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              
              <h2 className="mt-4 text-lg font-semibold text-gray-800">{instructor.name}</h2>
              <p className="text-sm text-gray-500">{instructor.email}</p>
              
              <span className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                {instructor.role}
              </span>
              
              {instructor.department && (
                <p className="text-sm text-gray-600 mt-3">{instructor.department}</p>
              )}
              
              <div className="mt-3 text-xs text-gray-400 font-mono">
                ID: {instructor.instructor_id}
              </div>

              

              {/* Edit buttons */}
              {isEditing && !uploading && (
                <div className="mt-4 flex gap-2 w-full">
                  <button
                    onClick={handleSavePhoto}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {uploading && (
                <div className="mt-4 flex items-center text-indigo-600 text-sm">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Your QR Code
              </h3>
              
              {qrCodeDataUrl && instructor && (
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR
                </button>
              )}
            </div>
            
            {!instructor.qr_payload ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">QR code not available</p>
                <p className="text-xs text-gray-400 mt-2">Contact your administrator</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {qrCodeDataUrl ? (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                      <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40 md:w-48 md:h-48" />
                    </div>
                    
                    <button
                      onClick={handleDownloadQR}
                      className="md:hidden w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                  </>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-3">Generating QR code...</p>
                  </div>
                )}
                
                <p className="mt-4 text-sm text-gray-600 text-center max-w-sm">
                  Present this QR code to the scanner to mark your attendance.
                </p>
                <p className="mt-2 text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {instructor.instructor_id}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Schedule Status Message */}
      {currentScheduleMessage && (
        <div className={`p-4 rounded-lg ${
          currentScheduleMessage.includes('TIME TO SCAN') ? 'bg-green-100 border-l-4 border-green-500' :
          currentScheduleMessage.includes('PRESENT') ? 'bg-blue-100 border-l-4 border-blue-500' :
          currentScheduleMessage.includes('Next class') ? 'bg-yellow-100 border-l-4 border-yellow-500' :
          'bg-gray-100 border-l-4 border-gray-500'
        }`}>
          <p className={`text-sm ${
            currentScheduleMessage.includes('TIME TO SCAN') ? 'text-green-800' :
            currentScheduleMessage.includes('PRESENT') ? 'text-blue-800' :
            currentScheduleMessage.includes('Next class') ? 'text-yellow-800' :
            'text-gray-800'
          }`}>
            {currentScheduleMessage}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Days</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalDays}</p>
          <p className="text-xs text-gray-400 mt-1">This semester</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.presentDays}</p>
          <p className="text-xs text-green-600 mt-1">{stats.attendanceRate}% rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.absentDays}</p>
          <p className="text-xs text-yellow-600 mt-1">Need improvement</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Hours</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalHours}</p>
          <p className="text-xs text-blue-600 mt-1">Total worked</p>
        </div>
      </div>

      {/* My Schedules - Descending Order */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Schedules</h3>
        
        {schedules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No schedules assigned</p>
        ) : (
          <div className="space-y-3">
            {sortedSchedules.map((schedule) => {
              const now = new Date();
              const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
              const scheduleTime = schedule.time.substring(0, 5);
              const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : null;
              const isOngoing = currentTime >= scheduleTime && (!endTime || currentTime <= endTime);
              
              return (
                <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[100px]">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                        background: dayColors[schedule.day]?.bg || '#eef2ff',
                        color: dayColors[schedule.day]?.color || '#4f46e5'
                      }}>
                        {schedule.day}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {schedule.subject}
                        <span className="ml-2 text-xs font-mono text-gray-500">({schedule.subject_code})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {schedule.time.substring(0, 5)}{schedule.end_time ? ` - ${schedule.end_time.substring(0, 5)}` : ''}
                        {schedule.room && ` • Room ${schedule.room}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isOngoing && schedule.status !== 'Present' && schedule.status !== 'Attended' && (
                      <span className="text-xs font-medium text-red-600 animate-pulse">
                        ⏰ SCAN NOW
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                      background: statusColors[schedule.status]?.bg || '#f3f4f6',
                      color: statusColors[schedule.status]?.color || '#6b7280'
                    }}>
                      {schedule.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Scan Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <button 
            onClick={() => setActiveTab("logs")}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {recentScans.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No scan history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentScans.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{log.subject || 'Attendance scan'}</p>
                    <p className="text-xs text-gray-500">
                      {log.room && `Room ${log.room} • `}{formatTime(log.scanned_at)}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Scanned
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}