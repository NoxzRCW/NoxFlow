import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_COLLAB_URL) || `http://${window.location.hostname}:3001`;

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  roomId?: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  position: CursorPosition;
}

export interface CollabState {
  model: any;
  scene: any;
}

export interface CollabStateUpdate {
  senderId: string;
  senderName: string;
  state: CollabState;
}

export type NodeActionType = 'add' | 'update' | 'delete';

export interface NodeAction {
  type: NodeActionType;
  nodeId: string;
  nodeData?: any;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface ConnectorAction {
  type: NodeActionType;
  connectorId: string;
  connectorData?: any;
  senderId: string;
  senderName: string;
  timestamp: number;
}

type EventCallback<T> = (data: T) => void;

class CollabService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentRoom: string | null = null;
  private currentUser: { name: string; color: string } | null = null;
  private isApplyingRemoteUpdate = false;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[collab] Connected to server', this.socket?.id);
      this.reconnectAttempts = 0;
      // Re-join room if we were in one
      if (this.currentRoom && this.currentUser) {
        this.joinRoom(this.currentRoom, this.currentUser);
      }
      this.emit('connection-change', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[collab] Disconnected:', reason);
      this.emit('connection-change', { connected: false, reason });
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      console.error(`[collab] Connection error (attempt ${this.reconnectAttempts}):`, err.message);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection-change', { connected: false, reason: 'max_reconnect_attempts' });
      }
    });

    // Room events
    this.socket.on('user-joined', (user: CollabUser) => {
      this.emit('user-joined', user);
    });

    this.socket.on('user-left', (data: { id: string }) => {
      this.emit('user-left', data);
    });

    this.socket.on('user-updated', (user: CollabUser) => {
      this.emit('user-updated', user);
    });

    this.socket.on('participants', (participants: CollabUser[]) => {
      this.emit('participants', participants);
    });

    // Cursor events
    this.socket.on('cursor-move', (cursor: RemoteCursor) => {
      this.emit('cursor-move', cursor);
    });

    // State sync events
    this.socket.on('state-update', (update: CollabStateUpdate) => {
      this.emit('state-update', update);
    });

    // Node action events
    this.socket.on('node-action', (action: NodeAction) => {
      this.emit('node-action', action);
    });

    // Connector action events
    this.socket.on('connector-action', (action: ConnectorAction) => {
      this.emit('connector-action', action);
    });

    // Full sync request/response
    this.socket.on('request-full-sync', () => {
      this.emit('request-full-sync', {});
    });

    this.socket.on('full-sync', (data: { state: CollabState; senderId: string }) => {
      this.emit('full-sync', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, user: { name: string; color?: string }) {
    if (!this.socket?.connected) {
      this.currentRoom = roomId;
      this.currentUser = { name: user.name, color: user.color || this.generateColor(user.name) };
      this.connect();
      return;
    }

    this.currentRoom = roomId;
    this.currentUser = { name: user.name, color: user.color || this.generateColor(user.name) };
    this.socket.emit('join-room', { roomId, user: this.currentUser });
  }

  leaveRoom() {
    if (this.socket?.connected && this.currentRoom) {
      this.socket.emit('leave-room', { roomId: this.currentRoom });
    }
    this.currentRoom = null;
  }

  broadcastCursor(position: CursorPosition) {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('cursor-move', { roomId: this.currentRoom, position });
  }

  broadcastState(state: CollabState) {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('state-update', { roomId: this.currentRoom, state });
  }

  broadcastNodeAction(action: Omit<NodeAction, 'senderId' | 'senderName' | 'timestamp'>) {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('node-action', {
      roomId: this.currentRoom,
      ...action,
      senderId: this.socket.id,
      senderName: this.currentUser?.name || 'Anonymous',
      timestamp: Date.now(),
    });
  }

  broadcastConnectorAction(action: Omit<ConnectorAction, 'senderId' | 'senderName' | 'timestamp'>) {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('connector-action', {
      roomId: this.currentRoom,
      ...action,
      senderId: this.socket.id,
      senderName: this.currentUser?.name || 'Anonymous',
      timestamp: Date.now(),
    });
  }

  requestFullSync() {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('request-full-sync', { roomId: this.currentRoom });
  }

  sendFullSync(state: CollabState) {
    if (!this.socket?.connected || !this.currentRoom) return;
    this.socket.emit('full-sync', { roomId: this.currentRoom, state });
  }

  updateUserInfo(name: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('user-info', { name });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  getCurrentUser(): { name: string; color: string } | null {
    return this.currentUser;
  }

  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  setApplyingRemoteUpdate(value: boolean) {
    this.isApplyingRemoteUpdate = value;
  }

  isApplyingRemote(): boolean {
    return this.isApplyingRemoteUpdate;
  }

  on<T>(event: string, callback: EventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit<T>(event: string, data: T) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[collab] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  private generateColor(seed: string): string {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
      '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
      '#f43f5e', '#14b8a6', '#fbbf24', '#a855f7'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

export const collabService = new CollabService();
