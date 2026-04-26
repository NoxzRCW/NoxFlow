import { useEffect, useRef, useCallback, useState } from 'react';
import { collabService, RemoteCursor, CollabStateUpdate, CollabUser } from '../services/collabService';
import { useCollabStore } from '../stores/collabStore';

// We need to import from fossflow-lib to access stores
// These are re-exported by the package - but they require providers
// For collab, we use a lazy approach: get store APIs when available
let isApplyingRemoteUpdate = false;
let lastBroadcastedModel: any = null;
let lastBroadcastedScene: any = null;

export function useCollab(roomId?: string) {
  const [modelStoreApi, setModelStoreApi] = useState<any>(null);
  const [sceneStoreApi, setSceneStoreApi] = useState<any>(null);
  const collabActions = useCollabStore((state) => state.actions);
  const isEnabled = useCollabStore((state) => state.isEnabled);
  const myUserName = useCollabStore((state) => state.myUserName);
  const myColor = useCollabStore((state) => state.myColor);
  const cleanupRef = useRef<(() => void)[]>([]);

  // Lazy load store APIs when they become available
  useEffect(() => {
    const checkStores = () => {
      try {
        // Try to get stores from window if available
        const win = window as any;
        if (win.__NOXFLOW_MODEL_STORE__) {
          setModelStoreApi(win.__NOXFLOW_MODEL_STORE__);
        }
        if (win.__NOXFLOW_SCENE_STORE__) {
          setSceneStoreApi(win.__NOXFLOW_SCENE_STORE__);
        }
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

    // Listeners
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

    const unsubState = collabService.on('state-update', ({ senderId, state }: CollabStateUpdate) => {
      if (!state) return;

      isApplyingRemoteUpdate = true;
      try {
        // Apply remote state to local stores (skip history)
        if (state.model) {
          modelStoreApi.getState().actions.set(state.model, true);
        }
        if (state.scene) {
          sceneStoreApi.getState().actions.set(state.scene, true);
        }
      } finally {
        // Use timeout to ensure zustand subscribers fire before unlocking
        setTimeout(() => {
          isApplyingRemoteUpdate = false;
        }, 50);
      }
    });

    cleanupRef.current = [
      unsubConnection,
      unsubParticipants,
      unsubJoined,
      unsubLeft,
      unsubUpdated,
      unsubCursor,
      unsubState,
    ];

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
      collabService.leaveRoom();
    };
  }, [roomId, isEnabled, myUserName, myColor, collabActions, modelStoreApi, sceneStoreApi]);

  // Subscribe to local store changes and broadcast them
  useEffect(() => {
    if (!roomId || !isEnabled) return;

    const unsubscribeModel = modelStoreApi.subscribe((state) => {
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

      // Debounce: only broadcast if meaningful change
      const modelStr = JSON.stringify(modelData);
      const lastStr = JSON.stringify(lastBroadcastedModel);
      if (modelStr === lastStr) return;

      lastBroadcastedModel = modelData;

      const sceneState = sceneStoreApi.getState();
      const sceneData = {
        connectors: sceneState.connectors,
        textBoxes: sceneState.textBoxes,
      };
      lastBroadcastedScene = sceneData;

      collabService.broadcastState({ model: modelData, scene: sceneData });
    });

    const unsubscribeScene = sceneStoreApi.subscribe((state) => {
      if (isApplyingRemoteUpdate) return;

      const sceneData = {
        connectors: state.connectors,
        textBoxes: state.textBoxes,
      };

      const sceneStr = JSON.stringify(sceneData);
      const lastStr = JSON.stringify(lastBroadcastedScene);
      if (sceneStr === lastStr) return;

      lastBroadcastedScene = sceneData;

      const modelState = modelStoreApi.getState();
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

    return () => {
      unsubscribeModel();
      unsubscribeScene();
    };
  }, [roomId, isEnabled, modelStoreApi, sceneStoreApi]);

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
