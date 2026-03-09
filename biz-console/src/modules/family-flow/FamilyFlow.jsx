import ModuleCard from '../../components/ModuleCard';
import { getFilteredEvents, timeWindowMeta } from '../../mock/consoleData';
import { useConsoleStore } from '../../store/consoleStore';

function getAccent(status) {
  if (status.includes('确认')) return 'border-emerald-400/30 text-emerald-200';
  if (status.includes('回执')) return 'border-amber-400/30 text-amber-200';
  return 'border-rose-400/30 text-rose-200';
}

export default function FamilyFlow() {
  const events = useConsoleStore((state) => state.events);
  const activeEventId = useConsoleStore((state) => state.activeEventId);
  const timeWindow = useConsoleStore((state) => state.timeWindow);
  const visibleEvents = getFilteredEvents(events, timeWindow);
  const activeEvent = visibleEvents.find((item) => item.id === activeEventId) || visibleEvents[0];

  const familyCases = visibleEvents.map((event) => ({
    id: event.id,
    name: event.familyCase,
    status: event.familyStatus,
    channel: event.familyChannel,
    area: event.area,
    accent: getAccent(event.familyStatus),
    active: event.id === activeEventId
  }));

  const pendingCount = familyCases.filter((item) => item.status.includes('回执')).length;
  const secondCallCount = familyCases.filter((item) => item.status.includes('二次')).length;
  const confirmedCount = familyCases.filter((item) => item.status.includes('确认')).length;
  const successRate = familyCases.length ? Math.round((confirmedCount / familyCases.length) * 100) : 0;

  return (
    <ModuleCard title="家庭协作流" subtitle={`左下模块，集中展示关键家庭联动信息。当前窗口：${timeWindowMeta[timeWindow].label}`}>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/5 bg-console-panelSoft p-4">
            <span className="text-xs text-console-muted">待确认家庭</span>
            <strong className="mt-2 block text-2xl text-white">{pendingCount}</strong>
          </div>
          <div className="rounded-2xl border border-white/5 bg-console-panelSoft p-4">
            <span className="text-xs text-console-muted">二次外呼</span>
            <strong className="mt-2 block text-2xl text-rose-300">{secondCallCount}</strong>
          </div>
          <div className="rounded-2xl border border-white/5 bg-console-panelSoft p-4">
            <span className="text-xs text-console-muted">协同成功率</span>
            <strong className="mt-2 block text-2xl text-emerald-300">{successRate}%</strong>
          </div>
        </div>
        <div className="grid min-h-0 gap-3 overflow-auto pr-1">
          {familyCases.map((item) => (
            <div key={item.name} className={`rounded-2xl border p-4 ${item.active ? 'border-sky-400/25 bg-sky-500/10' : 'border-white/5 bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-console-text">{item.name}</strong>
                <span className={`rounded-full border px-3 py-1 text-xs ${item.accent}`}>{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-console-muted">当前链路：{item.channel}</p>
              <p className="mt-1 text-xs text-console-muted">关联区域：{item.area}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/5 bg-console-panelSoft p-4 text-sm text-console-muted">
          当前聚焦家庭：{activeEvent ? `${activeEvent.familyCase} / ${activeEvent.familyStatus}` : '未选择'}
        </div>
      </div>
    </ModuleCard>
  );
}