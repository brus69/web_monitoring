import React, { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject, getResults } from '../api';
import { Project, PageState } from '../types';
import ProjectModal from './ProjectModal';
import ResultsTable from './ResultsTable';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [results, setResults] = useState<PageState[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects(token);
      setProjects(data);
    } catch (err) {
      console.error('Не удалось загрузить проекты', err);
    }
  };

  const handleCreateProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createProject(token, project);
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Не удалось создать проект', err);
    }
  };

  const handleUpdateProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingProject) return;
    try {
      await updateProject(token, editingProject.id, project);
      setEditingProject(null);
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Не удалось обновить проект', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Удалить этот проект?')) return;
    try {
      await deleteProject(token, id);
      loadProjects();
    } catch (err) {
      console.error('Не удалось удалить проект', err);
    }
  };

  const handleViewResults = async (project: Project) => {
    try {
      const data = await getResults(token, project.id);
      setResults(data.pages);
      setSelectedProject(project);
    } catch (err) {
      console.error('Не удалось загрузить результаты', err);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>Web Monitor - Личный кабинет</h1>
        <div>
          <button onClick={() => { setEditingProject(null); setShowModal(true); }} style={{ marginRight: 10 }}>
            Создать проект
          </button>
          <button onClick={onLogout}>Выйти</button>
        </div>
      </div>

      <div>
        {projects.map((project) => (
          <div key={project.id} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 10, borderRadius: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{project.name}</h3>
                <p>URL: {project.urls.length} | Интервал: {project.interval} мин</p>
              </div>
              <div>
                <button onClick={() => handleViewResults(project)} style={{ marginRight: 5 }}>Результаты</button>
                <button onClick={() => { setEditingProject(project); setShowModal(true); }} style={{ marginRight: 5 }}>Изменить</button>
                <button onClick={() => handleDeleteProject(project.id)}>Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ProjectModal
          project={editingProject}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
        />
      )}

      {selectedProject && (
        <div style={{ marginTop: 30 }}>
          <h2>Результаты для {selectedProject.name}</h2>
          <button onClick={() => setSelectedProject(null)} style={{ marginBottom: 10 }}>Закрыть</button>
          <ResultsTable pages={results} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
