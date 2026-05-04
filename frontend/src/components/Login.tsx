import React, { useState } from 'react';
import { login } from '../api';
import { LoginResponse } from '../types';

interface LoginProps {
  onLogin: (data: LoginResponse) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login({ username, password });
      onLogin(data);
    } catch {
      setError('Неверные учетные данные');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white shadow-card">
          W
        </div>
        <h1 className="text-2xl font-normal text-ink">Web Monitor</h1>
        <p className="mt-1 text-ink-secondary">Войдите в личный кабинет</p>
      </div>

      <div className="w-full max-w-[400px] rounded-lg border border-slate-200/80 bg-white p-8 shadow-card-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-secondary">
              Логин
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-ink shadow-sm outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
              placeholder="Введите логин"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-secondary">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-ink shadow-sm outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
              placeholder="Введите пароль"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded bg-brand-500 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Войти
          </button>
        </form>
      </div>
      <p className="mt-8 text-center text-xs text-ink-muted">Мониторинг изменений страниц</p>
    </div>
  );
};

export default Login;
