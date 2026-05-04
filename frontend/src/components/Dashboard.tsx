import React, { useState, useEffect, useMemo } from 'react';
import { getProjects, createProject, updateProject, deleteProject, getResults, startProject, stopProject } from '../api';
import { Project, PageState } from '../types';
import ProjectModal from './ProjectModal';
import ResultsTable from './ResultsTable';
import ScanProgressBar from './ScanProgressBar';
import ChangesChart from './ChangesChart';

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
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsRefreshing, setResultsRefreshing] = useState(false);
  const [switchingProjectId, setSwitchingProjectId] = useState<string | null>(null);

  const [chartProjectId, setChartProjectId] = useState<string>('');
  const [chartPages, setChartPages] = useState<PageState[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

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

  useEffect(() => {
    if (projects.length === 0) return;
    // Если проект для графика не выбран — выбрать первый.
    setChartProjectId((prev) => prev || projects[0].id);
  }, [projects]);

  const chartProject = useMemo(
    () => projects.find((p) => p.id === chartProjectId) || null,
    [projects, chartProjectId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !chartProjectId) {
        if (!cancelled) {
          setChartPages([]);
          setChartLoading(false);
        }
        return;
      }
      setChartLoading(true);
      try {
        const data = await getResults(token, chartProjectId);
        if (!cancelled) setChartPages(data.pages);
      } catch (err) {
        console.error('Не удалось загрузить данные для графика', err);
        if (!cancelled) setChartPages([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, chartProjectId]);

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

  const handleToggleProject = async (project: Project) => {
    try {
      setSwitchingProjectId(project.id);
      if (project.paused) {
        await startProject(token, project.id);
      } else {
        await stopProject(token, project.id);
      }
      await loadProjects();
    } catch (err) {
      console.error('Не удалось изменить состояние проекта', err);
    } finally {
      setSwitchingProjectId(null);
    }
  };

  const handleViewResults = async (project: Project) => {
    setSelectedProject(project);
    setResults([]);
    setResultsLoading(true);
    try {
      const data = await getResults(token, project.id);
      setResults(data.pages);
    } catch (err) {
      console.error('Не удалось загрузить результаты', err);
    } finally {
      setResultsLoading(false);
    }
  };

  const selectedProjectId = selectedProject?.id;

  useEffect(() => {
    if (!selectedProjectId || !token) return;

    const refresh = async () => {
      setResultsRefreshing(true);
      try {
        const data = await getResults(token, selectedProjectId);
        setResults(data.pages);
      } catch (err) {
        console.error('Не удалось обновить результаты', err);
      } finally {
        setResultsRefreshing(false);
      }
    };

    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [selectedProjectId, token]);

  const savedInReport = useMemo(() => {
    if (!selectedProject) return 0;
    const set = new Set(selectedProject.urls);
    return results.filter((p) => set.has(p.url)).length;
  }, [selectedProject, results]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16">
      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-none items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-card">
              W
            </div>
            <div>
              <h1 className="text-lg font-medium leading-tight text-ink sm:text-xl">Личный кабинет</h1>
              <p className="hidden text-xs text-ink-secondary sm:block">Web Monitor — проекты и отчёты</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setShowModal(true);
              }}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:px-4"
            >
              Создать проект
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:px-4"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-none min-w-0 px-4 py-8 sm:px-6 lg:px-10">
        {projects.length > 0 && (
          <section
            className="mb-10 w-full min-w-0 rounded-lg border border-slate-200/90 bg-white p-5 shadow-card sm:p-6"
            aria-labelledby="changes-dashboard-heading"
          >
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h2 id="changes-dashboard-heading" className="text-base font-medium text-ink">
                  Динамика изменений по проекту
                </h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Выберите проект — график строится по истории изменений страниц этого проекта.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="chart-project" className="text-xs font-medium uppercase tracking-wide text-ink-secondary">
                  Проект
                </label>
                <select
                  id="chart-project"
                  value={chartProjectId}
                  onChange={(e) => setChartProjectId(e.target.value)}
                  className="min-w-[220px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ChangesChart
              pages={chartPages}
              loading={chartLoading}
              title={chartProject ? `Динамика изменений: ${chartProject.name}` : 'Динамика изменений'}
              subtitle="Сумма записей истории изменений по страницам выбранного проекта. Выберите шаг группировки по времени."
            />
          </section>
        )}

        <section aria-labelledby="projects-heading">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="projects-heading" className="text-base font-medium text-ink">
                Проекты
              </h2>
              <p className="text-sm text-ink-secondary">Управление мониторингом и расписанием обхода</p>
            </div>
            <span className="text-xs text-ink-muted">{projects.length} активных</span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 py-16 text-center shadow-card">
              <p className="text-ink-secondary">Пока нет проектов</p>
              <p className="mt-1 text-sm text-ink-muted">Создайте первый проект, чтобы начать мониторинг</p>
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
                className="mt-6 inline-flex rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
              >
                Создать проект
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-card transition hover:border-slate-300 hover:shadow-card-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-medium text-ink">{project.name}</h3>
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-secondary">
                        <span>
                          <span className="text-ink-muted">URL:</span> {project.urls.length}
                        </span>
                        <span>
                          <span className="text-ink-muted">Интервал:</span> {project.interval} мин
                        </span>
                        <span>
                          <span className="text-ink-muted">Потоков:</span> {project.concurrency || 10}
                        </span>
                        <span>
                          <span className="text-ink-muted">Статус:</span>{' '}
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              project.paused ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {project.paused ? 'остановлен' : 'запущен'}
                          </span>
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleProject(project)}
                        disabled={switchingProjectId === project.id}
                        className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                          project.paused
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {switchingProjectId === project.id
                          ? 'Обновление...'
                          : project.paused
                            ? 'Запустить'
                            : 'Остановить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewResults(project)}
                        className="rounded border border-brand-500/40 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                      >
                        Результаты
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setShowModal(true);
                        }}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-secondary transition hover:bg-slate-50"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="rounded border border-transparent px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedProject && (
          <section className="mt-10 w-full min-w-0 rounded-lg border border-slate-200/90 bg-white p-5 shadow-card sm:p-6" aria-labelledby="results-heading">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 id="results-heading" className="text-lg font-medium text-ink">
                  Результаты: {selectedProject.name}
                </h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {selectedProject.urls.length} URL · интервал {selectedProject.interval} мин · потоков{' '}
                  {selectedProject.concurrency || 10}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="self-start rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-secondary transition hover:bg-slate-50"
              >
                Закрыть
              </button>
            </div>

            <div className="min-w-0 pt-5">
              <ScanProgressBar
                totalUrls={selectedProject.urls.length}
                savedInReport={savedInReport}
                active={resultsLoading || resultsRefreshing}
              />
              <ResultsTable pages={results} />
            </div>
          </section>
        )}
      </main>

      {showModal && (
        <ProjectModal
          project={editingProject}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
