import { create } from 'zustand';
import { RemoteCursor, CollabUser } from '../services/collabService';

export interface CollabStore {
  isConnected: boolean;
  isEnabled: boolean;
  roomId: string | null;
  participants: CollabUser[];
  cursors: RemoteCursor[];
  myUserName: string;
  myColor: string;
  
  actions: {
    setConnected: (connected: boolean) => void;
    setEnabled: (enabled: boolean) => void;
    setRoomId: (roomId: string | null) => void;
    setParticipants: (participants: CollabUser[]) => void;
    addParticipant: (participant: CollabUser) => void;
    removeParticipant: (id: string) => void;
    updateParticipant: (participant: CollabUser) => void;
    updateCursor: (cursor: RemoteCursor) => void;
    removeCursor: (id: string) => void;
    setMyUserName: (name: string) => void;
    setMyColor: (color: string) => void;
  };
}

export const useCollabStore = create<CollabStore>((set, get) => ({
  isConnected: false,
  isEnabled: false,
  roomId: null,
  participants: [],
  cursors: [],
  myUserName: '',
  myColor: '#3b82f6',

  actions: {
    setConnected: (connected) => set({ isConnected: connected }),
    setEnabled: (enabled) => set({ isEnabled: enabled }),
    setRoomId: (roomId) => set({ roomId }),
    setParticipants: (participants) => set({ participants }),
    addParticipant: (participant) =>
      set((state) => ({
        participants: state.participants.some((p) => p.id === participant.id)
          ? state.participants.map((p) => (p.id === participant.id ? participant : p))
          : [...state.participants, participant],
      })),
    removeParticipant: (id) =>
      set((state) => ({
        participants: state.participants.filter((p) => p.id !== id),
        cursors: state.cursors.filter((c) => c.id !== id),
      })),
    updateParticipant: (participant) =>
      set((state) => ({
        participants: state.participants.map((p) =>
          p.id === participant.id ? { ...p, ...participant } : p
        ),
      })),
    updateCursor: (cursor) =>
      set((state) => ({
        cursors: state.cursors.some((c) => c.id === cursor.id)
          ? state.cursors.map((c) => (c.id === cursor.id ? cursor : c))
          : [...state.cursors, cursor],
      })),
    setCursors: (cursors: RemoteCursor[]) => set({ cursors }),
    clearCursors: () => set({ cursors: [] }),
    setMyUserName: (name) => set({ myUserName: name }),
    setMyColor: (color) => set({ myColor: color }),
  },
}));
