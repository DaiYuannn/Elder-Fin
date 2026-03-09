import ModuleCard from '../../components/ModuleCard';
import { getFilteredEvents, sceneMeta, timeWindowMeta } from '../../mock/consoleData';
import { useConsoleStore } from '../../store/consoleStore';

export default function OverallInfo() {
  const events = useConsoleStore((state) => state.events);
  const activeEventId = useConsoleStore((state) => state.activeEventId);
  const sceneLevel = useConsoleStore((state) => state.sceneLevel);
  const zoomLevel = useConsoleStore((state) => state.zoomLevel);
  const timeWindow = useConsoleStore((state) => state.timeWindow);
  const dataMode = useConsoleStore((state) => state.dataMode);
  const dataStatus = useConsoleStore((state) => state.dataStatus);

  const visibleEvents = getFilteredEvents(events, timeWindow);

  const activeEvent = visibleEvents.find((item) => item.id === activeEventId) || visibleEvents[0];
  const highRiskCount = visibleEvents.filter((item) => item.level === '高危').length;
  const totalAmount = visibleEvents.reduce((sum, item) => sum + item.amountValue, 0);
  const risingCount = visibleEvents.filter((item) => item.trend === '升温' || item.trend === '新近激活').length;
  const metrics = [
    { label: '联动场景层级', value: sceneMeta[sceneLevel].label, tone: 'text-sky-300' },
    { label: '当前事件总量', value: `${visibleEvents.length} 起`, tone: 'text-white' },
    { label: '已保护资金', value: `¥${Math.round(totalAmount / 10000)} 万`, tone: 'text-emerald-300' },
    { label: '正在升温区域', value: `${risingCount} 个`, tone: 'text-rose-300' }
  ];

  return (
    <ModuleCard title="全局态势" subtitle="左上模块，汇总当前国际与国内风险态势。">
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/5 bg-console-panelSoft p-4">
              <span className="text-xs uppercase tracking-[0.14em] text-console-muted">{item.label}</span>
              <strong className={`mt-2 block text-2xl font-semibold ${item.tone}`}>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-sky-400/10 bg-sky-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-sky-200">缩放语义状态</span>
            <span className="rounded-full border border-sky-300/20 px-3 py-1 text-xs text-sky-100">{timeWindowMeta[timeWindow].label} / Zoom {zoomLevel.toFixed(1)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-console-muted">
            当前处于 {sceneMeta[sceneLevel].label}，地图缩放会同步驱动左侧态势、右侧风险流和家庭协作信息视图切换。数据源模式为 {dataMode.toUpperCase()}。
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-console-muted">
            <span className="rounded-full border border-white/10 px-3 py-1">高危 {highRiskCount} 起</span>
            <span className="rounded-full border border-white/10 px-3 py-1">已筛选 {visibleEvents.length} 起</span>
            <span className="rounded-full border border-white/10 px-3 py-1">状态 {dataStatus}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[linear-gradient(180deg,rgba(30,41,59,0.56),rgba(15,23,42,0.46))] p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-console-text">当前聚焦</span>
            <span className="text-console-muted">{activeEvent?.id || '未选择'}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <strong className="text-sm text-console-text">{activeEvent ? `${activeEvent.area} · ${activeEvent.source}` : '等待地图交互'}</strong>
            <p className="mt-2 text-sm leading-6 text-console-muted">
              {activeEvent ? activeEvent.summary : '点击地图飞线或右侧事件卡，左侧全局态势会同步展示当前聚焦信息。'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-console-muted">
              <span className="rounded-full border border-white/10 px-3 py-1">{activeEvent?.level || '未选中'}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{activeEvent?.trend || '无趋势'}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{activeEvent?.amount || '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}