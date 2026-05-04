import React, { useState, Fragment } from 'react';
import { PageState, ChangeRecord } from '../types';

interface ResultsTableProps {
  pages: PageState[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ pages }) => {
  const [page, setPage] = useState(1);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const perPage = 100;
  const totalPages = Math.ceil(pages.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, pages.length);
  const currentPages = pages.slice(start, end);

  const toggleExpand = (url: string) => {
    setExpandedUrl(expandedUrl === url ? null : url);
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'title':
        return 'Заголовок[title]';
      case 'description':
        return 'Описание[Description]';
      case 'h1':
        return 'Заголовок [h1]';
      case 'text':
        return 'Контент';
      default:
        return field;
    }
  };

  const fieldPillClass = (field: string) => {
    switch (field) {
      case 'title':
        return 'bg-blue-50 text-blue-800 ring-blue-100';
      case 'description':
        return 'bg-amber-50 text-amber-900 ring-amber-100';
      case 'h1':
        return 'bg-cyan-50 text-cyan-900 ring-cyan-100';
      case 'text':
        return 'bg-violet-50 text-violet-900 ring-violet-100';
      default:
        return 'bg-slate-100 text-ink ring-slate-200';
    }
  };

  const statusClass = (status: string) => {
    if (status === 'изменена') return 'text-red-700 bg-red-50 ring-red-100';
    if (status === 'новая') return 'text-green-800 bg-green-50 ring-green-100';
    return 'text-ink-secondary bg-slate-100 ring-slate-200';
  };

  const formatChecked = (raw: string | undefined) => {
    if (!raw) return '—';
    const s = String(raw);
    if (s.includes('T') && s.length >= 10) {
      try {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
        }
      } catch {
        /* fallthrough */
      }
    }
    return s;
  };

  const formatHttpCode = (code: number | undefined) => {
    if (code === undefined || code === null || code === 0) return '—';
    return String(code);
  };

  return (
    <div className="min-w-0 rounded-lg border border-slate-200/90 bg-white shadow-sm">
      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className="w-max min-w-full table-auto border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">
                Код ответа
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">URL</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">Статус</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">Заголовок[title]</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">Описание[Description]</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">Заголовок [h1]</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary">Проверка</th>
              <th
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-secondary"
                title="Число записей в истории изменений по странице"
              >
                Кол-во изменений
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPages.map((p) => (
              <Fragment key={p.url}>
                <tr
                  onClick={() => (p.changes && p.changes.length > 0 ? toggleExpand(p.url) : null)}
                  className={`bg-white transition ${p.changes && p.changes.length > 0 ? 'cursor-pointer hover:bg-slate-50/80' : ''}`}
                >
                  <td className="min-w-[4.5rem] whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums text-ink-secondary" title="HTTP status">
                    {formatHttpCode(p.status_code)}
                  </td>
                  <td className="min-w-[16rem] max-w-[min(40vw,36rem)] break-all px-4 py-3 align-top font-mono text-xs leading-snug text-brand-700" title={p.url}>
                    {p.url}
                  </td>
                  <td className="min-w-[7.5rem] whitespace-nowrap px-4 py-3 align-top">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="min-w-[12rem] max-w-[min(28vw,28rem)] break-words px-4 py-3 align-top text-ink" title={p.title}>
                    {p.title || '—'}
                  </td>
                  <td className="min-w-[12rem] max-w-[min(28vw,28rem)] break-words px-4 py-3 align-top text-ink" title={p.description}>
                    {p.description || '—'}
                  </td>
                  <td className="min-w-[10rem] max-w-[min(24vw,24rem)] break-words px-4 py-3 align-top text-ink" title={p.h1}>
                    {p.h1 || '—'}
                  </td>
                  <td className="min-w-[9rem] whitespace-nowrap px-4 py-3 align-top text-ink-secondary">{formatChecked(p.last_checked)}</td>
                  <td className="min-w-[7.5rem] whitespace-nowrap px-4 py-3 text-center align-top tabular-nums font-medium text-ink-secondary">
                    {p.changes ? p.changes.length : 0}
                  </td>
                </tr>
                {expandedUrl === p.url && p.changes && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={8} className="border-t border-slate-100 px-4 py-4">
                      <h4 className="mb-3 text-sm font-medium text-ink">История изменений</h4>
                      <div className="space-y-3">
                        {p.changes.map((change: ChangeRecord, idx: number) => (
                          <div key={idx} className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${fieldPillClass(change.field)}`}
                              >
                                {getFieldLabel(change.field)}
                              </span>
                              <span className="text-xs text-ink-muted">{String(change.timestamp)}</span>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div>
                                <span className="text-ink-muted">Было: </span>
                                <span className="text-ink">
                                  {change.old_value && change.old_value.length > 120 ? `${change.old_value.substring(0, 120)}…` : change.old_value}
                                </span>
                              </div>
                              <div>
                                <span className="text-ink-muted">Стало: </span>
                                <span className="text-ink">
                                  {change.new_value && change.new_value.length > 120 ? `${change.new_value.substring(0, 120)}…` : change.new_value}
                                </span>
                              </div>
                              <div className="diff-content text-ink [&_*]:text-inherit">
                                <span className="text-ink-muted">Дифф: </span>
                                <span dangerouslySetInnerHTML={{ __html: change.diff }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          <span className="text-sm text-ink-secondary">
            Страница {page} из {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Вперёд
          </button>
        </div>
      )}

      {pages.length === 0 && (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink-secondary">Результатов пока нет</p>
          <p className="mt-1 text-xs text-ink-muted">Мониторинг выполняется — данные появятся после первого прохода</p>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
