import { Responsive, WidthProvider } from 'react-grid-layout';

import ModuleCard from '../components/ModuleCard';
import FamilyFlow from '../modules/family-flow/FamilyFlow';
import MapStage from '../modules/map-stage/MapStage';
import OverallInfo from '../modules/overall-info/OverallInfo';
import RiskStream from '../modules/risk-stream/RiskStream';
import { useConsoleStore } from '../store/consoleStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

const modules = {
  'overall-info': <OverallInfo />,
  'family-flow': <FamilyFlow />,
  'map-stage': <MapStage />,
  'risk-stream': <RiskStream />
};

export default function ConsoleLayout() {
  const layouts = useConsoleStore((state) => state.layouts);
  const setLayouts = useConsoleStore((state) => state.setLayouts);

  return (
    <div className="min-h-screen px-6 pb-6 pt-5 text-console-text">
      <header className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-sky-400/15 bg-sky-500/10 px-4 py-1 text-xs tracking-[0.16em] text-sky-100">
            Elder-Fin Biz Console
          </p>
          <h1 className="m-0 text-4xl font-semibold tracking-tight">联合干预中枢全局作战画面</h1>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/15 px-5 py-4 text-right backdrop-blur">
          <div className="text-xs uppercase tracking-[0.2em] text-console-muted">当前场景</div>
          <strong className="mt-2 block text-xl text-white">联合干预</strong>
        </div>
      </header>

      <ResponsiveGridLayout
        className="grid-layout"
        layouts={layouts}
        breakpoints={{ lg: 1600, md: 1200, sm: 996, xs: 768, xxs: 0 }}
        cols={{ lg: 16, md: 12, sm: 8, xs: 4, xxs: 2 }}
        rowHeight={44}
        margin={[16, 16]}
        draggableHandle=".module-drag-handle"
        onLayoutChange={(currentLayout, allLayouts) => setLayouts(allLayouts)}
      >
        {Object.entries(modules).map(([key, content]) => (
          <div key={key}>{content}</div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}