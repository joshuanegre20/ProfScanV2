// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Get socket URL from environment, with fallback
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) {
    console.log("📡 Using socket URL from env:", envUrl);
    return envUrl;
  }
  
  // Fallback - use the same hostname as the current page
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const hostname = window.location.hostname;
  const socketUrl = `${protocol}://${hostname}`;
  console.log("📍 Auto-detected socket URL:", socketUrl);
  return socketUrl;
};

const SOCKET_URL = getSocketUrl();
console.log("✅ Final Socket URL:", SOCKET_URL);

let _socket: Socket | null = null;
const _joinedRooms = new Set<string>();

function getSocket(): Socket {
  if (!_socket || !_socket.connected) {
    console.log(`🔄 Creating new socket connection to: ${SOCKET_URL}`);
    
    _socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    
    _socket.on("connect", () => {
      console.log("✅ Socket connected successfully to:", SOCKET_URL);
      _joinedRooms.clear();
    });
    
    _socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error to:", SOCKET_URL);
      console.error("❌ Error:", error.message);
    });
  }
  return _socket;
}

interface UseSocketOptions {
  room?: "admin" | "staff" | `device-${number}`;
  onScan?:             (data: any) => void;
  onScheduleUpdate?:   (data: any) => void;
  onAttendanceUpdate?: (data: any) => void;
  onEventUpdate?:      (data: any) => void;
  onActivityUpdate?:   (data: any) => void;
  onDeviceStatus?:     (data: any) => void;
  onStatsUpdate?:      (data: any) => void;
  onInstructorUpdate?: (data: any) => void;
  onStaffUpdate?:      (data: any) => void;
  onDeviceUpdate?:     (data: any) => void;
  onLogsUpdate?:       (data: any) => void;
}

interface UseSocketReturn {
  socket: Socket;
  isConnected: boolean;
  connectionError: string | null;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { 
    room, 
    onScan, 
    onScheduleUpdate, 
    onAttendanceUpdate, 
    onEventUpdate, 
    onActivityUpdate,
    onDeviceStatus,
    onStatsUpdate,
    onInstructorUpdate,
    onStaffUpdate,
    onDeviceUpdate,
    onLogsUpdate
  } = options;
  
  const socketRef = useRef<Socket>(getSocket());
  const [isConnected, setIsConnected] = useState(socketRef.current.connected);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const onScanRef             = useRef(onScan);
  const onScheduleUpdateRef   = useRef(onScheduleUpdate);
  const onAttendanceUpdateRef = useRef(onAttendanceUpdate);
  const onEventUpdateRef      = useRef(onEventUpdate);
  const onActivityUpdateRef   = useRef(onActivityUpdate);
  const onDeviceStatusRef     = useRef(onDeviceStatus);
  const onStatsUpdateRef      = useRef(onStatsUpdate);
  const onInstructorUpdateRef = useRef(onInstructorUpdate);
  const onStaffUpdateRef      = useRef(onStaffUpdate);
  const onDeviceUpdateRef     = useRef(onDeviceUpdate);
  const onLogsUpdateRef       = useRef(onLogsUpdate);

  useEffect(() => { onScanRef.current             = onScan;             });
  useEffect(() => { onScheduleUpdateRef.current   = onScheduleUpdate;   });
  useEffect(() => { onAttendanceUpdateRef.current = onAttendanceUpdate; });
  useEffect(() => { onEventUpdateRef.current      = onEventUpdate;      });
  useEffect(() => { onActivityUpdateRef.current   = onActivityUpdate;   });
  useEffect(() => { onDeviceStatusRef.current     = onDeviceStatus;     });
  useEffect(() => { onStatsUpdateRef.current      = onStatsUpdate;      });
  useEffect(() => { onInstructorUpdateRef.current = onInstructorUpdate; });
  useEffect(() => { onStaffUpdateRef.current      = onStaffUpdate;      });
  useEffect(() => { onDeviceUpdateRef.current     = onDeviceUpdate;     });
  useEffect(() => { onLogsUpdateRef.current       = onLogsUpdate;       });

  useEffect(() => {
    const s = socketRef.current;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("✅ Socket connected, joining room:", room);
      
      if (room) {
        if (room === "admin") {
          s.emit("join-admin");
          console.log("📡 Joined admin room");
        } else if (room === "staff") {
          s.emit("join-staff");
          console.log("📡 Joined staff room");
        } else if (room.startsWith("device-")) {
          s.emit("join-device", room.replace("device-", ""));
          console.log("📡 Joined device room:", room);
        }
      }
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        s.connect();
      }
    };

    const handleConnectError = (err: Error) => {
      setIsConnected(false);
      setConnectionError(err.message);
      console.error("❌ Socket connection error:", err.message);
      console.error("📍 Attempted URL:", SOCKET_URL);
    };

    const joinRoom = () => {
      if (!room) return;
      if (_joinedRooms.has(room)) return;
      _joinedRooms.add(room);
      if (room === "admin") {
        s.emit("join-admin");
      } else if (room === "staff") {
        s.emit("join-staff");
      } else if (room.startsWith("device-")) {
        s.emit("join-device", room.replace("device-", ""));
      }
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);
    
    joinRoom();
    s.on("connect", joinRoom);

    const handleScan             = (data: any) => onScanRef.current?.(data);
    const handleScheduleUpdate   = (data: any) => onScheduleUpdateRef.current?.(data);
    const handleAttendanceUpdate = (data: any) => onAttendanceUpdateRef.current?.(data);
    const handleEventUpdate      = (data: any) => onEventUpdateRef.current?.(data);
    const handleActivityUpdate   = (data: any) => onActivityUpdateRef.current?.(data);
    const handleDeviceStatus     = (data: any) => onDeviceStatusRef.current?.(data);
    const handleStatsUpdate      = (data: any) => onStatsUpdateRef.current?.(data);
    const handleInstructorUpdate = (data: any) => onInstructorUpdateRef.current?.(data);
    const handleStaffUpdate      = (data: any) => onStaffUpdateRef.current?.(data);
    const handleDeviceUpdate     = (data: any) => onDeviceUpdateRef.current?.(data);
    const handleLogsUpdate       = (data: any) => onLogsUpdateRef.current?.(data);

    s.on("scan",              handleScan);
    s.on("schedule-update",   handleScheduleUpdate);
    s.on("attendance-update", handleAttendanceUpdate);
    s.on("event-update",      handleEventUpdate);
    s.on("activity-update",   handleActivityUpdate);
    s.on("device-status",     handleDeviceStatus);
    s.on("stats-update",      handleStatsUpdate);
    s.on("instructor-update", handleInstructorUpdate);
    s.on("staff-update",      handleStaffUpdate);
    s.on("device-update",     handleDeviceUpdate);
    s.on("logs-update",       handleLogsUpdate);

    setIsConnected(s.connected);

    return () => {
      s.off("connect",          handleConnect);
      s.off("disconnect",       handleDisconnect);
      s.off("connect_error",    handleConnectError);
      s.off("connect",          joinRoom);
      s.off("scan",              handleScan);
      s.off("schedule-update",   handleScheduleUpdate);
      s.off("attendance-update", handleAttendanceUpdate);
      s.off("event-update",      handleEventUpdate);
      s.off("activity-update",   handleActivityUpdate);
      s.off("device-status",     handleDeviceStatus);
      s.off("stats-update",      handleStatsUpdate);
      s.off("instructor-update", handleInstructorUpdate);
      s.off("staff-update",      handleStaffUpdate);
      s.off("device-update",     handleDeviceUpdate);
      s.off("logs-update",       handleLogsUpdate);
    };
  }, [room]);

  return { socket: socketRef.current, isConnected, connectionError };
}