import { useMemo, useState } from 'react';

import { ArcLayer, DeckGL, GeoJsonLayer, ScatterplotLayer, TextLayer } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';

import ModuleCard from '../../components/ModuleCard';
import {
  darkMapStyle,
  getFilteredEvents,
  getEventEndpoints,
  getSceneRegionNames,
  getSceneGeoJson,
  getSceneNodes,
  sceneMeta,
  timeWindowMeta
} from '../../mock/consoleData';
import { useConsoleStore } from '../../store/consoleStore';

const zoomMarks = [
  { label: '国际层', value: 3 },
  { label: '省级层', value: 5 },
  { label: '城市层', value: 8 },
  { label: '交易层', value: 10 }
];

export default function MapStage() {
  const events = useConsoleStore((state) => state.events);
  const zoomLevel = useConsoleStore((state) => state.zoomLevel);
  const sceneLevel = useConsoleStore((state) => state.sceneLevel);
  const setZoomLevel = useConsoleStore((state) => state.setZoomLevel);
  const viewState = useConsoleStore((state) => state.viewState);
  const setMapViewState = useConsoleStore((state) => state.setMapViewState);
  const activeEventId = useConsoleStore((state) => state.activeEventId);
  const setActiveEventId = useConsoleStore((state) => state.setActiveEventId);
  const geoCollections = useConsoleStore((state) => state.geoCollections);
  const geoStatus = useConsoleStore((state) => state.geoStatus);
  const geoError = useConsoleStore((state) => state.geoError);
  const timeWindow = useConsoleStore((state) => state.timeWindow);
  const setTimeWindow = useConsoleStore((state) => state.setTimeWindow);
  const dataMode = useConsoleStore((state) => state.dataMode);
  const dataTransport = useConsoleStore((state) => state.dataTransport);
  const dataStatus = useConsoleStore((state) => state.dataStatus);
  const dataError = useConsoleStore((state) => state.dataError);
  const lastSyncAt = useConsoleStore((state) => state.lastSyncAt);
  const requestedDataMode = useConsoleStore((state) => state.requestedDataMode);
  const setRequestedDataMode = useConsoleStore((state) => state.setRequestedDataMode);
  const layerVisibility = useConsoleStore((state) => state.layerVisibility);
  const toggleLayer = useConsoleStore((state) => state.toggleLayer);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const visibleEvents = useMemo(() => getFilteredEvents(events, timeWindow), [events, timeWindow]);

  const layers = useMemo(() => {
    const geoJson = getSceneGeoJson(sceneLevel, geoCollections);
    const nodes = getSceneNodes(sceneLevel);
    const activeEvent = visibleEvents.find((event) => event.id === activeEventId);
    const activeRegionNames = new Set(getSceneRegionNames(activeEvent, sceneLevel));

    const arcData = visibleEvents.map((event) => {
      const endpoints = getEventEndpoints(event, sceneLevel);
      return {
        ...event,
        sourcePosition: endpoints.source.coordinates,
        targetPosition: endpoints.target.coordinates,
        sourceName: endpoints.source.name,
        targetName: endpoints.target.name,
        active: event.id === activeEventId
      };
    });

    const pointData = nodes.map((node) => {
      const active = arcData.some(
        (event) => event.active && (event.sourceName === node.name || event.targetName === node.name)
      );
      return { ...node, active };
    });

    const haloPoints = pointData.filter((node) => node.active);
    const labelData = pointData.filter((node) => {
      if (node.active) return true;
      if (sceneLevel === 'global') return true;
      if (sceneLevel === 'province') return node.kind === 'target';
      return node.kind === 'target';
    });

    const result = [];

    if (geoJson && layerVisibility.regions) {
      result.push(
        new GeoJsonLayer({
          id: `geo-glow-${sceneLevel}`,
          data: geoJson,
          stroked: true,
          filled: false,
          pickable: false,
          getLineColor: (feature) =>
            activeRegionNames.has(feature.properties?.name)
              ? [56, 189, 248, 120]
              : sceneLevel === 'global'
                ? [38, 140, 255, 70]
                : [34, 211, 238, 60],
          getLineWidth: (feature) => (activeRegionNames.has(feature.properties?.name) ? 8 : 4.5),
          lineWidthUnits: 'pixels',
          lineJointRounded: true,
          lineCapRounded: true,
          parameters: {
            depthTest: false
          },
          updateTriggers: {
            getLineColor: [activeEventId, sceneLevel],
            getLineWidth: [activeEventId, sceneLevel]
          }
        })
      );

      result.push(
        new GeoJsonLayer({
          id: `geo-${sceneLevel}`,
          data: geoJson,
          stroked: true,
          filled: true,
          pickable: true,
          getFillColor: (feature) => {
            const featureName = feature.properties?.name;
            if (activeRegionNames.has(featureName)) {
              return [56, 189, 248, 185];
            }
            const risk = Number(feature.properties?.risk || 0.4);
            if (risk >= 0.8) return [190, 45, 84, 155];
            if (risk >= 0.65) return [214, 108, 40, 138];
            if (risk >= 0.5) return [214, 166, 60, 120];
            return [47, 109, 201, 95];
          },
          getLineColor: (feature) => (activeRegionNames.has(feature.properties?.name) ? [125, 211, 252, 240] : [123, 174, 255, 120]),
          getLineWidth: (feature) => (activeRegionNames.has(feature.properties?.name) ? 2.8 : 1.5),
          lineWidthUnits: 'pixels',
          lineJointRounded: true,
          lineCapRounded: true,
          parameters: {
            depthTest: false
          },
          updateTriggers: {
            getFillColor: [activeEventId, sceneLevel],
            getLineColor: [activeEventId, sceneLevel],
            getLineWidth: [activeEventId, sceneLevel]
          }
        })
      );
    }

    if (layerVisibility.flows) {
      result.push(
        new ArcLayer({
          id: `arc-${sceneLevel}`,
          data: arcData,
          pickable: true,
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getSourceColor: (d) => (d.active ? [56, 189, 248] : [96, 165, 250, 165]),
          getTargetColor: (d) => (d.level === '高危' ? [251, 113, 133] : [245, 158, 11]),
          getWidth: (d) => (d.active ? 5 : d.level === '高危' ? 4 : 2.5),
          greatCircle: sceneLevel === 'global',
          onHover: ({ object }) => setHoveredEvent(object || null),
          onClick: ({ object }) => {
            if (object?.id) setActiveEventId(object.id, true);
          }
        })
      );
    }

    if (layerVisibility.nodes) {
      result.push(
        new ScatterplotLayer({
          id: `points-halo-${sceneLevel}`,
          data: haloPoints,
          pickable: false,
          radiusUnits: 'pixels',
          getPosition: (d) => d.coordinates,
          getRadius: sceneLevel === 'outlet' ? 16 : 20,
          getFillColor: [56, 189, 248, 40],
          stroked: true,
          filled: true,
          getLineColor: [125, 211, 252, 160],
          getLineWidth: 2
        })
      );

      result.push(
        new ScatterplotLayer({
          id: `points-${sceneLevel}`,
          data: pointData,
          pickable: false,
          radiusUnits: 'pixels',
          getPosition: (d) => d.coordinates,
          getRadius: (d) => (d.active ? 10 : sceneLevel === 'outlet' ? 5 : 7),
          getFillColor: (d) => (d.kind === 'source' ? [56, 189, 248, 220] : [251, 113, 133, 220]),
          getLineColor: [255, 255, 255, 180],
          getLineWidth: 1
        })
      );
    }

    if (layerVisibility.labels) {
      result.push(
        new TextLayer({
          id: `labels-${sceneLevel}`,
          data: labelData,
          getPosition: (d) => d.coordinates,
          getText: (d) => d.name,
          getColor: (d) => (d.active ? [255, 255, 255, 245] : [191, 219, 254, 215]),
          getSize: sceneLevel === 'global' ? 13 : 11,
          sizeUnits: 'pixels',
          getPixelOffset: [0, -14],
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          getBackgroundColor: (d) => (d.active ? [12, 24, 42, 210] : [8, 18, 32, 168]),
          background: true,
          getBorderColor: (d) => (d.active ? [125, 211, 252, 180] : [148, 163, 184, 80]),
          getBorderWidth: 1,
          borderWidthUnits: 'pixels',
          fontSettings: {
            sdf: true,
            radius: 8,
            buffer: 4
          }
        })
      );
    }

    return result;
  }, [activeEventId, geoCollections, layerVisibility.flows, layerVisibility.labels, layerVisibility.nodes, layerVisibility.regions, sceneLevel, setActiveEventId, visibleEvents]);

  const activeEvent = visibleEvents.find((event) => event.id === activeEventId) || visibleEvents[0];
  const currentSceneMeta = sceneMeta[sceneLevel];
  const timeWindowOptions = Object.entries(timeWindowMeta);
  const layerOptions = [
    { key: 'regions', label: '区块' },
    { key: 'flows', label: '飞线' },
    { key: 'nodes', label: '点位' },
    { key: 'labels', label: '标签' }
  ];
  const dataModeOptions = [
    { key: 'mock', label: 'Mock' },
    { key: 'remote', label: 'Remote' }
  ];
  const syncLabel = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString('zh-CN', { hour12: false }) : '--:--:--';

  return (
    <ModuleCard
      title="MapStage 地图主舞台"
      subtitle="中上模块，承担国际 / 国内 / 城市 / 网点四层地图联动。"
      extra={<span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">React + deck.gl + Zustand</span>}
      className="overflow-hidden"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-console-text">
            当前语义层级：{currentSceneMeta.label}
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-console-muted">
            Zoom = {zoomLevel.toFixed(1)}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {zoomMarks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setZoomLevel(item.value)}
                className={`rounded-full border px-3 py-2 text-xs transition ${
                  zoomLevel === item.value
                    ? 'border-sky-300/40 bg-sky-400/15 text-sky-100'
                    : 'border-white/10 bg-white/[0.04] text-console-muted hover:border-white/20 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(2,12,28,0.72),rgba(2,12,28,0.46))] px-3 py-2.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-text">{currentSceneMeta.label}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">{currentSceneMeta.zoomHint}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">{visibleEvents.length} 条事件</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">当前 {activeEvent?.id || '未选择'}</span>
            {activeEvent ? <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">{activeEvent.amount}</span> : null}
            {activeEvent ? <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">{activeEvent.status}</span> : null}
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">地图 {geoStatus}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">{dataMode.toUpperCase()} / {dataTransport.toUpperCase()}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-console-muted">同步 {syncLabel}</span>
            <div className="ml-auto flex flex-wrap gap-2">
              {dataModeOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRequestedDataMode(item.key)}
                  className={`rounded-full border px-3 py-1 text-[11px] transition ${
                    requestedDataMode === item.key
                      ? 'border-violet-300/35 bg-violet-400/15 text-violet-100'
                      : 'border-white/10 bg-white/[0.03] text-console-muted hover:border-white/20 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {(geoError || dataError) ? <p className="mt-2 text-xs text-amber-200">{geoError || dataError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-3 py-2">
          {timeWindowOptions.map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTimeWindow(key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                timeWindow === key
                  ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                  : 'border-white/10 bg-white/[0.04] text-console-muted hover:border-white/20 hover:text-white'
              }`}
            >
              {meta.label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            {layerOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleLayer(item.key)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  layerVisibility[item.key]
                    ? 'border-sky-300/35 bg-sky-400/15 text-sky-100'
                    : 'border-white/10 bg-white/[0.03] text-console-muted hover:border-white/20 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-full min-h-0 overflow-hidden rounded-[28px] border border-sky-300/10 bg-[linear-gradient(180deg,#04111f_0%,#07182a_45%,#081424_100%)] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.05),0_0_32px_rgba(14,165,233,0.08)]">
          <div className="absolute inset-0">
            <DeckGL
              controller={{ dragRotate: false, touchRotate: false, minZoom: 1.2, maxZoom: 11.5 }}
              layers={layers}
              viewState={viewState}
              style={{ width: '100%', height: '100%' }}
              onViewStateChange={({ viewState: nextViewState }) => setMapViewState(nextViewState)}
            >
              <Map
                mapLib={import('maplibre-gl')}
                reuseMaps
                mapStyle={darkMapStyle}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              />
            </DeckGL>
          </div>

          <div className="pointer-events-none absolute inset-[-1px] rounded-[28px] border border-sky-300/12 shadow-[0_0_36px_rgba(56,189,248,0.08),inset_0_0_28px_rgba(56,189,248,0.05)]" />
          <div className="pointer-events-none absolute left-[10%] top-[10%] h-72 w-72 rounded-full border border-sky-400/10 bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_60%)] blur-2xl" />
          <div className="pointer-events-none absolute right-[8%] top-[16%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.12),transparent_62%)] blur-[88px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_34%,rgba(59,130,246,0.22),transparent_22%),radial-gradient(circle_at_74%_36%,rgba(248,113,113,0.14),transparent_16%),radial-gradient(circle_at_56%_74%,rgba(250,204,21,0.14),transparent_20%),radial-gradient(circle_at_50%_54%,rgba(14,165,233,0.12),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,38,0.08),rgba(4,10,20,0.24)),radial-gradient(circle_at_50%_58%,rgba(37,99,235,0.12),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:54px_54px]" />
          {hoveredEvent ? (
            <div className="absolute bottom-4 left-4 z-10 w-48 rounded-xl border border-sky-300/12 bg-slate-950/62 px-3 py-2 backdrop-blur-sm shadow-[0_10px_24px_rgba(2,6,23,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-xs text-console-text">{hoveredEvent.id}</strong>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-console-muted">{hoveredEvent.level}</span>
              </div>
              <p className="mt-1 text-xs text-console-text">{hoveredEvent.sourceName} → {hoveredEvent.targetName}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-console-muted">
                <span>{hoveredEvent.amount}</span>
                <span>{hoveredEvent.status}</span>
              </div>
            </div>
          ) : null}
          <div className="absolute right-4 bottom-4 z-10 rounded-full border border-white/10 bg-slate-950/54 px-3 py-2 backdrop-blur-sm shadow-[0_6px_18px_rgba(2,6,23,0.16)]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-console-muted">{sceneLevel === 'global' ? '全球' : '省级'}</span>
              <div className="w-24 h-1.5 rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,0.95)_0%,rgba(250,204,21,0.95)_48%,rgba(244,63,94,0.95)_100%)] shadow-[0_0_12px_rgba(56,189,248,0.14)]" />
              <div className="flex items-center gap-1 text-[9px] text-console-muted">
                <span>L</span>
                <span>M</span>
                <span>H</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}