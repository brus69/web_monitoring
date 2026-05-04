import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface ProjectModalProps {
  project: Project | null;
  onSave: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [urls, setUrls] = useState('');
  const [trackTitle, setTrackTitle] = useState(true);
  const [trackDesc, setTrackDesc] = useState(true);
  const [trackContent, setTrackContent] = useState(true);
  const [interval, setInterval] = useState(60);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setUrls(project.urls.join('\n'));
      setTrackTitle(project.track_title);
      setTrackDesc(project.track_desc);
      setTrackContent(project.track_content);
      setInterval(project.interval);
    }
  }, [project]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUrls(text);
    };
    reader.readAsText(file);
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
