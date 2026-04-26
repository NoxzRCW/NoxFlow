/**
 * Socket.io event handlers for real-time collaboration
 */
import { Server, Socket } from 'socket.io';
import { roomStore } from './store.js';
import {
  JoinRoomPayload,
  CursorMovePayload,
  NodeEventPayload,
  ConnectorEventPayload,
  DeletePayload,
  Participant,
} from './types.js';

const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#f43f5e', '#14b8a6', '#fbbf24', '#a855f7',
];

function generateColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // ── Join Room ───────────────────────────────────────────
    socket.on('join-room', (payload: JoinRoomPayload) => {
      const { roomId, user } = payload;
      if (!roomId) {
        socket.emit('error', { message: 'roomId is required' });
        return;
      }

      // Leave previous rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.leave(room);
      });

      // Create room if it doesn't exist
      if (!roomStore.hasRoom(roomId)) {
        roomStore.createRoom(roomId);
        console.log(`[socket] Created room: ${roomId}`);
      }

      socket.join(roomId);

      const participant: Participant = {
        id: socket.id,
        socketId: socket.id,
        name: user?.name || `User ${socket.id.slice(0, 4)}`,
        color: user?.color || generateColor(socket.id),
        joinedAt: Date.now(),
        lastActivity: Date.now(),
      };

      roomStore.addParticipant(roomId, participant);

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        id: participant.id,
        name: participant.name,
        color: participant.color,
        roomId,
      });

      // Send current participants to new user (excluding self)
      const participants = roomStore
        .getParticipants(roomId)
        .filter((p) => p.id !== socket.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
        }));
      socket.emit('participants', participants);

      // Send current full state to new joiner if available (from a previous state-update)
      const fullState = roomStore.getFullState(roomId);
      if (fullState) {
        socket.emit('state-update', {
          senderId: 'server',
          senderName: 'Server',
          state: fullState,
        });
      }

      console.log(`[socket] ${socket.id} joined room ${roomId}`);
    });

    // ── Leave Room ──────────────────────────────────────────
    socket.on('leave-room', ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.leave(roomId);
      roomStore.removeParticipant(roomId, socket.id);
      socket.to(roomId).emit('user-left', { id: socket.id });
      console.log(`[socket] ${socket.id} left room ${roomId}`);
    });

    // ── Cursor Move ─────────────────────────────────────────
    socket.on('cursor-move', (payload: CursorMovePayload) => {
      const { roomId, position } = payload;
      if (!roomId || !position) return;

      const room = roomStore.getRoom(roomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      roomStore.updateParticipantActivity(roomId, socket.id);

      socket.to(roomId).emit('cursor-move', {
        id: socket.id,
        name: participant.name,
        color: participant.color,
        position,
        timestamp: Date.now(),
      });
    });

    // ── State Update (full model+scene relay) ───────────────
    socket.on('state-update', ({ roomId, state }: { roomId: string; state: { model: unknown; scene: unknown } }) => {
      if (!roomId || !state) return;

      const room = roomStore.getRoom(roomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      const senderName = participant?.name || 'Anonymous';

      roomStore.setFullState(roomId, state.model, state.scene);

      socket.to(roomId).emit('state-update', {
        senderId: socket.id,
        senderName,
        state,
      });
    });

    // ── Node Add ────────────────────────────────────────────
    socket.on('node-add', (payload: NodeEventPayload) => {
      const { roomId, node } = payload;
      if (!roomId || !node?.id) return;

      const nodeData = {
        ...node,
        timestamp: Date.now(),
        version: 1,
      };

      const accepted = roomStore.upsertNode(roomId, nodeData);
      if (accepted) {
        socket.to(roomId).emit('node-add', {
          ...nodeData,
          senderId: socket.id,
        });
      }
    });

    // ── Node Update ─────────────────────────────────────────
    socket.on('node-update', (payload: NodeEventPayload) => {
      const { roomId, node } = payload;
      if (!roomId || !node?.id) return;

      const existing = roomStore.getNode(roomId, node.id);
      const nodeData = {
        ...node,
        timestamp: Date.now(),
        version: (existing?.version || 0) + 1,
      };

      const accepted = roomStore.upsertNode(roomId, nodeData);
      if (accepted) {
        socket.to(roomId).emit('node-update', {
          ...nodeData,
          senderId: socket.id,
        });
      } else {
        // Conflict: send back the current state
        const current = roomStore.getNode(roomId, node.id);
        socket.emit('node-conflict', {
          id: node.id,
          current,
          yourUpdate: nodeData,
        });
      }
    });

    // ── Node Delete ─────────────────────────────────────────
    socket.on('node-delete', (payload: DeletePayload) => {
      const { roomId, id } = payload;
      if (!roomId || !id) return;

      const deleted = roomStore.deleteNode(roomId, id);
      if (deleted) {
        socket.to(roomId).emit('node-delete', { id, senderId: socket.id });
      }
    });

    // ── Connector Add ───────────────────────────────────────
    socket.on('connector-add', (payload: ConnectorEventPayload) => {
      const { roomId, connector } = payload;
      if (!roomId || !connector?.id) return;

      const connectorData = {
        ...connector,
        timestamp: Date.now(),
        version: 1,
      };

      const accepted = roomStore.upsertConnector(roomId, connectorData);
      if (accepted) {
        socket.to(roomId).emit('connector-add', {
          ...connectorData,
          senderId: socket.id,
        });
      }
    });

    // ── Connector Update ────────────────────────────────────
    socket.on('connector-update', (payload: ConnectorEventPayload) => {
      const { roomId, connector } = payload;
      if (!roomId || !connector?.id) return;

      const existing = roomStore.getRoomState(roomId)?.connectors.get(connector.id);
      const connectorData = {
        ...connector,
        timestamp: Date.now(),
        version: (existing?.version || 0) + 1,
      };

      const accepted = roomStore.upsertConnector(roomId, connectorData);
      if (accepted) {
        socket.to(roomId).emit('connector-update', {
          ...connectorData,
          senderId: socket.id,
        });
      }
    });

    // ── Connector Delete ────────────────────────────────────
    socket.on('connector-delete', (payload: DeletePayload) => {
      const { roomId, id } = payload;
      if (!roomId || !id) return;

      const deleted = roomStore.deleteConnector(roomId, id);
      if (deleted) {
        socket.to(roomId).emit('connector-delete', { id, senderId: socket.id });
      }
    });

    // ── User Info Update ────────────────────────────────────
    socket.on('user-info', ({ name }: { name: string }) => {
      if (!name) return;
      // Find which room this user is in
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        const room = roomStore.getRoom(roomId);
        if (room) {
          const participant = room.participants.get(socket.id);
          if (participant) {
            participant.name = name;
            socket.to(roomId).emit('user-updated', {
              id: socket.id,
              name,
              color: participant.color,
            });
          }
        }
      }
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
      // Find and leave all rooms
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        roomStore.removeParticipant(roomId, socket.id);
        socket.to(roomId).emit('user-left', { id: socket.id });
      }
    });
  });
}
