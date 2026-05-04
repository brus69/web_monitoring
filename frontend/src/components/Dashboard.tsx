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
      console.error('Failed to load projects', err);
    }
  };

  const handleCreateProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createProject(token, project);
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Failed to create project', err);
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
      console.error('Failed to update project', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteProject(token, id);
      loadProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleViewResults = async (project: Project) => {
    try {
      const data = await getResults(token, project.id);
      setResults(data.pages);
      setSelectedProject(project);
    } catch (err) {
      console.error('Failed to load results', err);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>Web Monitor - Dashboard</h1>
        <div>
          <button onClick={() => { setEditingProject(null); setShowModal(true); }} style={{ marginRight: 10 }}>
            Create Project
          </button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div>
        {projects.map((project) => (
          <div key={project.id} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 10, borderRadius: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{project.name}</h3>
                <p>URLs: {project.urls.length} | Interval: {project.interval} min</p>
              </div>
              <div>
                <button onClick={() => handleViewResults(project)} style={{ marginRight: 5 }}>View Results</button>
                <button onClick={() => { setEditingProject(project); setShowModal(true); }} style={{ marginRight: 5 }}>Edit</button>
                <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
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
          <h2>Results for {selectedProject.name}</h2>
          <button onClick={() => setSelectedProject(null)} style={{ marginBottom: 10 }}>Close</button>
          <ResultsTable pages={results} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
