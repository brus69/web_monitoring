import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { parseSitemap } from '../api';

interface ProjectModalProps {
  project: Project | null;
  onSave: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const inputClass =
  'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-50';
const labelClass = 'text-xs font-medium uppercase tracking-wide text-ink-secondary';

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [urls, setUrls] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [loadingSitemap, setLoadingSitemap] = useState(false);
  const [trackTitle, setTrackTitle] = useState(true);
  const [trackDesc, setTrackDesc] = useState(true);
  const [trackContent, setTrackContent] = useState(true);
  const [interval, setInterval] = useState(60);
  const [concurrency, setConcurrency] = useState(10);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setUrls(project.urls.join('\n'));
      setTrackTitle(project.track_title);
      setTrackDesc(project.track_desc);
      setTrackContent(project.track_content);
      setInterval(project.interval);
      setConcurrency(project.concurrency || 10);
    }
  }, [project]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (file.name.endsWith('.xml') || text.includes('<urlset')) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const locElements = xmlDoc.getElementsByTagName('loc');
        const extractedUrls = Array.from(locElements)
          .map((el) => el.textContent?.trim())
          .filter((url): url is string => !!url);
        setUrls((prev) => {
          const newUrls = extractedUrls.join('\n');
          return prev ? `${prev}\n${newUrls}` : newUrls;
        });
      } else {
        setUrls((prev) => (prev ? `${prev}\n${text}` : text));
      }
    };
    reader.readAsText(file);
  };

  const handleSitemapUrlLoad = async () => {
    if (!sitemapUrl.trim()) return;

    setLoadingSitemap(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const extractedUrls = await parseSitemap(token, sitemapUrl.trim());
      setUrls((prev) => {
        const newUrls = extractedUrls.join('\n');
        return prev ? `${prev}\n${newUrls}` : newUrls;
      });
      setSitemapUrl('');
    } catch (err) {
      alert('Ошибка загрузки sitemap: ' + (err as Error).message);
    } finally {
      setLoadingSitemap(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);
    onSave({
      name,
      urls: urlList,
      track_title: trackTitle,
      track_desc: trackDesc,
      track_content: trackContent,
      interval,
      concurrency,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200/80 bg-white shadow-card-lg sm:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-medium text-ink">
            {project ? 'Редактировать проект' : 'Создать проект'}
          </h2>
          <p className="mt-0.5 text-sm text-ink-secondary">Заполните поля и сохраните</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="proj-name" className={labelClass}>
              Название
            </label>
            <input id="proj-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>

          <div>
            <label htmlFor="proj-urls" className={labelClass}>
              URL (по одному на строку или файл)
            </label>
            <textarea
              id="proj-urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={8}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.csv,.xml"
              className="mt-2 block w-full text-xs text-ink-secondary file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <label htmlFor="proj-sitemap" className={labelClass}>
                Или URL sitemap.xml
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="proj-sitemap"
                  type="text"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  className={`${inputClass} sm:mt-0 sm:flex-1`}
                />
                <button
                  type="button"
                  onClick={handleSitemapUrlLoad}
                  disabled={loadingSitemap || !sitemapUrl.trim()}
                  className="shrink-0 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingSitemap ? 'Загрузка…' : 'Загрузить'}
                </button>
              </div>
            </div>
          </div>

          <fieldset className="rounded-lg border border-slate-100 bg-[#fafbfc] p-4">
            <legend className={`${labelClass} px-1`}>Отслеживать</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={trackTitle} onChange={(e) => setTrackTitle(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Заголовок
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={trackDesc} onChange={(e) => setTrackDesc(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Описание
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={trackContent} onChange={(e) => setTrackContent(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Контент
              </label>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-interval" className={labelClass}>
                Интервал (мин.)
              </label>
              <input
                id="proj-interval"
                type="number"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                min={1}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-concurrency" className={labelClass}>
                Потоков (макс.)
              </label>
              <input
                id="proj-concurrency"
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                min={1}
                max={50}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-slate-50 sm:min-w-[100px]"
            >
              Отмена
            </button>
            <button type="submit" className="rounded bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 sm:min-w-[100px]">
              {project ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
