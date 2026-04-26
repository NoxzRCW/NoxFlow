/**
 * Types for NoxFlow Collaboration Server
 */

export interface Position {
  x: number;
  y: number;
}

export interface CursorData {
  id: string;
  name: string;
  color: string;
  position: Position;
  timestamp: number;
}

export interface NodeData {
  id: string;
  type: string;
  position: Position;
  data?: Record<string, unknown>;
  style?: Record<string, unknown>;
  timestamp: number;
  version: number;
}

export interface ConnectorData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  timestamp: number;
  version: number;
}

export interface DiagramState {
  nodes: Map<string, NodeData>;
  connectors: Map<string, ConnectorData>;
  lastModified: number;
  version: number;
}

export interface Room {
  id: string;
  name: string;
  createdAt: number;
  state: DiagramState;
  participants: Map<string, Participant>;
}

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  color: string;
  joinedAt: number;
  lastActivity: number;
}

export interface JoinRoomPayload {
  roomId: string;
  user: {
    name: string;
    color?: string;
  };
}

export interface CursorMovePayload {
  roomId: string;
  position: Position;
}

export interface NodeEventPayload {
  roomId: string;
  node: Omit<NodeData, 'timestamp' | 'version'>;
}

export interface ConnectorEventPayload {
  roomId: string;
  connector: Omit<ConnectorData, 'timestamp' | 'version'>;
}

export interface DeletePayload {
  roomId: string;
  id: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  createdAt: number;
  participantCount: number;
  nodeCount: number;
  connectorCount: number;
  lastModified: number;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}
