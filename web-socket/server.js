const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ── Track connected clients ───────────────────────────────────────
let clients = 0;

io.on("connection", (socket) => {
  clients++;
  console.log(`✅ Connected: ${socket.id} | Total: ${clients}`);

  // Client joins a room based on their role
  socket.on("join-admin",   ()         => { socket.join("admin");           console.log(`🔑 Admin joined`); });
  socket.on("join-staff",   ()         => { socket.join("staff");           console.log(`👤 Staff joined`); });
  socket.on("join-device",  (deviceId) => { socket.join(`device-${deviceId}`); console.log(`📡 Device ${deviceId} joined`); });

  socket.on("disconnect", () => {
    clients--;
    console.log(`❌ Disconnected: ${socket.id} | Total: ${clients}`);
  });
});

// ── Endpoints called by Laravel ───────────────────────────────────

// POST /emit/scan — called when ESP32 scans a QR
app.post("/emit/scan", (req, res) => {
  const data = req.body;
  console.log("📱 Scan:", data.name, "|", data.status);

  io.to("admin").emit("scan", data);
  io.to("staff").emit("scan", data);
  if (data.device_id) io.to(`device-${data.device_id}`).emit("scan", data);

  res.json({ success: true });
});

// POST /emit/schedule-update — called when a schedule status changes
app.post("/emit/schedule-update", (req, res) => {
  const data = req.body;
  console.log("📅 Schedule update:", data.schedule_id, "→", data.status);

  io.to("admin").emit("schedule-update", data);
  io.to("staff").emit("schedule-update", data);

  res.json({ success: true });
});

// POST /emit/attendance-update — called when absent/excused
app.post("/emit/attendance-update", (req, res) => {
  const data = req.body;
  console.log("📋 Attendance update:", data.type);

  io.to("admin").emit("attendance-update", data);
  io.to("staff").emit("attendance-update", data);

  res.json({ success: true });
});

// POST /emit/event-update — called when event is created/updated
app.post("/emit/event-update", (req, res) => {
  const data = req.body;
  console.log("🗓️ Event update:", data.title);

  io.to("admin").emit("event-update", data);
  io.to("staff").emit("event-update", data);

  res.json({ success: true });
});

// POST /emit/activity-update — called when any activity is created
app.post("/emit/activity-update", (req, res) => {
  const data = req.body;
  console.log("📋 Activity update:", data.type, "|", data.name);

  io.to("admin").emit("activity-update", data);
  io.to("staff").emit("activity-update", data);

  res.json({ success: true });
});

// GET /status — health check
app.get("/status", (req, res) => {
  res.json({ status: "ok", clients });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.io running on http://0.0.0.0:${PORT}`);
});