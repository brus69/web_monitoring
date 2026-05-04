import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PageState } from '../types';
import {
  aggregateChangesByGranularity,
  type ChangesGranularity,
} from '../utils/aggregateChanges';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChangesChartProps {
  pages: PageState[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

const granularityLabels: Record<ChangesGranularity, string> = {
  year: 'Год',
  month: 'Месяц',
  day: 'День',
  '5h': '5 часов',
};

const ChangesChart: React.FC<ChangesChartProps> = ({ pages, loading, title, subtitle }) => {
  const [granularity, setGranularity] = useState<ChangesGranularity>('month');

  const series = useMemo(() => aggregateChangesByGranularity(pages, granularity), [pages, granularity]);

  const chartData = useMemo(
    () => ({
      labels: series.labels,
      datasets: [
        {
          label: 'Изменений',
          data: series.counts,
          backgroundColor: 'rgba(26, 115, 232, 0.72)',
          borderColor: 'rgba(21, 87, 176, 1)',
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 56,
        },
      ],
    }),
    [series],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const n = ctx.parsed.y ?? 0;
              return ` Изменений: ${n}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 24,
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: { size: 11 },
          },
          title: {
            display: true,
            text: 'Количество изменений',
            font: { size: 12 },
          },
        },
      },
    }),
    [],
  );

  return (
    <section
      className="mb-10 w-full min-w-0 rounded-lg border border-slate-200/90 bg-white p-5 shadow-card sm:p-6"
      aria-labelledby="changes-chart-heading"
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="changes-chart-heading" className="text-base font-medium text-ink">
            {title || 'Динамика изменений'}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>}
          <p className="mt-2 text-xs text-ink-muted">
            Всего событий в данных: <span className="font-medium text-ink-secondary">{series.totalChanges}</span>
            {loading ? ' · обновление…' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Шаг группировки по времени">
          {(Object.keys(granularityLabels) as ChangesGranularity[]).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={granularity === g}
              onClick={() => setGranularity(g)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                granularity === g
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-300 bg-white text-ink-secondary hover:bg-slate-50'
              }`}
            >
              {granularityLabels[g]}
            </button>
          ))}
        </div>
      </div>

      {series.totalChanges === 0 && !loading ? (
        <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-sm text-ink-secondary">
          Нет данных об изменениях — они появятся после фиксации отличий при мониторинге.
        </div>
      ) : (
        <div className="relative h-[min(42vh,420px)] w-full min-h-[280px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </section>
  );
};

export default ChangesChart;
