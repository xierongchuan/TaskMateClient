import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMyCurrentShift } from '../../hooks/useShifts';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useSidebarStore } from '../../stores/sidebarStore';
import { Sidebar } from './Sidebar/';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { formatTime } from '../../utils/dateTime';
import { ClockIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { APP_NAME } from '../../constants/app';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const { dealershipId } = useWorkspace();
  const navigate = useNavigate();
  const { isOpen: sidebarOpen, mode, toggleSidebar } = useSidebarStore();
  const { data: currentShiftData } = useMyCurrentShift(dealershipId ?? undefined);
  const currentShift = currentShiftData?.data;

  // Отслеживаем размер экрана для корректного отображения логотипа
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Показывать логотип в хедере:
  // - На мобильных когда сайдбар закрыт
  // - На десктопе когда сайдбар в mini-mode
  const showLogoInHeader = (isMobile && !sidebarOpen) || (!isMobile && mode === 'mini');

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden transition-colors duration-200 print:h-auto print:overflow-visible">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 print:h-auto print:overflow-visible">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 lg:px-6 z-10 transition-colors duration-200 print:hidden">
          {/* Left side: mobile menu + logo + workspace */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Bars3 только на мобильных */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 shrink-0"
              title={sidebarOpen ? 'Скрыть меню' : 'Показать меню'}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Логотип: мобильные (когда закрыт) ИЛИ десктоп (mini-mode) */}
            {showLogoInHeader && (
              <Link to="/" className="text-lg font-bold text-accent-600 dark:text-accent-400 shrink-0 hidden sm:block">
                {APP_NAME}
              </Link>
            )}

            {/* Разделитель */}
            {showLogoInHeader && (
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 shrink-0 hidden sm:block" />
            )}

            {/* Переключатель автосалона — всегда видим */}
            <WorkspaceSwitcher />
          </div>

          {/* Right side: shift info + user */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {currentShift && (
              <button
                onClick={() => navigate('/shifts')}
                className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                title="Перейти к управлению сменой"
              >
                <span className="relative flex h-2 w-2 sm:hidden flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <ClockIcon className="w-4 h-4 text-green-600 dark:text-green-400 hidden sm:block" />
                <div className="text-xs text-green-800 dark:text-green-300">
                  <div className="font-medium hidden sm:block">Смена открыта</div>
                  <div className="text-green-600 dark:text-green-400">
                    с {formatTime(currentShift.shift_start)}
                  </div>
                </div>
              </button>
            )}

            <Link to="/profile" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                  {user?.full_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {user?.role}
                </span>
              </div>
            </Link>

            {/* Logout button moved to Profile page */}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200 print:h-auto print:overflow-visible">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
