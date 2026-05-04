import { Project, LoginRequest, LoginResponse, State } from './types';

const API_URL = 'http://localhost:8080/api';

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) throw new Error('Invalid credentials');
  return response.json();
};

export const getProjects = async (token: string): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
};

export const createProject = async (token: string, project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
};

export const updateProject = async (token: string, id: string, project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
};

export const deleteProject = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to delete project');
};

export const getResults = async (token: string, projectId: string): Promise<State> => {
  const response = await fetch(`${API_URL}/projects/${projectId}/results`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
};

export const parseSitemap = async (token: string, sitemapURL: string): Promise<string[]> => {
  const response = await fetch(`${API_URL}/parse-sitemap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: sitemapURL }),
  });

  if (!response.ok) throw new Error('Failed to parse sitemap');
  const data = await response.json();
  return data.urls;
};
