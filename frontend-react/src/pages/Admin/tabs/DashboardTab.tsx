// src/pages/Admin/tabs/DashboardTab.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../../../api/axios";
import { useSocket } from "../../../hooks/useSocket";

interface Props {
  setActiveTab: (tab: string) => void;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  active_rate: number;
  total_events: number;
  upcoming_events: number;
}

interface Scan {
  name: string;
  instructor_id: string;
  department: string;
  scan_status: string;
  last_scanned_at: string;
}

interface ActivityLog {
  id: number;
  instructor_id?: string;
  staff_id?: string;
  name: string;
  type: string;
  college?: string;
  subject?: string;
  scan_schedule?: string;
  device_id?: number;
  description?: string;
  created_at: string;
}

interface DepartmentStat {
  department: string;
  count: number;
  active_count: number;
  percentage: number;
}

interface EventStat {
  month: string;
  count: number;
  type: "upcoming" | "past";
}

interface Device {
  id: number;
  name: string;
  status: "online" | "offline";
  paired: boolean;
  last_seen: string | null;
}

interface ModalData {
  type: "instructors" | "events";
  title: string;
}

interface ScanAnalytics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyData: { date: string; day: number; count: number }[];
  monthlyData: { month: string; count: number; year: number; monthNum: number }[];
  selectedMonth: string;
}

interface AbsentLog {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  department: string;
  date: string;
  time: string;
  status: string;
}

interface LateLog {
  id: number;
  instructor_id: string;
  name: string;
  subject: string;
  minutes_late: number;
  scanned_at: string;
  schedule_time: string;
  department: string;
  date?: string;
  created_at?: string;
  full_datetime?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  border: "1px solid #e9eef3",
  overflow: "hidden",
  transition: "all 0.2s ease",
};

// ─── Animated number helpers ──────────────────────────────────────────────────

const AnimatedNumber = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.floor(start + (end - start) * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
};

const AnimatedPercentage = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplay(start + (end - start) * ease);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return <span>{display.toFixed(1)}%</span>;
};

// ─── Native canvas line chart ────────────────────────────────────────────────

const AttendanceLineChart = ({
  data,
  selectedMonth,
  type,
}: {
  data: { day: number; count: number; date: string }[];
  selectedMonth: string;
  type: "scans" | "absent" | "late";
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | undefined>(undefined);
  const tipRef    = useRef<{ idx: number } | null>(null);

  const getColor = () => {
    switch (type) {
      case "scans": return { line: "#3b82f6", fill: "rgba(59,130,246,0.18)", glow: "rgba(59,130,246,0.2)" };
      case "absent": return { line: "#ef4444", fill: "rgba(239,68,68,0.18)", glow: "rgba(239,68,68,0.2)" };
      case "late": return { line: "#f59e0b", fill: "rgba(245,158,11,0.18)", glow: "rgba(245,158,11,0.2)" };
      default: return { line: "#3b82f6", fill: "rgba(59,130,246,0.18)", glow: "rgba(59,130,246,0.2)" };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W   = rect.width;
    const H   = rect.height;
    const pad = { top: 24, right: 24, bottom: 40, left: 44 };
    const cW  = W - pad.left - pad.right;
    const cH  = H - pad.top  - pad.bottom;
    const colors = getColor();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (data.length === 0 || data.every(d => d.count === 0)) {
        ctx.font      = "14px system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText(`No ${type} data for ${selectedMonth}`, W / 2, H / 2);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const maxVal = Math.max(...data.map((d) => d.count), 1);
      const xOf    = (i: number) =>
        pad.left + (data.length < 2 ? cW / 2 : (i / (data.length - 1)) * cW);
      const yOf    = (v: number) => pad.top + cH - (v / maxVal) * cH;

      const gridSteps = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth   = 0.5;
      ctx.font        = "11px system-ui, sans-serif";
      ctx.fillStyle   = "#94a3b8";
      ctx.textAlign   = "right";
      for (let i = 0; i <= gridSteps; i++) {
        const y = pad.top + (cH / gridSteps) * i;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        ctx.fillText(String(Math.round((maxVal / gridSteps) * (gridSteps - i))), pad.left - 8, y + 4);
      }

      ctx.textAlign = "center";
      const step = Math.ceil(data.length / 10);
      for (let i = 0; i < data.length; i += step) {
        ctx.fillText(String(data[i].day), xOf(i), H - pad.bottom + 16);
      }

      const cp = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
        cp1: { x: a.x + (b.x - a.x) / 3, y: a.y },
        cp2: { x: b.x - (b.x - a.x) / 3, y: b.y },
      });

      const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.count) }));

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const { cp1, cp2 } = cp(pts[i - 1], pts[i]);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pts[i].x, pts[i].y);
      }
      ctx.lineTo(pts[pts.length - 1].x, pad.top + cH);
      ctx.lineTo(pts[0].x, pad.top + cH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
      grad.addColorStop(0, colors.fill);
      grad.addColorStop(1, "rgba(0,0,0,0.01)");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const { cp1, cp2 } = cp(pts[i - 1], pts[i]);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = colors.line;
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = "round";
      ctx.stroke();

      pts.forEach((p, i) => {
        if (data[i].count === 0) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, data.length > 20 ? 3 : 5, 0, Math.PI * 2);
        ctx.fillStyle   = colors.line;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth   = 2;
        ctx.stroke();
      });

      if (tipRef.current !== null) {
        const { idx } = tipRef.current;
        const p   = pts[idx];
        const tW  = 94, tH = 44, tR = 6;
        let tx = p.x - tW / 2;
        let ty = p.y - tH - 12;
        tx = Math.max(pad.left, Math.min(W - pad.right - tW, tx));
        if (ty < pad.top) ty = p.y + 12;

        ctx.fillStyle   = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(tx, ty, tW, tH, tR);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.font      = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Day ${data[idx].day}`, tx + 10, ty + 16);
        ctx.fillStyle = "#64748b";
        ctx.font      = "11px system-ui, sans-serif";
        ctx.fillText(`${data[idx].count} ${type}`, tx + 10, ty + 32);

        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle   = colors.line;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data, selectedMonth, type]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const cW   = rect.width - 44 - 24;
    let closest = 0, minDist = Infinity;
    data.forEach((_, i) => {
      const x    = 44 + (data.length < 2 ? cW / 2 : (i / (data.length - 1)) * cW);
      const dist = Math.abs(mx - x);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    tipRef.current = minDist < 30 ? { idx: closest } : null;
  };

  const handleMouseLeave = () => { tipRef.current = null; };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ width: "100%", height: 260, display: "block", cursor: "crosshair" }}
    />
  );
};

// ─── Analytics summary cards ──────────────────────────────────────────────────

const AnalyticsSummary = ({
  today, thisWeek, thisMonth, type,
}: {
  today: number; thisWeek: number; thisMonth: number; type: string;
}) => {
  const getColors = () => {
    switch (type) {
      case "scans": return { color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe", subColor: "#3b82f6" };
      case "absent": return { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", subColor: "#ef4444" };
      case "late": return { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", subColor: "#d97706" };
      default: return { color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe", subColor: "#3b82f6" };
    }
  };
  const colors = getColors();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
      {[
        { label: "Today", value: today, sub: `${type} records` },
        { label: "This Week", value: thisWeek, sub: `total ${type}` },
        { label: "This Month", value: thisMonth, sub: `total ${type}` },
      ].map((item) => (
        <div key={item.label} style={{ background: colors.bg, borderRadius: "0.75rem", padding: "1rem", textAlign: "center", border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: colors.color, textTransform: "uppercase", margin: "0 0 4px" }}>{item.label}</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b", margin: "0 0 2px" }}><AnimatedNumber value={item.value} duration={500} /></p>
          <p style={{ fontSize: "0.65rem", color: colors.subColor, margin: 0 }}>{item.sub}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Wave chart ───────────────────────────────────────────────────────────────

const WaveChart = ({ activeRate }: { activeRate: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | undefined>(undefined);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = 500), H = (canvas.height = 200);
    const amplitude = (activeRate / 100) * 45, freq = 0.02;
    const draw = () => {
      timeRef.current += 0.015;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "#f1f5f9"; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = H - (i * H) / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, H / 2);
      for (let x = 0; x <= W; x++) {
        const y = H / 2 - Math.sin(x * freq + timeRef.current) * amplitude - Math.sin(x * freq * 2 + timeRef.current * 1.5) * amplitude * 0.3;
        ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(59,130,246,0.3)"); grad.addColorStop(1, "rgba(59,130,246,0.02)");
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.font = "bold 24px system-ui, sans-serif"; ctx.fillStyle = "#1e293b";
      ctx.fillText(`${activeRate}%`, W / 2 - 30, H / 2 - 10);
      ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = "#64748b";
      ctx.fillText("Active Rate Trend", W / 2 - 55, H - 15);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeRate]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: "0.75rem", background: "#fafbfc" }} />;
};

// ─── Live indicator ───────────────────────────────────────────────────────────

const LiveIndicator = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
    <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 500 }}>Live</span>
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardTab({ setActiveTab }: Props) {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, active_rate: 0, total_events: 0, upcoming_events: 0 });
  const [scans, setScans] = useState<Scan[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [scanActivities, setScanActivities] = useState<ActivityLog[]>([]);
  const [absentLogs, setAbsentLogs] = useState<AbsentLog[]>([]);
  const [lateLogs, setLateLogs] = useState<LateLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [analyticsType, setAnalyticsType] = useState<"scans" | "absent" | "late">("scans");
  
  // Analytics state for scans
  const [scanAnalytics, setScanAnalytics] = useState<ScanAnalytics>({
    today: 0, thisWeek: 0, thisMonth: 0, dailyData: [], monthlyData: [],
    selectedMonth: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
  });
  
  // Analytics state for absent
  const [absentAnalytics, setAbsentAnalytics] = useState<ScanAnalytics>({
    today: 0, thisWeek: 0, thisMonth: 0, dailyData: [], monthlyData: [],
    selectedMonth: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
  });
  
  // Analytics state for late
  const [lateAnalytics, setLateAnalytics] = useState<ScanAnalytics>({
    today: 0, thisWeek: 0, thisMonth: 0, dailyData: [], monthlyData: [],
    selectedMonth: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
  });
  
  const [dailyData, setDailyData] = useState<{ day: number; count: number; date: string }[]>([]);
  const [scansLoading, setScansLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [showWelcomeText, setShowWelcomeText] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!showWelcomeText) return;
    const t = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => { setShowWelcomeText(false); setIsFadingOut(false); }, 500);
    }, 5000);
    return () => clearTimeout(t);
  }, [showWelcomeText]);

  const fetchStats = useCallback(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const fetchScans = useCallback(() => {
    api.get("/admin/recent-scans")
      .then((r) => { 
        setScans(r.data); 
        setScansLoading(false);
      })
      .catch(() => setScansLoading(false));
  }, []);

  // Helper to validate dates
  const isValidDate = (dateValue: any): boolean => {
    if (!dateValue) return false;
    const d = new Date(dateValue);
    return !isNaN(d.getTime());
  };

  // Calculate analytics from attendance logs with validation
  const calculateAnalyticsFromAttendanceLogs = useCallback((logs: any[], dateField: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let todayCount = 0, weekCount = 0, monthCount = 0;
    const monthlyMap = new Map<string, { count: number; year: number; monthNum: number }>();
    
    logs.forEach((log) => {
      let dateValue = log[dateField] || log.created_at || log.date || log.full_datetime;
      if (!isValidDate(dateValue)) return;
      
      const d = new Date(dateValue);
      const dateStr = d.toISOString().split("T")[0];
      
      if (dateStr === todayStr) todayCount++;
      if (d >= weekStart) weekCount++;
      if (d >= monthStart) monthCount++;
      
      const key = d.toLocaleString("default", { month: "long", year: "numeric" });
      const ex = monthlyMap.get(key);
      if (ex) ex.count++;
      else monthlyMap.set(key, { count: 1, year: d.getFullYear(), monthNum: d.getMonth() + 1 });
    });
    
    let monthlyDataArray = Array.from(monthlyMap.entries())
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => b.year - a.year || b.monthNum - a.monthNum)
      .slice(0, 6);
    
    if (monthlyDataArray.length === 0) {
      const currentMonth = now.toLocaleString("default", { month: "long", year: "numeric" });
      monthlyDataArray.push({ 
        month: currentMonth, 
        count: 0, 
        year: now.getFullYear(), 
        monthNum: now.getMonth() + 1 
      });
    }
    
    return { todayCount, weekCount, monthCount, monthlyDataArray };
  }, []);

  // Fetch absent logs
  const fetchAbsentLogs = useCallback(async () => {
    try {
      const response = await api.get("/admin/attendance/recent-absent");
      const data = response.data.data || [];
      setAbsentLogs(data);
      
      const validLogs = data.filter((log: any) => isValidDate(log.date || log.created_at));
      const analytics = calculateAnalyticsFromAttendanceLogs(validLogs, "date");
      setAbsentAnalytics((prev) => ({ 
        ...prev, 
        today: analytics.todayCount, 
        thisWeek: analytics.weekCount, 
        thisMonth: analytics.monthCount, 
        monthlyData: analytics.monthlyDataArray 
      }));
    } catch (error) {
      console.error("Failed to fetch absent logs:", error);
      setAbsentLogs([]);
    }
  }, [calculateAnalyticsFromAttendanceLogs]);

  // Fetch late logs with transformation
  const fetchLateLogs = useCallback(async () => {
    try {
      const response = await api.get("/admin/attendance/late-records");
      const data = response.data.data || [];
      
      // Transform the data to ensure we have proper date fields
      const transformedData = data.map((log: any) => {
        let fullDate = log.date || log.created_at;
        
        // If scanned_at is a time string and we have a date, combine them
        if (log.scanned_at && !log.scanned_at.includes('-') && !log.scanned_at.includes('/')) {
          if (fullDate) {
            const datePart = fullDate.split('T')[0];
            fullDate = `${datePart}T${log.scanned_at}:00`;
          } else {
            const today = new Date().toISOString().split('T')[0];
            fullDate = `${today}T${log.scanned_at}:00`;
          }
        }
        
        return {
          ...log,
          full_datetime: fullDate,
          created_at: fullDate || log.created_at
        };
      });
      
      setLateLogs(transformedData);
      
      const validLogs = transformedData.filter((log: any) => isValidDate(log.full_datetime || log.created_at));
      const analytics = calculateAnalyticsFromAttendanceLogs(validLogs, "full_datetime");
      setLateAnalytics((prev) => ({ 
        ...prev, 
        today: analytics.todayCount, 
        thisWeek: analytics.weekCount, 
        thisMonth: analytics.monthCount, 
        monthlyData: analytics.monthlyDataArray 
      }));
    } catch (error) {
      console.error("Failed to fetch late logs:", error);
      setLateLogs([]);
    }
  }, [calculateAnalyticsFromAttendanceLogs]);

  // Build daily data from activities
  const buildDailyDataFromActivities = useCallback((activitiesData: ActivityLog[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyMap = new Map<number, number>();
    
    activitiesData.forEach((activity) => {
      if (!isValidDate(activity.created_at)) return;
      const activityDate = new Date(activity.created_at);
      if (activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear) {
        const day = activityDate.getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }
    });
    
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        day,
        count: dailyMap.get(day) || 0,
        date: `${currentYear}-${currentMonth + 1}-${day}`
      });
    }
    return result;
  }, []);

  // Build daily data from attendance logs
  const buildDailyDataFromAttendanceLogs = useCallback((logs: any[], dateField: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyMap = new Map<number, number>();
    
    logs.forEach((log) => {
      let dateValue = log.full_datetime || log[dateField] || log.created_at || log.date;
      if (!isValidDate(dateValue)) return;
      const logDate = new Date(dateValue);
      if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
        const day = logDate.getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }
    });
    
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        day,
        count: dailyMap.get(day) || 0,
        date: `${currentYear}-${currentMonth + 1}-${day}`
      });
    }
    return result;
  }, []);

  // Fetch scan activities
  const fetchScanActivities = useCallback(async () => {
    try {
      const scansRes = await api.get("/admin/activities", { params: { type: "scan", limit: 1000 } });
      let scanData: ActivityLog[] = [];
      
      if (scansRes.data.success && scansRes.data.data) scanData = scansRes.data.data;
      else if (Array.isArray(scansRes.data)) scanData = scansRes.data;
      else if (scansRes.data.data && Array.isArray(scansRes.data.data)) scanData = scansRes.data.data;
      
      setScanActivities(scanData);
      
      if (scanData.length > 0) {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        let todayCount = 0, weekCount = 0, monthCount = 0;
        const monthlyMap = new Map<string, { count: number; year: number; monthNum: number }>();
        
        scanData.forEach((activity) => {
          if (!isValidDate(activity.created_at)) return;
          const d = new Date(activity.created_at);
          const dateStr = d.toISOString().split("T")[0];
          
          if (dateStr === todayStr) todayCount++;
          if (d >= weekStart) weekCount++;
          if (d >= monthStart) monthCount++;
          
          const key = d.toLocaleString("default", { month: "long", year: "numeric" });
          const ex = monthlyMap.get(key);
          if (ex) ex.count++;
          else monthlyMap.set(key, { count: 1, year: d.getFullYear(), monthNum: d.getMonth() + 1 });
        });
        
        const monthlyDataArray = Array.from(monthlyMap.entries())
          .map(([month, v]) => ({ month, ...v }))
          .sort((a, b) => b.year - a.year || b.monthNum - a.monthNum)
          .slice(0, 6);
        
        setScanAnalytics((prev) => ({ 
          ...prev, 
          today: todayCount, 
          thisWeek: weekCount, 
          thisMonth: monthCount, 
          monthlyData: monthlyDataArray 
        }));
      }
    } catch (error) {
      console.error("Failed to fetch scan activities:", error);
    }
  }, []);

  const fetchActivities = useCallback(() => {
    api.get("/admin/activities", { params: { limit: 10 } })
      .then((r) => {
        if (Array.isArray(r.data)) setActivities(r.data);
        else if (Array.isArray(r.data?.data)) setActivities(r.data.data);
        else setActivities([]);
        setActivitiesLoading(false);
      })
      .catch(() => setActivitiesLoading(false));
  }, []);

  const fetchDevices = useCallback(() => {
    api.get("/devices").then((r) => { setDevices(r.data); setDevicesLoading(false); }).catch(() => setDevicesLoading(false));
  }, []);

  const getCurrentAnalytics = () => {
    switch (analyticsType) {
      case "scans": return scanAnalytics;
      case "absent": return absentAnalytics;
      case "late": return lateAnalytics;
      default: return scanAnalytics;
    }
  };

  const getCurrentData = () => {
    switch (analyticsType) {
      case "scans": 
        return buildDailyDataFromActivities(scanActivities);
      case "absent": 
        return buildDailyDataFromAttendanceLogs(absentLogs, "date");
      case "late": 
        return buildDailyDataFromAttendanceLogs(lateLogs, "full_datetime");
      default: 
        return buildDailyDataFromActivities(scanActivities);
    }
  };

  const handleTypeChange = (type: "scans" | "absent" | "late") => {
    setAnalyticsType(type);
    const currentData = getCurrentData();
    setDailyData(currentData);
  };

  const handleMonthChange = (month: string) => {
    const analytics = getCurrentAnalytics();
    
    if (analyticsType === "scans") {
      setScanAnalytics(prev => ({ ...prev, selectedMonth: month }));
    } else if (analyticsType === "absent") {
      setAbsentAnalytics(prev => ({ ...prev, selectedMonth: month }));
    } else {
      setLateAnalytics(prev => ({ ...prev, selectedMonth: month }));
    }
    
    const d = new Date(month);
    if (!isValidDate(d)) {
      console.error("Invalid month date:", month);
      return;
    }
    
    const year = d.getFullYear();
    const monthNum = d.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const dailyMap = new Map<number, number>();
    
    let dataSource: any[] = [];
    if (analyticsType === "scans") {
      dataSource = scanActivities;
      dataSource.forEach((activity) => {
        if (!isValidDate(activity.created_at)) return;
        const activityDate = new Date(activity.created_at);
        if (activityDate.getMonth() === monthNum && activityDate.getFullYear() === year) {
          const day = activityDate.getDate();
          dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        }
      });
    } else if (analyticsType === "absent") {
      dataSource = absentLogs;
      dataSource.forEach((log) => {
        const dateValue = log.date || log.created_at;
        if (!isValidDate(dateValue)) return;
        const logDate = new Date(dateValue);
        if (logDate.getMonth() === monthNum && logDate.getFullYear() === year) {
          const day = logDate.getDate();
          dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        }
      });
    } else {
      dataSource = lateLogs;
      dataSource.forEach((log) => {
        const dateValue = log.full_datetime || log.created_at || log.date;
        if (!isValidDate(dateValue)) return;
        const logDate = new Date(dateValue);
        if (logDate.getMonth() === monthNum && logDate.getFullYear() === year) {
          const day = logDate.getDate();
          dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        }
      });
    }
    
    const newDailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      newDailyData.push({
        day,
        count: dailyMap.get(day) || 0,
        date: `${year}-${monthNum + 1}-${day}`
      });
    }
    setDailyData(newDailyData);
  };

  useSocket({
    room: "admin",
    onScan: (data) => {
      setLastUpdate(new Date());
      
      const newScan: Scan = {
        name: data.name,
        instructor_id: data.instructor_id,
        department: data.department ?? "—",
        scan_status: data.status === "Present" ? "scanned" : data.status,
        last_scanned_at: data.scanned_at ?? new Date().toISOString(),
      };
      setScans((prev) => [newScan, ...prev].slice(0, 10));
      
      if (data.device_id) {
        setDevices((prev) => prev.map((d) => 
          d.id === data.device_id ? { ...d, status: "online", last_seen: new Date().toISOString() } : d
        ));
      }
      
      fetchScanActivities();
      fetchScans();
      fetchAbsentLogs();
      fetchLateLogs();
    },
    onActivityUpdate: (data) => {
      setLastUpdate(new Date());
      const newActivity: ActivityLog = {
        id: data.id ?? Date.now(),
        name: data.name,
        type: data.type,
        instructor_id: data.instructor_id ?? undefined,
        subject: data.subject ?? undefined,
        description: data.description ?? undefined,
        created_at: data.created_at ?? new Date().toISOString(),
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 10));
      
      if (data.type === "scan") {
        fetchScanActivities();
      }
      
      setActivitiesLoading(false);
    },
    onStatsUpdate: (data) => { setLastUpdate(new Date()); setStats((p) => ({ ...p, ...data })); },
    onDeviceUpdate: (data) => { setLastUpdate(new Date()); setDevices((prev) => prev.map((d) => d.id === data.device_id ? { ...d, status: data.status, last_seen: data.last_seen ?? d.last_seen } : d)); },
    onInstructorUpdate: () => { fetchActivities(); fetchStats(); fetchScanActivities(); fetchScans(); fetchAbsentLogs(); fetchLateLogs(); },
    onScheduleUpdate: () => { fetchActivities(); },
    onAttendanceUpdate: () => { fetchActivities(); fetchScanActivities(); fetchStats(); fetchScans(); fetchAbsentLogs(); fetchLateLogs(); },
  });

  useEffect(() => {
    fetchStats(); 
    fetchScanActivities();
    fetchScans();
    fetchAbsentLogs();
    fetchLateLogs();
    fetchActivities(); 
    fetchDevices();
    
    const interval = setInterval(() => { 
      fetchStats(); 
      fetchScanActivities();
      fetchScans();
      fetchAbsentLogs();
      fetchLateLogs();
      fetchActivities(); 
      fetchDevices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchScanActivities, fetchScans, fetchAbsentLogs, fetchLateLogs, fetchActivities, fetchDevices]);

  // Update daily data when analytics type changes
  useEffect(() => {
    const currentData = getCurrentData();
    setDailyData(currentData);
  }, [analyticsType, scanActivities, absentLogs, lateLogs]);

  const fetchDepartmentStats = async () => { setModalLoading(true); try { const r = await api.get("/admin/stats/departments"); setDepartmentStats(r.data); } catch { /**/ } finally { setModalLoading(false); } };
  const fetchEventStats      = async () => { setModalLoading(true); try { const r = await api.get("/admin/stats/events");       setEventStats(r.data);      } catch { /**/ } finally { setModalLoading(false); } };

  const handleCardClick = (type: "instructors" | "events") => {
    setModalData({ type, title: type === "instructors" ? "Instructor Statistics" : "Event Statistics" });
    if (type === "instructors") fetchDepartmentStats(); else fetchEventStats();
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setModalData(null); setDepartmentStats([]); setEventStats([]); };

  const formatTime = (iso: string) => {
    if (!isValidDate(iso)) return "Invalid date";
    return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  };
  
  const formatDate = (dateStr: string) => {
    if (!isValidDate(dateStr)) return "Invalid date";
    const d = new Date(dateStr), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };
  
  const formatLastSeen = (ts: string | null) => {
    if (!ts) return "Never";
    if (!isValidDate(ts)) return "Invalid";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(ts).toLocaleTimeString();
  };
  
  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      scan: "📱", create: "➕", update: "✏️", delete: "🗑️",
      login: "🔐", logout: "🚪", security_change: "🔒", status_change: "🔄",
      event_create: "📅", event_update: "📅", event_delete: "📅",
      schedule_create: "⏰", schedule_delete: "⏰", subject_create: "📚",
      subject_update: "📚", subject_delete: "📚", department_create: "🏛️",
      department_update: "🏛️", department_delete: "🏛️", staff_create: "👤",
      staff_delete: "👤", staff_status_change: "👤", profile_update: "👤",
      absent: "❌", late: "⏰"
    };
    return icons[type] ?? "📋";
  };
  
  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      scan: "#eff6ff", create: "#eff6ff", update: "#fef9c3", delete: "#fee2e2",
      login: "#eff6ff", logout: "#f3f4f6", security_change: "#ffedd5",
      status_change: "#fce7f3", absent: "#fef2f2", late: "#fffbeb"
    };
    return colors[type] ?? "#f3f4f6";
  };

  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const pairedDevices = devices.filter((d) => d.paired).length;
  const totalDevices = devices.length;
  const currentAnalytics = getCurrentAnalytics();

  const statCards = [
    { label:"Total Instructors", value:stats.total, color:"#3b82f6", bg:"#eff6ff", icon:"👥", sub:`${stats.active} active · ${stats.inactive} inactive`, clickable:true, type:"instructors" as const },
    { label:"Active Instructors",value:stats.active, color:"#10b981", bg:"#ecfdf5", icon:"✅", sub:`${stats.active_rate}% active rate`, clickable:true, type:"instructors" as const },
    { label:"Total Events", value:stats.total_events, color:"#8b5cf6", bg:"#f5f3ff", icon:"📅", sub:`${stats.upcoming_events} upcoming`, clickable:true, type:"events" as const },
    { label:"Total Devices", value:totalDevices, color:"#06b6d4", bg:"#ecfeff", icon:"📱", sub:`${pairedDevices} paired · ${onlineDevices} online`, clickable:false },
    { label:"Online Devices", value:onlineDevices, color:"#10b981", bg:"#ecfdf5", icon:"🟢", sub:`${totalDevices - onlineDevices} offline`, clickable:false },
    { label:"Active Rate", value:stats.active_rate, color:"#f59e0b", bg:"#fffbeb", icon:"📊", sub:"Active instructors", clickable:true, type:"instructors" as const, isPercentage:true },
  ];

  const quickActions = [
    { label:"Add Instructor", icon:"👨‍🏫", color:"#3b82f6", bg:"#eff6ff", tab:"add-instructor" },
    { label:"Add Staff", icon:"👥", color:"#3b82f6", bg:"#eff6ff", tab:"add-staff" },
    { label:"Add Subject", icon:"📚", color:"#3b82f6", bg:"#eff6ff", tab:"add-subject" },
    { label:"Add Department", icon:"🏛️", color:"#3b82f6", bg:"#eff6ff", tab:"add-department" },
    { label:"Manage Devices", icon:"🔌", color:"#3b82f6", bg:"#eff6ff", tab:"device" },
    { label:"View Reports", icon:"📊", color:"#64748b", bg:"#f1f5f9", tab:null },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {/* Welcome Banner */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", borderRadius:"1rem", padding:"1.5rem 2rem", color:"#fff", border:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <p style={{ fontSize:"0.7rem", color:"#94a3b8", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>Admin Dashboard</p>
            {showWelcomeText
              ? <h1 style={{ fontSize:"1.5rem", fontWeight:600, animation:isFadingOut ? "fadeOut 0.5s ease-out forwards" : "fadeIn 0.5s ease-in", margin:0 }}>Welcome back, Admin! 👋</h1>
              : <h1 style={{ fontSize:"1.5rem", fontWeight:600, margin:0 }}>Dashboard Overview</h1>}
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginTop:"0.5rem" }}>
              <p style={{ color:"#94a3b8", fontSize:"0.8rem", margin:0 }}>{new Date().toLocaleDateString("en-PH", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}</p>
              <LiveIndicator />
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:"1.75rem", fontWeight:600, color:"#fbbf24", margin:0 }}>{new Date().toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit", hour12:true })}</p>
            <span style={{ fontSize:"0.65rem", background:"rgba(251,191,36,0.1)", color:"#fbbf24", padding:"0.2rem 0.6rem", borderRadius:"999px" }}>Last update: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1rem" }}>
        {statCards.map((card, idx) => (
          <div key={idx} onClick={() => card.clickable && card.type ? handleCardClick(card.type) : undefined}
            style={{ ...cardStyle, padding:"1rem", cursor:card.clickable ? "pointer" : "default", borderTop:`3px solid ${card.color}` }}
            onMouseEnter={(e) => { if (card.clickable) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 25px -6px rgba(0,0,0,0.1)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)"; }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
              <span style={{ fontSize:"1.5rem" }}>{card.icon}</span>
              <span style={{ fontSize:"0.65rem", fontWeight:500, color:card.color, background:card.bg, padding:"0.2rem 0.6rem", borderRadius:"999px" }}>{card.label}</span>
            </div>
            <p style={{ fontSize:"1.5rem", fontWeight:700, color:"#0f172a", margin:"0 0 0.25rem" }}>
              {card.isPercentage ? <AnimatedPercentage value={card.value} /> : <AnimatedNumber value={card.value} />}
            </p>
            <p style={{ fontSize:"0.7rem", color:"#64748b", margin:0 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Attendance Analytics with Tabs */}
      <div style={cardStyle}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3", background:"#f8fafc" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", display:"flex", alignItems:"center", gap:"0.5rem", margin:0 }}>
                <span>📊</span> Attendance Analytics <LiveIndicator />
              </h3>
              <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.25rem", marginBottom:0 }}>Track scans, absences, and late arrivals</p>
            </div>
            <div style={{ display:"flex", gap:"0.5rem", background:"#f1f5f9", padding:"0.25rem", borderRadius:"0.5rem" }}>
              <button
                onClick={() => handleTypeChange("scans")}
                style={{
                  padding:"0.375rem 1rem",
                  borderRadius:"0.375rem",
                  border:"none",
                  fontSize:"0.75rem",
                  fontWeight:500,
                  cursor:"pointer",
                  background: analyticsType === "scans" ? "#3b82f6" : "transparent",
                  color: analyticsType === "scans" ? "#fff" : "#64748b",
                  transition:"all 0.2s"
                }}
              >
                ✅ Scans
              </button>
              <button
                onClick={() => handleTypeChange("absent")}
                style={{
                  padding:"0.375rem 1rem",
                  borderRadius:"0.375rem",
                  border:"none",
                  fontSize:"0.75rem",
                  fontWeight:500,
                  cursor:"pointer",
                  background: analyticsType === "absent" ? "#ef4444" : "transparent",
                  color: analyticsType === "absent" ? "#fff" : "#64748b",
                  transition:"all 0.2s"
                }}
              >
                ❌ Absent
              </button>
              <button
                onClick={() => handleTypeChange("late")}
                style={{
                  padding:"0.375rem 1rem",
                  borderRadius:"0.375rem",
                  border:"none",
                  fontSize:"0.75rem",
                  fontWeight:500,
                  cursor:"pointer",
                  background: analyticsType === "late" ? "#f59e0b" : "transparent",
                  color: analyticsType === "late" ? "#fff" : "#64748b",
                  transition:"all 0.2s"
                }}
              >
                ⏰ Late
              </button>
            </div>
            <select value={currentAnalytics.selectedMonth} onChange={(e) => handleMonthChange(e.target.value)}
              style={{ padding:"0.4rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.75rem", background:"#fff", cursor:"pointer" }}>
              {currentAnalytics.monthlyData.length > 0 ? (
                currentAnalytics.monthlyData.map((m, i) => <option key={i} value={m.month}>{m.month}</option>)
              ) : (
                <option value={new Date().toLocaleString("default", { month:"long", year:"numeric" })}>
                  {new Date().toLocaleString("default", { month:"long", year:"numeric" })}
                </option>
              )}
            </select>
          </div>
        </div>
        <div style={{ padding:"1.25rem" }}>
          <AnalyticsSummary 
            today={currentAnalytics.today} 
            thisWeek={currentAnalytics.thisWeek} 
            thisMonth={currentAnalytics.thisMonth}
            type={analyticsType}
          />
          <AttendanceLineChart data={dailyData} selectedMonth={currentAnalytics.selectedMonth} type={analyticsType} />
          <div style={{ display:"flex", justifyContent:"center", gap:"1rem", marginTop:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ width:12, height:3, background: analyticsType === "scans" ? "#3b82f6" : analyticsType === "absent" ? "#ef4444" : "#f59e0b", borderRadius:2 }} />
              <span style={{ fontSize:"0.7rem", color:"#64748b" }}>Daily {analyticsType}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ width:12, height:12, background: analyticsType === "scans" ? "rgba(59,130,246,0.15)" : analyticsType === "absent" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", borderRadius:2 }} />
              <span style={{ fontSize:"0.7rem", color:"#64748b" }}>Trend Area</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Status */}
      <div style={cardStyle}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", display:"flex", alignItems:"center", gap:"0.5rem", margin:0 }}><span>🔌</span> Device Status <LiveIndicator /></h3>
            <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.25rem", marginBottom:0 }}>{onlineDevices} online · {pairedDevices}/{totalDevices} paired</p>
          </div>
          <button onClick={() => setActiveTab("device")} style={{ padding:"0.4rem 1rem", background:"#fbbf24", color:"#fff", border:"none", borderRadius:"0.5rem", fontSize:"0.75rem", fontWeight:500, cursor:"pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background="#1e293b"; }} onMouseLeave={(e) => { e.currentTarget.style.background="#fbbf24"; }}>
            Manage Devices →
          </button>
        </div>
        <div style={{ padding:"1rem 1.25rem" }}>
          {devicesLoading ? <div style={{ textAlign:"center", padding:"2rem" }}>Loading...</div>
          : devices.length === 0 ? <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>No devices configured</p>
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"0.75rem" }}>
              {devices.slice(0, 4).map((device) => (
                <div key={device.id} style={{ padding:"0.75rem", background:"#f8fafc", borderRadius:"0.5rem", borderLeft:`3px solid ${device.status==="online"?"#22c55e":"#ef4444"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                    <p style={{ fontWeight:600, fontSize:"0.875rem", color:"#0f172a", margin:0 }}>{device.name}</p>
                    <span style={{ display:"flex", alignItems:"center", gap:"0.375rem" }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:device.status==="online"?"#22c55e":"#ef4444" }} />
                      <span style={{ fontSize:"0.7rem", fontWeight:500, color:device.status==="online"?"#22c55e":"#ef4444" }}>{device.status==="online"?"Online":"Offline"}</span>
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:"0.75rem", fontSize:"0.7rem", color:"#64748b" }}>
                    <span>{device.paired?"✓ Paired":"⏳ Unpaired"}</span>
                    <span>Seen: {formatLastSeen(device.last_seen)}</span>
                  </div>
                </div>
              ))}
              {devices.length > 4 && (
                <div onClick={() => setActiveTab("device")} style={{ padding:"0.75rem", background:"#f8fafc", borderRadius:"0.5rem", textAlign:"center", cursor:"pointer", border:"1px dashed #cbd5e1" }}>
                  <p style={{ color:"#3b82f6", fontSize:"0.75rem", margin:0 }}>+{devices.length - 4} more devices</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))", gap:"1.5rem" }}>

        {/* Recent Scans */}
        <div style={cardStyle}>
          <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3" }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", display:"flex", alignItems:"center", gap:"0.5rem", margin:0 }}><span>📱</span> Recent Scans <LiveIndicator /></h3>
          </div>
          <div style={{ padding:"1rem 1.25rem" }}>
            {scansLoading ? (
              <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>Loading...</p>
            ) : scans.length === 0 ? (
              <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>No scans yet</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                {scans.slice(0, 10).map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem" }}>
                    <div style={{ width:"2rem", height:"2rem", borderRadius:"0.5rem", background:s.scan_status==="Late"?"#fef3c7":"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>
                      {s.scan_status === "Late" ? "⏰" : "✅"}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:"0.875rem", color:"#0f172a", margin:0 }}>{s.name}</p>
                      <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.125rem", marginBottom:0 }}>{s.department} · {formatTime(s.last_scanned_at)}</p>
                    </div>
                    <span style={{ fontSize:"0.65rem", padding:"0.25rem 0.6rem", borderRadius:"999px", background:s.scan_status==="Late"?"#fef3c7":"#dcfce7", color:s.scan_status==="Late"?"#d97706":"#059669" }}>{s.scan_status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={cardStyle}>
          <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3" }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", margin:0 }}>Quick Actions</h3>
          </div>
          <div style={{ padding:"1rem 1.25rem", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem" }}>
            {quickActions.map((action) => (
              <button key={action.label} onClick={() => action.tab && setActiveTab(action.tab)}
                style={{ padding:"0.875rem", border:"1px solid #e9eef3", borderRadius:"0.5rem", background:"#fff", color:action.color, fontSize:"0.75rem", fontWeight:500, cursor:action.tab?"pointer":"default", textAlign:"center", transition:"all 0.2s", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem" }}
                onMouseEnter={(e) => { if (!action.tab) return; e.currentTarget.style.background=action.bg; e.currentTarget.style.borderColor=action.color; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={(e) => { if (!action.tab) return; e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#e9eef3"; e.currentTarget.style.transform="translateY(0)"; }}
              >
                <span style={{ fontSize:"1.25rem" }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Absent Logs */}
      <div style={cardStyle}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3" }}>
          <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", display:"flex", alignItems:"center", gap:"0.5rem", margin:0 }}>
            <span>❌</span> Recent Absent Records
          </h3>
        </div>
        <div style={{ padding:"1rem 1.25rem" }}>
          {absentLogs.length === 0 ? (
            <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>No absent records</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {absentLogs.slice(0, 10).map((log, i) => (
                <div key={log.id || i} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem", background:"#fef2f2", borderRadius:"0.5rem" }}>
                  <span style={{ fontSize:"1.25rem" }}>❌</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:"0.875rem", color:"#1e293b", margin:0 }}>{log.name}</p>
                    <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.125rem", marginBottom:0 }}>
                      {log.subject} · {log.department} · {log.date}
                    </p>
                  </div>
                  <span style={{ fontSize:"0.65rem", padding:"0.25rem 0.6rem", borderRadius:"999px", background:"#fee2e2", color:"#dc2626" }}>
                    Absent
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div style={cardStyle}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #e9eef3" }}>
          <h3 style={{ fontSize:"0.9rem", fontWeight:600, color:"#0f172a", display:"flex", alignItems:"center", gap:"0.5rem", margin:0 }}><span>📋</span> Recent Activities <LiveIndicator /></h3>
        </div>
        <div style={{ padding:"1rem 1.25rem" }}>
          {activitiesLoading ? <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>Loading...</p>
          : activities.length === 0 ? <p style={{ textAlign:"center", padding:"2rem", color:"#64748b" }}>No recent activities</p>
          : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {activities.slice(0, 10).map((activity, i) => (
                <div key={activity.id || i} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.5rem", background:"#f8fafc", borderRadius:"0.5rem" }}>
                  <div style={{ width:"2rem", height:"2rem", borderRadius:"0.5rem", background:getActivityColor(activity.type), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>{getActivityIcon(activity.type)}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:"0.875rem", color:"#0f172a", margin:0 }}>{activity.name}</p>
                    <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.125rem", marginBottom:0 }}>{activity.description ?? activity.type.replace(/_/g," ")}</p>
                  </div>
                  <span style={{ fontSize:"0.65rem", padding:"0.25rem 0.6rem", borderRadius:"999px", background:"#f1f5f9", color:"#475569" }}>{formatDate(activity.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && modalData && (
        <div onClick={closeModal} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#fff", borderRadius:"1rem", width:"100%", maxWidth:600, maxHeight:"85vh", overflow:"auto" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #e9eef3", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 style={{ fontSize:"1.125rem", fontWeight:600, color:"#0f172a", margin:0 }}>{modalData.title}</h2>
              <button onClick={closeModal} style={{ background:"none", border:"none", fontSize:"1.5rem", cursor:"pointer", color:"#94a3b8" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem" }}>
              {modalLoading ? <div style={{ textAlign:"center", padding:"3rem" }}>Loading...</div>
              : modalData.type === "instructors" ? (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
                    <div style={{ background:"#eff6ff", borderRadius:"0.5rem", padding:"1rem", textAlign:"center" }}>
                      <p style={{ fontSize:"0.75rem", color:"#3b82f6", margin:"0 0 4px" }}>Total Instructors</p>
                      <p style={{ fontSize:"2rem", fontWeight:700, color:"#0f172a", margin:0 }}><AnimatedNumber value={stats.total} duration={500} /></p>
                    </div>
                    <div style={{ background:"#ecfdf5", borderRadius:"0.5rem", padding:"1rem", textAlign:"center" }}>
                      <p style={{ fontSize:"0.75rem", color:"#10b981", margin:"0 0 4px" }}>Active Rate</p>
                      <p style={{ fontSize:"2rem", fontWeight:700, color:"#0f172a", margin:0 }}><AnimatedPercentage value={stats.active_rate} duration={500} /></p>
                    </div>
                  </div>
                  <WaveChart activeRate={stats.active_rate} />
                  <h3 style={{ fontSize:"0.875rem", fontWeight:600, color:"#0f172a", marginTop:"1.5rem", marginBottom:"1rem" }}>Department Distribution</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    {departmentStats.map((dept, i) => (
                      <div key={i}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.25rem" }}>
                          <span style={{ fontSize:"0.8rem", color:"#475569" }}>{dept.department}</span>
                          <span style={{ fontSize:"0.8rem", fontWeight:500, color:"#3b82f6" }}><AnimatedNumber value={dept.count} duration={500} /> ({dept.percentage}%)</span>
                        </div>
                        <div style={{ height:"0.5rem", background:"#e2e8f0", borderRadius:"999px", overflow:"hidden" }}>
                          <div style={{ width:`${dept.percentage}%`, height:"100%", background:"#3b82f6", borderRadius:"999px", transition:"width 0.3s" }} />
                        </div>
                        <p style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.25rem", marginBottom:0 }}>{dept.active_count} active · {dept.count - dept.active_count} inactive</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
                    <div style={{ background:"#f5f3ff", borderRadius:"0.5rem", padding:"1rem", textAlign:"center" }}>
                      <p style={{ fontSize:"0.75rem", color:"#8b5cf6", margin:"0 0 4px" }}>Total Events</p>
                      <p style={{ fontSize:"2rem", fontWeight:700, color:"#0f172a", margin:0 }}><AnimatedNumber value={stats.total_events} duration={500} /></p>
                    </div>
                    <div style={{ background:"#ecfeff", borderRadius:"0.5rem", padding:"1rem", textAlign:"center" }}>
                      <p style={{ fontSize:"0.75rem", color:"#06b6d4", margin:"0 0 4px" }}>Upcoming Events</p>
                      <p style={{ fontSize:"2rem", fontWeight:700, color:"#0f172a", margin:0 }}><AnimatedNumber value={stats.upcoming_events} duration={500} /></p>
                    </div>
                  </div>
                  <h3 style={{ fontSize:"0.875rem", fontWeight:600, color:"#0f172a", marginBottom:"1rem" }}>Monthly Events</h3>
                  {eventStats.map((event, i) => {
                    const max = Math.max(...eventStats.map((e) => e.count), 1);
                    return (
                      <div key={i} style={{ marginBottom:"0.75rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.25rem" }}>
                          <span style={{ fontSize:"0.8rem", color:"#475569" }}>{event.month}</span>
                          <span style={{ fontSize:"0.8rem", fontWeight:500, color:event.type==="upcoming"?"#10b981":"#64748b" }}>{event.count} {event.type}</span>
                        </div>
                        <div style={{ height:"0.5rem", background:"#e2e8f0", borderRadius:"999px", overflow:"hidden" }}>
                          <div style={{ width:`${(event.count/max)*100}%`, height:"100%", background:event.type==="upcoming"?"#10b981":"#94a3b8", borderRadius:"999px", transition:"width 0.3s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #e9eef3", display:"flex", justifyContent:"flex-end" }}>
              <button onClick={closeModal} style={{ padding:"0.5rem 1rem", background:"#0f172a", color:"#fff", border:"none", borderRadius:"0.5rem", fontSize:"0.8rem", cursor:"pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut { from { opacity:1; transform:translateY(0);    } to { opacity:0; transform:translateY(-10px); } }
        @keyframes pulse   { 0% { box-shadow:0 0 0 0 rgba(34,197,94,0.7); } 70% { box-shadow:0 0 0 10px rgba(34,197,94,0); } 100% { box-shadow:0 0 0 0 rgba(34,197,94,0); } }
      `}</style>
    </div>
  );
}