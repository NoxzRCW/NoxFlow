/**
 * NoxFlow Collaboration Server
 * Real-time WebSocket server for diagram collaboration
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './api.js';
import { setupSocketHandlers } from './socket-handler.js';
import { roomStore } from './store.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.COLLAB_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// REST API
app.use('/api', apiRoutes);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocketHandlers(io);

// Periodic cleanup of empty rooms (every hour)
setInterval(() => {
  const cleaned = roomStore.cleanupEmptyRooms();
  if (cleaned > 0) {
    console.log(`[cleanup] Removed ${cleaned} empty rooms`);
  }
}, 60 * 60 * 1000);

// Start server
httpServer.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  NoxFlow Collaboration Server                                ║`);
  console.log(`║  Port: ${PORT.toString().padEnd(53)}║`);
  console.log(`║  WebSocket: ws://localhost:${PORT.toString().padEnd(44)}║`);
  console.log(`║  REST API: http://localhost:${PORT}/api`.padEnd(63) + '║');
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
});
