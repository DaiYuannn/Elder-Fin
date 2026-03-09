import clsx from 'clsx';

export default function ModuleCard({ title, subtitle, extra, className, children }) {
  return (
    <section
      className={clsx(
        'module-shell flex h-full min-h-0 flex-col rounded-[24px] border border-console-border bg-[linear-gradient(180deg,rgba(8,24,44,0.98),rgba(5,17,32,0.96))] p-4 shadow-panel backdrop-blur',
        className
      )}
    >
      <header className="module-drag-handle mb-4 flex flex-none items-start justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <h2 className="m-0 font-display text-lg font-semibold text-console-text">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-console-muted">{subtitle}</p> : null}
        </div>
        {extra}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}