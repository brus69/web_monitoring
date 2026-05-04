import React from 'react';

interface ScanProgressBarProps {
  totalUrls: number;
  savedInReport: number;
  active: boolean;
}

const ScanProgressBar: React.FC<ScanProgressBarProps> = ({ totalUrls, savedInReport, active }) => {
  const pct = totalUrls > 0 ? Math.min(100, Math.round((savedInReport / totalUrls) * 100)) : 0;

  return (
    <div className="mb-6 rounded-lg border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white px-4 py-4 sm:px-5" aria-live="polite">
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="text-sm font-medium text-brand-700">Обход проекта</span>
        <span className="text-xs text-ink-secondary sm:text-right">
          <span className={active ? 'text-brand-600' : ''}>{active ? 'идёт синхронизация…' : 'отчёт по последнему проходу'}</span>
          <span className="ml-2 text-ink-muted">
            {savedInReport} / {totalUrls} URL
          </span>
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-ink-secondary">
        Обход выполняется на сервере по интервалу проекта. Полоса с бегунком показывается при загрузке и автообновлении
        результатов.
      </p>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200/90">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        {active && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-gradient-to-r from-transparent via-white/55 to-transparent motion-reduce:static motion-reduce:w-2/5 motion-reduce:translate-x-[120%] motion-reduce:opacity-40 motion-reduce:animate-none animate-scan-runner"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
};

export default ScanProgressBar;
