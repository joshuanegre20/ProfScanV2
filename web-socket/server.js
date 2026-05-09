const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, {
  cors: { 
    origin: ["https://web.captoneproject101.online", "https://socket.captoneproject101.online", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  allowRequest: (req, callback) => {
    // Allow all requests for WebSocket
    callback(null, true);
  }
});

// Track connected clients
let clients = new Map();

io.on("connection", (socket) => {
  const connectTime = new Date();
  clients.set(socket.id, { connectTime, rooms: [] });
  console.log(`✅ Connected: ${socket.id} | Total: ${clients.size}`);

  // Send immediate confirmation
  socket.emit("connected", { message: "Connected!", timestamp: Date.now() });

  // Handle ping/pong
  socket.on("ping", (callback) => {
    if (callback && typeof callback === 'function') {
      callback({ pong: Date.now() });
    } else {
      socket.emit("pong", { pong: Date.now() });
    }
  });

  // Room joining
  socket.on("join-admin", () => { 
    socket.join("admin"); 
    const client = clients.get(socket.id);
    if (client) client.rooms.push("admin");
    console.log(`🔑 Admin joined (${socket.id})`);
    socket.emit("room-joined", { room: "admin" });
  });
  
  socket.on("join-staff", () => { 
    socket.join("staff"); 
    const client = clients.get(socket.id);
    if (client) client.rooms.push("staff");
    console.log(`👤 Staff joined (${socket.id})`);
    socket.emit("room-joined", { room: "staff" });
  });
  
  socket.on("join-device", (deviceId) => { 
    const room = `device-${deviceId}`;
    socket.join(room); 
    const client = clients.get(socket.id);
    if (client) client.rooms.push(room);
    console.log(`📡 Device ${deviceId} joined (${socket.id})`);
    socket.emit("room-joined", { room: room });
  });

  socket.on("disconnect", (reason) => {
    clients.delete(socket.id);
    console.log(`❌ Disconnected: ${socket.id} | Reason: ${reason} | Total: ${clients.size}`);
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    clients: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/status", (req, res) => {
  const clientList = Array.from(clients.entries()).map(([id, data]) => ({
    id: id.substring(0, 8),
    rooms: data.rooms,
    connectedFor: Math.floor((Date.now() - data.connectTime) / 1000) + 's'
  }));
  res.json({ 
    clients: clients.size, 
    connections: clientList,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.io running on http://0.0.0.0:${PORT}`);
  console.log(`   Transports: websocket, polling`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});