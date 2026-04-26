/**
 * In-memory store for rooms and diagram state
 * Implements simple last-write-wins conflict resolution
 */
import {
  Room,
  DiagramState,
  NodeData,
  ConnectorData,
  Participant,
  RoomInfo,
} from './types.js';

class RoomStore {
  private rooms: Map<string, Room> = new Map();

  /**
   * Create a new room
   */
  createRoom(id: string, name?: string): Room {
    const now = Date.now();
    const room: Room = {
      id,
      name: name || `Diagram ${id.slice(0, 8)}`,
      createdAt: now,
      state: {
        nodes: new Map(),
        connectors: new Map(),
        lastModified: now,
        version: 1,
      },
      participants: new Map(),
    };
    this.rooms.set(id, room);
    return room;
  }

  /**
   * Get a room by ID
   */
  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  /**
   * Check if a room exists
   */
  hasRoom(id: string): boolean {
    return this.rooms.has(id);
  }

  /**
   * Delete a room
   */
  deleteRoom(id: string): boolean {
    return this.rooms.delete(id);
  }

  /**
   * List all rooms
   */
  listRooms(): RoomInfo[] {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      participantCount: room.participants.size,
      nodeCount: room.state.nodes.size,
      connectorCount: room.state.connectors.size,
      lastModified: room.state.lastModified,
    }));
  }

  /**
   * Add a participant to a room
   */
  addParticipant(roomId: string, participant: Participant): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.participants.set(participant.id, participant);
    return true;
  }

  /**
   * Remove a participant from a room
   */
  removeParticipant(roomId: string, participantId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.participants.delete(participantId);
  }

  /**
   * Get participants in a room
   */
  getParticipants(roomId: string): Participant[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.participants.values());
  }

  /**
   * Update participant activity timestamp
   */
  updateParticipantActivity(roomId: string, participantId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(participantId);
    if (participant) {
      participant.lastActivity = Date.now();
    }
  }

  // ── Node Operations (Last-Write-Wins) ─────────────────────

  /**
   * Add or update a node
   * Last-write-wins: if the incoming node has a newer timestamp, it wins
   */
  upsertNode(roomId: string, node: NodeData): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const existing = room.state.nodes.get(node.id);

    // Last-write-wins: accept if no existing or incoming is newer
    if (!existing || node.timestamp >= existing.timestamp || node.version > existing.version) {
      room.state.nodes.set(node.id, node);
      room.state.lastModified = Date.now();
      room.state.version++;
      return true;
    }

    // Conflict: existing is newer, reject
    return false;
  }

  /**
   * Delete a node
   */
  deleteNode(roomId: string, nodeId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const deleted = room.state.nodes.delete(nodeId);
    if (deleted) {
      // Also remove any connectors connected to this node
      room.state.connectors.forEach((conn, id) => {
        if (conn.source === nodeId || conn.target === nodeId) {
          room.state.connectors.delete(id);
        }
      });
      room.state.lastModified = Date.now();
      room.state.version++;
    }
    return deleted;
  }

  /**
   * Get a node
   */
  getNode(roomId: string, nodeId: string): NodeData | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    return room.state.nodes.get(nodeId);
  }

  // ── Connector Operations (Last-Write-Wins) ────────────────

  /**
   * Add or update a connector
   */
  upsertConnector(roomId: string, connector: ConnectorData): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const existing = room.state.connectors.get(connector.id);

    // Last-write-wins
    if (!existing || connector.timestamp >= existing.timestamp || connector.version > existing.version) {
      room.state.connectors.set(connector.id, connector);
      room.state.lastModified = Date.now();
      room.state.version++;
      return true;
    }

    return false;
  }

  /**
   * Delete a connector
   */
  deleteConnector(roomId: string, connectorId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const deleted = room.state.connectors.delete(connectorId);
    if (deleted) {
      room.state.lastModified = Date.now();
      room.state.version++;
    }
    return deleted;
  }

  /**
   * Get full room state (for new joiners)
   */
  getRoomState(roomId: string): DiagramState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    return room.state;
  }

  /**
   * Clean up empty rooms older than maxAgeMs
   */
  cleanupEmptyRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, room] of this.rooms) {
      if (room.participants.size === 0 && now - room.state.lastModified > maxAgeMs) {
        this.rooms.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const roomStore = new RoomStore();
