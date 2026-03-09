import ModuleCard from '../../components/ModuleCard';
import { getEventTimeline, getFilteredEvents, sceneMeta, timeWindowMeta } from '../../mock/consoleData';
import { useConsoleStore } from '../../store/consoleStore';

export default function RiskStream() {
  const events = useConsoleStore((state) => state.events);
  const activeEventId = useConsoleStore((state) => state.activeEventId);
  const setActiveEventId = useConsoleStore((state) => state.setActiveEventId);
  const sceneLevel = useConsoleStore((state) => state.sceneLevel);
  const timeWindow = useConsoleStore((state) => state.timeWindow);
  const visibleEvents = getFilteredEvents(events, timeWindow);
  const activeEvent = visibleEvents.find((item) => item.id === activeEventId) || visibleEvents[0];
  const timeline = getEventTimeline(activeEvent);

  return (
    <ModuleCard
      title="总风险流"
      subtitle={`右侧模块，承担事件列表、详情与处置入口。当前窗口：${timeWindowMeta[timeWindow].label}`}
      extra={<span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">{sceneMeta[sceneLevel].label}</span>}
    >
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
        <div className="grid min-h-0 gap-3 overflow-auto pr-1">
          {visibleEvents.map((event) => {
            const active = event.id === activeEventId;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => setActiveEventId(event.id, true)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-sky-400/30 bg-sky-500/10 shadow-glow'
                    : 'border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-console-text">{event.id}</strong>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-console-muted">{event.level}</span>
                </div>
                <p className="mt-3 text-sm text-console-text">{event.area} · {event.source}</p>
                <div className="mt-2 flex items-center justify-between text-sm text-console-muted">
                  <span>{event.amount}</span>
                  <span>{event.status}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-white/5 bg-console-panelSoft p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-console-text">当前详情</span>
            <span className="text-console-muted">{activeEvent?.id || '未选择'}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-console-muted">
            {activeEvent
              ? `${activeEvent.summary} 当前家庭状态为${activeEvent.familyStatus}，最新确认结果为${activeEvent.outreachStatus || '未记录'}，趋势为${activeEvent.trend}。`
              : '请选择一条风险事件查看详情。'}
          </p>
          {activeEvent ? (
            <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3 text-xs text-console-muted">
                  <span>家属侧确认</span>
                  <span>{activeEvent.outreachUpdatedAt || '暂无时间'}</span>
                </div>
                <p className="mt-2 text-sm text-console-text">{activeEvent.outreachStatus || '尚未补充确认结果'}</p>
                <p className="mt-2 text-xs text-console-muted">{activeEvent.outreachNote || '家属端暂未写入外呼备注。'}</p>
              </div>
              {timeline.map((item) => (
                <div key={`${activeEvent.id}-${item.label}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-console-muted">
                    <span>{item.label}</span>
                    <span>{item.minutesAgo} 分钟前</span>
                  </div>
                  <p className="mt-2 text-sm text-console-text">{item.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </ModuleCard>
  );
}