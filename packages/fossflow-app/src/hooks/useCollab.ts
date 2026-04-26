import { useEffect, useRef, useCallback } from 'react';
import { collabService, RemoteCursor, CollabStateUpdate, CollabUser } from '../services/collabService';
import { useCollabStore } from '../stores/collabStore';

let isApplyingRemoteUpdate = false;
let lastBroadcastedModel: any = null;
let lastBroadcastedScene: any = null;

export function useCollab(roomId?: string) {
  // Use refs so listeners always read the latest store API without triggering reconnects
  const modelStoreRef = useRef<any>(null);
  const sceneStoreRef = useRef<any>(null);
  const collabActions = useCollabStore((state) => state.actions);
  const isEnabled = useCollabStore((state) => state.isEnabled);
  const myUserName = useCollabStore((state) => state.myUserName);
  const myColor = useCollabStore((state) => state.myColor);

  // Lazy load store APIs into refs (no state — avoids triggering reconnects)
  useEffect(() => {
    const checkStores = () => {
      try {
        const win = window as any;
        if (win.__NOXFLOW_MODEL_STORE__) modelStoreRef.current = win.__NOXFLOW_MODEL_STORE__;
        if (win.__NOXFLOW_SCENE_STORE__) sceneStoreRef.current = win.__NOXFLOW_SCENE_STORE__;
      } catch (e) {
        // Stores not available yet
      }
    };

    checkStores();
    const interval = setInterval(checkStores, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize collaboration when roomId is provided
  useEffect(() => {
    if (!roomId || !isEnabled) return;

    const name = myUserName || `User ${Math.floor(Math.random() * 1000)}`;
    const color = myColor;

    collabService.connect();
    collabService.joinRoom(roomId, { name, color });
    collabActions.setRoomId(roomId);
    collabActions.setConnected(collabService.isConnected());

    const unsubConnection = collabService.on('connection-change', ({ connected }: { connected: boolean }) => {
      collabActions.setConnected(connected);
    });

    const unsubParticipants = collabService.on('participants', (participants: CollabUser[]) => {
      collabActions.setParticipants(participants);
    });

    const unsubJoined = collabService.on('user-joined', (user: CollabUser) => {
      collabActions.addParticipant(user);
    });

    const unsubLeft = collabService.on('user-left', ({ id }: { id: string }) => {
      collabActions.removeParticipant(id);
    });

    const unsubUpdated = collabService.on('user-updated', (user: CollabUser) => {
      collabActions.updateParticipant(user);
    });

    const unsubCursor = collabService.on('cursor-move', (cursor: RemoteCursor) => {
      collabActions.updateCursor(cursor);
    });

    // Refs are always current — no stale closure, no reconnect needed when stores load
    const unsubState = collabService.on('state-update', ({ state }: CollabStateUpdate) => {
      const modelStoreApi = modelStoreRef.current;
      const sceneStoreApi = sceneStoreRef.current;
      if (!state || !modelStoreApi || !sceneStoreApi) return;

      isApplyingRemoteUpdate = true;
      try {
        if (state.model) modelStoreApi.getState().actions.set(state.model, true);
        if (state.scene) sceneStoreApi.getState().actions.set(state.scene, true);
      } finally {
        setTimeout(() => { isApplyingRemoteUpdate = false; }, 50);
      }
    });

    return () => {
      unsubConnection();
      unsubParticipants();
      unsubJoined();
      unsubLeft();
      unsubUpdated();
      unsubCursor();
      unsubState();
      collabService.leaveRoom();
    };
  }, [roomId, isEnabled, myUserName, myColor, collabActions]);

  // Subscribe to local store changes and broadcast them
  useEffect(() => {
    if (!roomId || !isEnabled) return;

    // Wait until stores are available before subscribing
    let unsubscribeModel: (() => void) | null = null;
    let unsubscribeScene: (() => void) | null = null;

    const setupSubscriptions = () => {
      const modelStoreApi = modelStoreRef.current;
      const sceneStoreApi = sceneStoreRef.current;
      if (!modelStoreApi || !sceneStoreApi) return false;

      unsubscribeModel = modelStoreApi.subscribe((state: any) => {
        if (isApplyingRemoteUpdate) return;

        const modelData = {
          version: state.version,
          title: state.title,
          description: state.description,
          colors: state.colors,
          icons: state.icons,
          items: state.items,
          views: state.views,
        };

        const modelStr = JSON.stringify(modelData);
        if (modelStr === JSON.stringify(lastBroadcastedModel)) return;
        lastBroadcastedModel = modelData;

        const sceneState = sceneStoreRef.current.getState();
        const sceneData = { connectors: sceneState.connectors, textBoxes: sceneState.textBoxes };
        lastBroadcastedScene = sceneData;

        collabService.broadcastState({ model: modelData, scene: sceneData });
      });

      unsubscribeScene = sceneStoreApi.subscribe((state: any) => {
        if (isApplyingRemoteUpdate) return;

        const sceneData = { connectors: state.connectors, textBoxes: state.textBoxes };
        const sceneStr = JSON.stringify(sceneData);
        if (sceneStr === JSON.stringify(lastBroadcastedScene)) return;
        lastBroadcastedScene = sceneData;

        const modelState = modelStoreRef.current.getState();
        const modelData = {
          version: modelState.version,
          title: modelState.title,
          description: modelState.description,
          colors: modelState.colors,
          icons: modelState.icons,
          items: modelState.items,
          views: modelState.views,
        };
        lastBroadcastedModel = modelData;

        collabService.broadcastState({ model: modelData, scene: sceneData });
      });

      return true;
    };

    if (!setupSubscriptions()) {
      // Poll until stores are available
      const interval = setInterval(() => {
        if (setupSubscriptions()) clearInterval(interval);
      }, 200);
      return () => {
        clearInterval(interval);
        unsubscribeModel?.();
        unsubscribeScene?.();
      };
    }

    return () => {
      unsubscribeModel?.();
      unsubscribeScene?.();
    };
  }, [roomId, isEnabled]);

  // Send cursor position
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (!isEnabled || !roomId) return;
    collabService.broadcastCursor({ x, y });
  }, [isEnabled, roomId]);

  const enableCollab = useCallback(() => {
    collabActions.setEnabled(true);
  }, [collabActions]);

  const disableCollab = useCallback(() => {
    collabActions.setEnabled(false);
    collabService.disconnect();
    collabActions.setConnected(false);
    collabActions.setRoomId(null);
    collabActions.setParticipants([]);
    collabActions.setCursors([]);
  }, [collabActions]);

  return {
    sendCursorPosition,
    enableCollab,
    disableCollab,
    isEnabled,
    isConnected: useCollabStore((state) => state.isConnected),
    participants: useCollabStore((state) => state.participants),
    cursors: useCollabStore((state) => state.cursors),
    myUserName,
    myColor,
  };
}
