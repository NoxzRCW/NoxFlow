/**
 * REST API routes for room management
 */
import { Router, Request, Response } from 'express';
import { roomStore } from './store.js';
import { ApiResponse, RoomInfo, ParticipantInfo } from './types.js';

const router = Router();

/**
 * GET /api/health
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'noxflow-collab-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * POST /api/rooms
 * Create a new room
 */
router.post('/rooms', (req: Request, res: Response) => {
  const { id, name } = req.body;
  const roomId = id || `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (roomStore.hasRoom(roomId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Room already exists',
    };
    res.status(409).json(response);
    return;
  }

  const room = roomStore.createRoom(roomId, name);
  const response: ApiResponse<RoomInfo> = {
    success: true,
    data: {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      participantCount: 0,
      nodeCount: 0,
      connectorCount: 0,
      lastModified: room.state.lastModified,
    },
  };
  res.status(201).json(response);
});

/**
 * GET /api/rooms
 * List all rooms
 */
router.get('/rooms', (_req: Request, res: Response) => {
  const rooms = roomStore.listRooms();
  const response: ApiResponse<RoomInfo[]> = {
    success: true,
    data: rooms,
  };
  res.json(response);
});

/**
 * GET /api/rooms/:id
 * Get room details
 */
router.get('/rooms/:id', (req: Request<{ id: string }>, res: Response) => {
  const room = roomStore.getRoom(req.params.id);
  if (!room) {
    const response: ApiResponse = {
      success: false,
      error: 'Room not found',
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<RoomInfo> = {
    success: true,
    data: {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      participantCount: room.participants.size,
      nodeCount: room.state.nodes.size,
      connectorCount: room.state.connectors.size,
      lastModified: room.state.lastModified,
    },
  };
  res.json(response);
});

/**
 * DELETE /api/rooms/:id
 * Delete a room
 */
router.delete('/rooms/:id', (req: Request<{ id: string }>, res: Response) => {
  const deleted = roomStore.deleteRoom(req.params.id);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: 'Room not found',
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: { deleted: true },
  };
  res.json(response);
});

/**
 * POST /api/rooms/:id/join
 * Join a room (returns room state for REST clients)
 */
router.post('/rooms/:id/join', (req: Request<{ id: string }>, res: Response) => {
  const roomId = req.params.id;
  const { userName } = req.body;

  if (!roomStore.hasRoom(roomId)) {
    roomStore.createRoom(roomId);
  }

  const room = roomStore.getRoom(roomId);
  if (!room) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create or join room',
    };
    res.status(500).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: {
      roomId,
      roomName: room.name,
      state: {
        nodes: Array.from(room.state.nodes.values()),
        connectors: Array.from(room.state.connectors.values()),
        version: room.state.version,
      },
      participants: roomStore.getParticipants(roomId).map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        joinedAt: p.joinedAt,
      })),
    },
  };
  res.json(response);
});

/**
 * GET /api/rooms/:id/participants
 * List participants in a room
 */
router.get('/rooms/:id/participants', (req: Request<{ id: string }>, res: Response) => {
  const roomId = req.params.id;
  const room = roomStore.getRoom(roomId);
  if (!room) {
    const response: ApiResponse = {
      success: false,
      error: 'Room not found',
    };
    res.status(404).json(response);
    return;
  }

  const participants: ParticipantInfo[] = roomStore
    .getParticipants(roomId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      joinedAt: p.joinedAt,
    }));

  const response: ApiResponse<ParticipantInfo[]> = {
    success: true,
    data: participants,
  };
  res.json(response);
});

/**
 * GET /api/rooms/:id/state
 * Get current room state (nodes + connectors)
 */
router.get('/rooms/:id/state', (req: Request<{ id: string }>, res: Response) => {
  const roomId = req.params.id;
  const state = roomStore.getRoomState(roomId);
  if (!state) {
    const response: ApiResponse = {
      success: false,
      error: 'Room not found',
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: {
      nodes: Array.from(state.nodes.values()),
      connectors: Array.from(state.connectors.values()),
      version: state.version,
      lastModified: state.lastModified,
    },
  };
  res.json(response);
});

/**
 * POST /api/rooms/:id/nodes
 * Add/update a node via REST (for non-WS clients)
 */
router.post('/rooms/:id/nodes', (req: Request<{ id: string }>, res: Response) => {
  const roomId = req.params.id;
  const { id: nodeId, type, position, data, style } = req.body;

  if (!nodeId || !type) {
    const response: ApiResponse = {
      success: false,
      error: 'node id and type are required',
    };
    res.status(400).json(response);
    return;
  }

  if (!roomStore.hasRoom(roomId)) {
    roomStore.createRoom(roomId);
  }

  const accepted = roomStore.upsertNode(roomId, {
    id: nodeId,
    type,
    position: position || { x: 0, y: 0 },
    data,
    style,
    timestamp: Date.now(),
    version: 1,
  });

  const response: ApiResponse = {
    success: accepted,
    data: { nodeId, accepted },
  };
  res.status(accepted ? 200 : 409).json(response);
});

/**
 * DELETE /api/rooms/:id/nodes/:nodeId
 * Delete a node via REST
 */
router.delete('/rooms/:id/nodes/:nodeId', (req: Request<{ id: string; nodeId: string }>, res: Response) => {
  const roomId = req.params.id;
  const nodeId = req.params.nodeId;

  const deleted = roomStore.deleteNode(roomId, nodeId);
  const response: ApiResponse = {
    success: deleted,
    data: { nodeId, deleted },
  };
  res.status(deleted ? 200 : 404).json(response);
});

export default router;
