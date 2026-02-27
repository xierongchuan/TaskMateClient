import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * Форма входа в систему.
 */
export const LoginForm: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { login: loginAction, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await loginAction(login, password);
      navigate('/dashboard');
    } catch {
      // Ошибка уже обработана в store
    }
  };

  // Glass-эффект для страницы логина
  const glassInputClassName = 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="login"
        name="login"
        type="text"
        required
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="Логин"
        maxLength={64}
        disabled={isLoading}
        icon={<UserIcon />}
        inputSize="lg"
        className={glassInputClassName}
      />

      <Input
        id="password"
        name="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        disabled={isLoading}
        icon={<LockClosedIcon />}
        inputSize="lg"
        className={glassInputClassName}
      />

      {/* Ошибка */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3 animate-slide-in-up">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        </div>
      )}

      {/* Кнопка входа */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        className="login-button rounded-xl py-3"
      >
        {isLoading ? 'Выполняется вход...' : 'Войти'}
      </Button>
    </form>
  );
};
