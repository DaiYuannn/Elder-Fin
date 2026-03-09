import { create } from 'zustand';

import { consoleEvents, getEventEndpoints, getSceneLevel, getSceneViewState } from '../mock/consoleData';
import { loadGeoCollections } from '../mock/geoCollections';
import { createConsoleRemoteChannel, getRemoteConfig, loadConsoleSnapshot } from '../services/consoleDataSource';

const defaultLayouts = {
  lg: [
    { i: 'overall-info', x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 6 },
    { i: 'family-flow', x: 0, y: 7, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'map-stage', x: 4, y: 0, w: 8, h: 15, minW: 6, minH: 11 },
    { i: 'risk-stream', x: 12, y: 0, w: 4, h: 15, minW: 3, minH: 9 }
  ]
};

const initialScene = getSceneLevel(3);
const initialViewState = getSceneViewState(initialScene);
const remoteConfig = getRemoteConfig();

function focusViewForEvent(event, sceneLevel) {
  const endpoints = getEventEndpoints(event, sceneLevel);
  const target = endpoints.target || endpoints.source;
  const sceneViewState = getSceneViewState(sceneLevel);

  return {
    ...sceneViewState,
    longitude: target.coordinates[0],
    latitude: target.coordinates[1]
  };
}

function applySnapshotToState(state, snapshot) {
  return {
    dataMode: snapshot.mode,
    dataTransport: snapshot.transport,
    lastSyncAt: snapshot.timestamp,
    events: snapshot.events,
    activeEventId: snapshot.events[0]?.id || state.activeEventId
  };
}

export const useConsoleStore = create((set, get) => ({
  zoomLevel: 3,
  sceneLevel: initialScene,
  viewState: initialViewState,
  activeEventId: consoleEvents[0].id,
  layouts: defaultLayouts,
  events: consoleEvents,
  geoCollections: {
    worldGeoJson: null,
    provinceGeoJson: null
  },
  geoStatus: 'idle',
  geoError: null,
  requestedDataMode: 'local',
  timeWindow: '24h',
  dataMode: 'local',
  dataTransport: 'local-storage',
  dataError: null,
  dataStatus: 'idle',
  lastSyncAt: null,
  remoteChannel: null,
  layerVisibility: {
    regions: true,
    flows: true,
    nodes: true,
    labels: true
  },
  setZoomLevel: (zoomLevel) =>
    set((state) => ({
      zoomLevel,
      sceneLevel: getSceneLevel(zoomLevel),
      viewState: {
        ...state.viewState,
        ...getSceneViewState(getSceneLevel(zoomLevel)),
        zoom: zoomLevel
      }
    })),
  setMapViewState: (nextViewState) =>
    set(() => ({
      viewState: nextViewState,
      zoomLevel: nextViewState.zoom,
      sceneLevel: getSceneLevel(nextViewState.zoom)
    })),
  setActiveEventId: (activeEventId, shouldFocus = false) =>
    set((state) => {
      const event = state.events.find((item) => item.id === activeEventId);
      if (!event) {
        return { activeEventId };
      }

      return {
        activeEventId,
        viewState: shouldFocus ? focusViewForEvent(event, state.sceneLevel) : state.viewState
      };
    }),
  setLayouts: (layouts) => set(() => ({ layouts })),
  setTimeWindow: (timeWindow) => set(() => ({ timeWindow })),
  closeRemoteChannel: () => {
    const channel = get().remoteChannel;
    if (channel?.close) {
      channel.close();
    }

    set(() => ({ remoteChannel: null }));
  },
  startRemoteChannel: () => {
    get().closeRemoteChannel();

    if (get().requestedDataMode !== 'remote') {
      return;
    }

    if (!['polling', 'sse'].includes(remoteConfig.transport)) {
      return;
    }

    try {
      const remoteChannel = createConsoleRemoteChannel({
        transport: remoteConfig.transport,
        dataUrl: remoteConfig.dataUrl,
        sseUrl: remoteConfig.sseUrl,
        pollIntervalMs: remoteConfig.pollIntervalMs,
        onSnapshot: (snapshot) => {
          set((state) => ({
            ...applySnapshotToState(state, snapshot),
            dataStatus: 'streaming',
            dataError: null
          }));
        },
        onStatus: (status) => {
          set(() => ({ dataStatus: status }));
        },
        onError: (error) => {
          set(() => ({ dataError: error.message }));
        }
      });

      set(() => ({ remoteChannel }));
    } catch (error) {
      set(() => ({
        dataStatus: 'error',
        dataError: error instanceof Error ? error.message : 'Remote channel failed to start'
      }));
    }
  },
  setRequestedDataMode: async (requestedDataMode) => {
    get().closeRemoteChannel();
    set(() => ({ requestedDataMode, dataStatus: 'loading', dataError: null }));

    try {
      const snapshot = await loadConsoleSnapshot(requestedDataMode, remoteConfig);
      set((state) => ({
        requestedDataMode,
        dataStatus: 'ready',
        dataError: null,
        ...applySnapshotToState(state, snapshot)
      }));

      if (requestedDataMode === 'remote') {
        get().startRemoteChannel();
      }
    } catch (error) {
      const fallback = await loadConsoleSnapshot('local');
      set((state) => ({
        requestedDataMode,
        dataStatus: 'fallback',
        dataError: error instanceof Error ? error.message : 'Snapshot load failed',
        ...applySnapshotToState(state, fallback)
      }));
    }
  },
  toggleLayer: (layerKey) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerKey]: !state.layerVisibility[layerKey]
      }
    })),
  hydrateGeoData: async () => {
    set(() => ({ geoStatus: 'loading', geoError: null }));

    try {
      const geoCollections = await loadGeoCollections();
      set(() => ({
        geoCollections,
        geoStatus: 'ready',
        geoError: null
      }));
    } catch (error) {
      set(() => ({
        geoStatus: 'error',
        geoError: error instanceof Error ? error.message : 'Geo data load failed'
      }));
    }
  },
  hydrateConsoleData: async () => {
    set(() => ({ dataStatus: 'loading', dataError: null }));

    try {
      const initialMode = remoteConfig.defaultMode === 'remote' ? 'remote' : remoteConfig.defaultMode === 'mock' ? 'mock' : 'local';
      const snapshot = await loadConsoleSnapshot(initialMode, remoteConfig);

      set((state) => ({
        requestedDataMode: initialMode,
        dataStatus: 'ready',
        dataError: null,
        ...applySnapshotToState(state, snapshot)
      }));

      if (initialMode === 'remote') {
        get().startRemoteChannel();
      }
    } catch (error) {
      const fallback = await loadConsoleSnapshot('local');

      set((state) => ({
        requestedDataMode: 'local',
        dataStatus: 'fallback',
        dataError: error instanceof Error ? error.message : 'Snapshot load failed',
        ...applySnapshotToState(state, fallback)
      }));
    }
  }
}));