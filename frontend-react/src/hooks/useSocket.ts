// src/hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://127.0.0.1:3001";

let _socket: Socket | null = null;
const _joinedRooms = new Set<string>();

function getSocket(): Socket {
  if (!_socket || !_socket.connected) {
    _socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    _socket.on("connect", () => _joinedRooms.clear());
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
  onDeviceStatus?:     (data: any) => void;  // ← Add this
}

export function useSocket(options: UseSocketOptions = {}) {
  const { 
    room, 
    onScan, 
    onScheduleUpdate, 
    onAttendanceUpdate, 
    onEventUpdate, 
    onActivityUpdate,
    onDeviceStatus  // ← Add this
  } = options;
  const socketRef = useRef<Socket>(getSocket());

  const onScanRef             = useRef(onScan);
  const onScheduleUpdateRef   = useRef(onScheduleUpdate);
  const onAttendanceUpdateRef = useRef(onAttendanceUpdate);
  const onEventUpdateRef      = useRef(onEventUpdate);
  const onActivityUpdateRef   = useRef(onActivityUpdate);
  const onDeviceStatusRef     = useRef(onDeviceStatus);  // ← Add this

  useEffect(() => { onScanRef.current             = onScan;             });
  useEffect(() => { onScheduleUpdateRef.current   = onScheduleUpdate;   });
  useEffect(() => { onAttendanceUpdateRef.current = onAttendanceUpdate; });
  useEffect(() => { onEventUpdateRef.current      = onEventUpdate;      });
  useEffect(() => { onActivityUpdateRef.current   = onActivityUpdate;   });
  useEffect(() => { onDeviceStatusRef.current     = onDeviceStatus;     });  // ← Add this

  useEffect(() => {
    const s = socketRef.current;

    const joinRoom = () => {
      if (!room) return;
      if (_joinedRooms.has(room)) return;
      _joinedRooms.add(room);
      if (room === "admin")               s.emit("join-admin");
      else if (room === "staff")          s.emit("join-staff");
      else if (room.startsWith("device-")) s.emit("join-device", room.replace("device-", ""));
    };

    joinRoom();
    s.on("connect", joinRoom);

    const handleScan             = (data: any) => onScanRef.current?.(data);
    const handleScheduleUpdate   = (data: any) => onScheduleUpdateRef.current?.(data);
    const handleAttendanceUpdate = (data: any) => onAttendanceUpdateRef.current?.(data);
    const handleEventUpdate      = (data: any) => onEventUpdateRef.current?.(data);
    const handleActivityUpdate   = (data: any) => onActivityUpdateRef.current?.(data);
    const handleDeviceStatus     = (data: any) => onDeviceStatusRef.current?.(data);  // ← Add this

    s.on("scan",              handleScan);
    s.on("schedule-update",   handleScheduleUpdate);
    s.on("attendance-update", handleAttendanceUpdate);
    s.on("event-update",      handleEventUpdate);
    s.on("activity-update",   handleActivityUpdate);
    s.on("device-status",     handleDeviceStatus);  // ← Add this

    return () => {
      s.off("connect",          joinRoom);
      s.off("scan",              handleScan);
      s.off("schedule-update",   handleScheduleUpdate);
      s.off("attendance-update", handleAttendanceUpdate);
      s.off("event-update",      handleEventUpdate);
      s.off("activity-update",   handleActivityUpdate);
      s.off("device-status",     handleDeviceStatus);  // ← Add this
    };
  }, [room]);

  return socketRef.current;
}