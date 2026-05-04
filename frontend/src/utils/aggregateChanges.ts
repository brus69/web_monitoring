import { PageState } from '../types';

export type ChangesGranularity = 'year' | 'month' | 'day' | '5h';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Разбор времени из API (RFC3339 / ISO или строка от сервера). */
export function parseChangeTimestamp(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = Date.parse(raw);
  if (Number.isNaN(fallback)) return null;
  return new Date(fallback);
}

/** Ключ для сортировки + последующего форматирования подписи. */
export function bucketSortKey(d: Date, g: ChangesGranularity): string {
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  switch (g) {
    case 'year':
      return `${y}`;
    case 'month':
      return `${y}-${pad2(mo)}`;
    case 'day':
      return `${y}-${pad2(mo)}-${pad2(day)}`;
    case '5h': {
      const h0 = Math.floor(h / 5) * 5;
      return `${y}-${pad2(mo)}-${pad2(day)}T${pad2(h0)}`;
    }
    default:
      return `${y}-${pad2(mo)}-${pad2(day)}`;
  }
}

export function formatBucketLabel(sortKey: string, g: ChangesGranularity): string {
  switch (g) {
    case 'year':
      return sortKey;
    case 'month': {
      const [y, m] = sortKey.split('-');
      const dt = new Date(Number(y), Number(m) - 1, 1);
      return dt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
    }
    case 'day': {
      const [y, m, d] = sortKey.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
    case '5h': {
      const [datePart, hPart] = sortKey.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const h0 = Number(hPart);
      const dt = new Date(y, m - 1, d);
      const dayStr = dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const h1 = h0 + 5;
      return `${dayStr}, ${pad2(h0)}:00–${pad2(h1)}:00`;
    }
    default:
      return sortKey;
  }
}

/** Собирает все записи изменений со страниц проекта(ов). */
export function collectChangeRecords(pages: PageState[]): { at: Date }[] {
  const out: { at: Date }[] = [];
  for (const page of pages) {
    for (const ch of page.changes || []) {
      const at = parseChangeTimestamp(ch.timestamp);
      if (at) out.push({ at });
    }
  }
  return out;
}

export interface AggregatedSeries {
  sortKeys: string[];
  labels: string[];
  counts: number[];
  totalChanges: number;
}

export function aggregateChangesByGranularity(pages: PageState[], g: ChangesGranularity): AggregatedSeries {
  const map = new Map<string, number>();
  let total = 0;
  for (const { at } of collectChangeRecords(pages)) {
    const key = bucketSortKey(at, g);
    map.set(key, (map.get(key) || 0) + 1);
    total += 1;
  }
  const sortKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  const labels = sortKeys.map((k) => formatBucketLabel(k, g));
  const counts = sortKeys.map((k) => map.get(k) || 0);
  return { sortKeys, labels, counts, totalChanges: total };
}
