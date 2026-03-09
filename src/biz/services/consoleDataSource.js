import { consoleEvents } from '../mock/consoleData';
import { buildLocalConsoleSnapshot } from './unifiedConsoleBridge';

function normalizeCoordinates(value, fallbackCoordinates) {
  if (Array.isArray(value) && value.length >= 2) {
    return [Number(value[0]), Number(value[1])];
  }

  return fallbackCoordinates;
}

function normalizeEndpoint(rawEndpoint, fallbackEndpoint) {
  return {
    name: rawEndpoint?.name || fallbackEndpoint.name,
    coordinates: normalizeCoordinates(rawEndpoint?.coordinates, fallbackEndpoint.coordinates)
  };
}

function resolveEndpoint(rawEvent, sceneLevel, role, fallbackEvent) {
  const propertyKey = `${sceneLevel}${role === 'source' ? 'Source' : 'Target'}`;
  const nestedEndpoint = rawEvent?.endpoints?.[sceneLevel]?.[role];
  const directEndpoint = rawEvent?.[propertyKey];
  return normalizeEndpoint(directEndpoint || nestedEndpoint, fallbackEvent[propertyKey]);
}

function normalizeTimeline(rawTimeline, fallbackTimeline) {
  if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) {
    return fallbackTimeline;
  }

  return rawTimeline.map((item, index) => ({
    label: item?.label || fallbackTimeline[index]?.label || `阶段 ${index + 1}`,
    detail: item?.detail || fallbackTimeline[index]?.detail || '待补充详情',
    minutesAgo: Number(item?.minutesAgo ?? fallbackTimeline[index]?.minutesAgo ?? 0)
  }));
}

function normalizeEvent(rawEvent, index) {
  const fallback = consoleEvents[index % consoleEvents.length];

  return {
    ...fallback,
    ...rawEvent,
    id: rawEvent?.id || fallback.id,
    minutesAgo: Number(rawEvent?.minutesAgo ?? fallback.minutesAgo),
    amount: rawEvent?.amount || fallback.amount,
    amountValue: Number(rawEvent?.amountValue ?? fallback.amountValue),
    area: rawEvent?.area || fallback.area,
    level: rawEvent?.level || fallback.level,
    source: rawEvent?.source || fallback.source,
    status: rawEvent?.status || fallback.status,
    trend: rawEvent?.trend || fallback.trend,
    familyCase: rawEvent?.familyCase || fallback.familyCase,
    familyStatus: rawEvent?.familyStatus || fallback.familyStatus,
    familyChannel: rawEvent?.familyChannel || fallback.familyChannel,
    outreachStatus: rawEvent?.outreachStatus || '',
    outreachNote: rawEvent?.outreachNote || '',
    outreachUpdatedAt: rawEvent?.outreachUpdatedAt || '',
    outreachContact: rawEvent?.outreachContact || '',
    summary: rawEvent?.summary || fallback.summary,
    timeline: normalizeTimeline(rawEvent?.timeline, fallback.timeline),
    globalSource: resolveEndpoint(rawEvent, 'global', 'source', fallback),
    globalTarget: resolveEndpoint(rawEvent, 'global', 'target', fallback),
    provinceSource: resolveEndpoint(rawEvent, 'province', 'source', fallback),
    provinceTarget: resolveEndpoint(rawEvent, 'province', 'target', fallback),
    citySource: resolveEndpoint(rawEvent, 'city', 'source', fallback),
    cityTarget: resolveEndpoint(rawEvent, 'city', 'target', fallback),
    outletSource: resolveEndpoint(rawEvent, 'outlet', 'source', fallback),
    outletTarget: resolveEndpoint(rawEvent, 'outlet', 'target', fallback)
  };
}

export function getRemoteConfig() {
  return {
    defaultMode: import.meta.env.VITE_CONSOLE_DEFAULT_DATA_MODE || 'local',
    transport: import.meta.env.VITE_CONSOLE_REMOTE_TRANSPORT || 'rest',
    dataUrl: import.meta.env.VITE_CONSOLE_DATA_URL || '',
    sseUrl: import.meta.env.VITE_CONSOLE_SSE_URL || import.meta.env.VITE_CONSOLE_DATA_URL || '',
    pollIntervalMs: Number(import.meta.env.VITE_CONSOLE_POLL_INTERVAL_MS || 15000)
  };
}

function normalizeRemoteSnapshot(payload, transport = 'rest') {
  if (Array.isArray(payload)) {
    return {
      mode: 'remote',
      transport,
      timestamp: new Date().toISOString(),
      events: payload.map(normalizeEvent)
    };
  }

  if (payload && Array.isArray(payload.events)) {
    return {
      mode: 'remote',
      transport: payload.meta?.transport || transport,
      timestamp: payload.meta?.timestamp || new Date().toISOString(),
      events: payload.events.map(normalizeEvent)
    };
  }

  throw new Error('Remote snapshot format is invalid');
}

async function requestRemoteSnapshot(url, transport) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Remote snapshot request failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeRemoteSnapshot(payload, transport);
}

export async function loadConsoleSnapshot(mode = 'local', overrides = {}) {
  const remoteConfig = { ...getRemoteConfig(), ...overrides };

  if (mode === 'remote') {
    if (!remoteConfig.dataUrl) {
      throw new Error('VITE_CONSOLE_DATA_URL is not configured');
    }

    return requestRemoteSnapshot(remoteConfig.dataUrl, remoteConfig.transport);
  }

  if (mode === 'mock') {
    return {
      mode: 'mock',
      transport: 'mock',
      timestamp: new Date().toISOString(),
      events: consoleEvents
    };
  }

  return buildLocalConsoleSnapshot();
}

export function createConsoleRemoteChannel({ transport, dataUrl, sseUrl, pollIntervalMs, onSnapshot, onStatus, onError }) {
  if (transport === 'sse') {
    if (!sseUrl) {
      throw new Error('VITE_CONSOLE_SSE_URL is not configured');
    }

    const eventSource = new EventSource(sseUrl);

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onSnapshot(normalizeRemoteSnapshot(payload, 'sse'));
      } catch (error) {
        onError(error instanceof Error ? error : new Error('SSE payload parse failed'));
      }
    };

    eventSource.onopen = () => onStatus('streaming');
    eventSource.onmessage = handleMessage;
    eventSource.addEventListener('snapshot', handleMessage);
    eventSource.onerror = () => {
      onStatus('stream-error');
      onError(new Error('SSE connection failed'));
    };

    return {
      close() {
        eventSource.close();
      }
    };
  }

  if (transport === 'polling') {
    if (!dataUrl) {
      throw new Error('VITE_CONSOLE_DATA_URL is not configured');
    }

    let disposed = false;

    const pump = async () => {
      try {
        const snapshot = await requestRemoteSnapshot(dataUrl, 'polling');
        if (!disposed) {
          onSnapshot(snapshot);
          onStatus('streaming');
        }
      } catch (error) {
        if (!disposed) {
          onStatus('stream-error');
          onError(error instanceof Error ? error : new Error('Polling request failed'));
        }
      }
    };

    pump();
    const timer = window.setInterval(pump, pollIntervalMs);

    return {
      close() {
        disposed = true;
        window.clearInterval(timer);
      }
    };
  }

  return {
    close() {}
  };
}