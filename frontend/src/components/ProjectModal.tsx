import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { parseSitemap } from '../api';

interface ProjectModalProps {
  project: Project | null;
  onSave: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

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
          .map(el => el.textContent?.trim())
          .filter((url): url is string => !!url);
        setUrls(prev => {
          const newUrls = extractedUrls.join('\n');
          return prev ? `${prev}\n${newUrls}` : newUrls;
        });
      } else {
        setUrls(prev => prev ? `${prev}\n${text}` : text);
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
      setUrls(prev => {
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
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', padding: 30, borderRadius: 8, minWidth: 500, maxHeight: '80vh', overflow: 'auto' }}>
        <h2>{project ? 'Редактировать проект' : 'Создать проект'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label>Название:</label><br />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>URL (по одному на строку или загрузить файл):</label><br />
            <textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={10} style={{ width: '100%', padding: 8 }} />
            <input type="file" onChange={handleFileUpload} accept=".txt,.csv,.xml" style={{ marginTop: 5 }} />
            <div style={{ marginTop: 10 }}>
              <label>Или введите URL sitemap.xml:</label><br />
              <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                <input
                  type="text"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={handleSitemapUrlLoad}
                  disabled={loadingSitemap || !sitemapUrl.trim()}
                >
                  {loadingSitemap ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Отслеживать:</label><br />
            <label><input type="checkbox" checked={trackTitle} onChange={(e) => setTrackTitle(e.target.checked)} /> Заголовок</label>
            <label style={{ marginLeft: 10 }}><input type="checkbox" checked={trackDesc} onChange={(e) => setTrackDesc(e.target.checked)} /> Описание</label>
            <label style={{ marginLeft: 10 }}><input type="checkbox" checked={trackContent} onChange={(e) => setTrackContent(e.target.checked)} /> Контент</label>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Интервал (минуты):</label><br />
            <input type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value))} min={1} style={{ padding: 8 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Максимум потоков:</label><br />
            <input type="number" value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} min={1} max={50} style={{ padding: 8 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">{project ? 'Обновить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
