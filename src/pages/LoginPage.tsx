import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { LoginBackground } from '../components/auth/LoginBackground';
import { LoginCard } from '../components/auth/LoginCard';
import { APP_NAME } from '../constants/app';

/**
 * Страница входа в систему.
 */
export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Анимированный фон */}
      <LoginBackground />

      {/* Контент */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12">
        {/* Брендинг */}
        <div className="mb-8 text-center animate-slide-in-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {APP_NAME}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Система управления задачами
          </p>
        </div>

        {/* Карточка с формой */}
        <LoginCard>
          <LoginForm />
        </LoginCard>

        {/* Футер */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </div>
  );
};
