import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../api/dashboard';
import { formatTime, formatDateTime, formatCurrentTime } from '../utils/dateTime';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  LinkIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { usePermissions } from '../hooks/usePermissions';
import { useWorkspace } from '../hooks/useWorkspace';

import type { Task } from '../types/task';

import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';

// Унифицированные компоненты
import {
  Button,
  Badge,
  Skeleton,
  ErrorState,
  EmptyState,
  PageContainer,
  Card,
  Section,
  PageHeader,
} from '../components/ui';
import { StatusBadge } from '../components/common';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions();
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const navigate = useNavigate();

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', workspaceDealershipId],
    queryFn: () => dashboardApi.getData(workspaceDealershipId ?? undefined),
    refetchInterval: 15000,
  });

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };


  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton variant="text" width="25%" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" count={8} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Ошибка загрузки данных"
          description="Не удалось загрузить данные панели управления"
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  // Вычисляем класс сетки в зависимости от количества карточек
  const getGridColsClass = (count: number) => {
    switch (count) {
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-2 lg:grid-cols-4';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
      default:
        return 'grid-cols-2 lg:grid-cols-4';
    }
  };

  const stats = [
    {
      name: 'Активные смены',
      value: dashboardData?.open_shifts || 0,
      icon: <UserIcon className="w-6 h-6" />,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      description: 'Сейчас на смене',
      link: '/shifts?status=open',
      visible: true,
    },
    {
      name: 'На проверке',
      value: dashboardData?.pending_review_count || 0,
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      description: 'Ожидают верификации',
      link: '/tasks?status=pending_review',
      visible: permissions.canManageTasks,
    },
    {
      name: 'Просроченные задачи',
      value: dashboardData?.overdue_tasks || 0,
      icon: <XCircleIcon className="w-6 h-6" />,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      description: 'Требуют внимания',
      link: '/tasks?status=overdue',
      visible: true,
    },
    {
      name: 'Выполнено сегодня',
      value: dashboardData?.completed_tasks || 0,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      description: 'Успешно завершено',
      link: '/tasks?status=completed&date_range=today',
      visible: true,
    },
  ].filter(stat => stat.visible);

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Панель управления"
        description={
          <span>
            Добро пожаловать, {user?.full_name}! • Роль: <span className="font-medium">{user?.role}</span>
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Badge variant="success" className="animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live обновления
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formatCurrentTime()}
          </span>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className={`grid ${getGridColsClass(stats.length)} gap-4 sm:gap-6 mb-8`}>
        {stats.map((stat) => (
          <Card
            key={stat.name}
            hover
            className="cursor-pointer"
          >
            <div onClick={() => navigate(stat.link)} className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.name}</p>
                  <p className={`text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 ${stat.textColor} dark:text-white`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">{stat.description}</p>
                </div>
                <div className={`${stat.color} rounded-xl p-2 sm:p-3 text-white flex-shrink-0`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Tablo - Active Shifts grouped by dealership */}
        <Section
          title="Live-табло: активные смены"
          icon={<UserIcon />}
          subtitle="Обновляется автоматически"
          className="xl:col-span-2"
        >
          {dashboardData?.dealership_shift_stats && dashboardData.dealership_shift_stats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.dealership_shift_stats.map((ds) => {
                const shiftsForDealership = (dashboardData.active_shifts || []).filter(
                  (s) => s.dealership?.id === ds.dealership_id
                );
                const ratio = ds.total_employees > 0 ? ds.on_shift_count / ds.total_employees : 0;
                const circumference = 2 * Math.PI * 18;
                const filled = circumference * ratio;
                const empty = circumference - filled;

                return (
                  <div
                    key={ds.dealership_id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4"
                  >
                    {/* Заголовок автосалона + donut */}
                    <div className="flex items-center gap-3 mb-3">
                      <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-600" strokeWidth="5" />
                        {ds.total_employees > 0 && (
                          <circle
                            cx="24" cy="24" r="18" fill="none"
                            stroke="currentColor"
                            className={ds.on_shift_count > 0 ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}
                            strokeWidth="5"
                            strokeDasharray={`${filled} ${empty}`}
                            strokeDashoffset={circumference / 4}
                            strokeLinecap="round"
                            transform="rotate(-90 24 24)"
                          />
                        )}
                        <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 dark:fill-white" fontSize="11" fontWeight="600">
                          {ds.on_shift_count}/{ds.total_employees}
                        </text>
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{ds.dealership_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ds.on_shift_count} из {ds.total_employees} сотрудников на смене
                        </p>
                      </div>
                    </div>

                    {/* Список сотрудников на смене */}
                    {shiftsForDealership.length > 0 ? (
                      <div className={`space-y-2 ${shiftsForDealership.length > 3 ? 'max-h-[156px] overflow-y-auto pr-1' : ''}`}>
                        {shiftsForDealership.map((shift) => (
                          <div key={shift.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{shift.user?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(shift.opened_at)}</span>
                              {shift.is_late && (
                                <Badge variant="danger" size="sm">
                                  +{shift.late_minutes} мин
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                        {ds.is_today_holiday ? (
                          <p>Сегодня выходной</p>
                        ) : (
                          <>
                            <p>Нет сотрудников на смене</p>
                            {ds.shift_schedules && ds.shift_schedules.length > 0 && (
                              <p className="mt-1">
                                <ClockIcon className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                                {ds.shift_schedules.map((s, i) => (
                                  <span key={s.id}>{i > 0 ? ' / ' : ''}{s.name}: {s.start_time?.substring(0, 5)}-{s.end_time?.substring(0, 5)}</span>
                                ))}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<UserIcon />}
              title="Нет активных смен"
              description="Смены ещё не открыты"
            />
          )}
        </Section>

        {/* Quick Actions */}
        <Section title="Быстрые действия" icon={<ChartBarIcon />}>
          <div className="space-y-3">
            {/* Действия для менеджеров/владельцев */}
            {permissions.canManageTasks && (
              <>
                <Button
                  variant="primary"
                  icon={<CalendarIcon />}
                  onClick={() => navigate('/tasks?action=create')}
                  fullWidth
                >
                  Создать задачу
                </Button>
                <Button
                  variant="secondary"
                  icon={<ChartBarIcon />}
                  onClick={() => navigate('/reports')}
                  fullWidth
                >
                  Отчеты
                </Button>
              </>
            )}

            {/* Действия для сотрудников */}
            {permissions.isEmployee && (
              <>
                <Button
                  variant="primary"
                  icon={<ClipboardDocumentCheckIcon />}
                  onClick={() => navigate('/tasks')}
                  fullWidth
                >
                  Мои задачи
                </Button>
                <Button
                  variant="secondary"
                  icon={<ClockIcon />}
                  onClick={() => navigate('/my-history')}
                  fullWidth
                >
                  История выполнения
                </Button>
              </>
            )}

            {/* Действия для всех */}
            <Button
              variant="secondary"
              icon={<LinkIcon />}
              onClick={() => navigate('/links')}
              fullWidth
            >
              Полезные ссылки
            </Button>
          </div>
        </Section>
      </div>

      {/* Recent Tasks and Issues */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Today's Tasks */}
        <Section
          title="Задачи за сегодня"
          icon={<CalendarIcon />}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
              Все задачи
            </Button>
          }
        >
          {dashboardData?.today_tasks_list && dashboardData.today_tasks_list.length > 0 ? (
            <div className="space-y-3 max-h-[340px] sm:max-h-[400px] overflow-y-auto pr-1">
              {dashboardData.today_tasks_list.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                    task.status === 'overdue'
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {task.deadline ? formatDateTime(task.deadline) : formatTime(task.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} type="task" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarIcon />}
              title="Нет задач за сегодня"
            />
          )}
        </Section>

        {/* Issues Alert */}
        <Section title="Требует внимания" icon={<ExclamationTriangleIcon />}>
          {((dashboardData?.overdue_tasks || 0) > 0 || (dashboardData?.late_shifts_today || 0) > 0) ? (
            <div className="space-y-3 max-h-[340px] sm:max-h-[400px] overflow-y-auto pr-1">
              {dashboardData?.overdue_tasks_list && dashboardData.overdue_tasks_list.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.overdue_tasks_list.map(task => (
                    <Card
                      key={task.id}
                      variant="danger"
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div onClick={() => handleOpenTask(task)} className="p-3">
                        <div className="flex items-start">
                          <XCircleIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-red-900 dark:text-red-200 text-sm">
                              {task.title}
                            </p>
                            <div className="flex items-center text-xs text-red-700 mt-1">
                              <span>Просрочено: {task.deadline ? formatDateTime(task.deadline) : 'Без срока'}</span>
                              <span className="mx-1">•</span>
                              <span>{task.creator?.full_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                (dashboardData?.overdue_tasks || 0) > 0 && (
                  <Card variant="danger">
                    <div className="p-3 flex items-center">
                      <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-200 text-sm">
                          {dashboardData?.overdue_tasks} просроченных задач
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Требуют немедленного внимания
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              )}

              {(dashboardData?.late_shifts_today || 0) > 0 && (
                <Card variant="warning">
                  <div className="p-3 flex items-center">
                    <ClockIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-200 text-sm">
                        {dashboardData?.late_shifts_today} опозданий сегодня
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Необходимо проконтролировать
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-300 dark:text-green-700 mb-3" />
              <p>Все в порядке</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Нет проблем для внимания</p>
            </div>
          )}
        </Section>
      </div>

      {/* Pending Review Section - for managers/owners */}
      {permissions.canManageTasks && (dashboardData?.pending_review_count || 0) > 0 && (
        <Section
          title="Задачи на проверке"
          icon={<ClipboardDocumentCheckIcon />}
          subtitle={`${dashboardData?.pending_review_count || 0} задач ожидают верификации`}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks?status=pending_review')}>
              Все на проверке
            </Button>
          }
          className="mt-6"
        >
          {dashboardData?.pending_review_tasks && dashboardData.pending_review_tasks.length > 0 ? (
            <div className="space-y-3 max-h-[340px] sm:max-h-[400px] overflow-y-auto pr-1">
              {dashboardData.pending_review_tasks.map((task) => (
                <Card
                  key={task.id}
                  variant="warning"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div onClick={() => handleOpenTask(task)} className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {task.assignments && task.assignments.length > 0 && (
                            <span>
                              {task.assignments.map(a => a.user.full_name).join(', ')}
                            </span>
                          )}
                          {task.responses?.filter(r => r.status === 'pending_review').map(r => (
                            r.proofs && r.proofs.length > 0 && (
                              <Badge key={r.id} variant="info" size="sm">
                                {r.proofs.length} файл(ов)
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>
                      <StatusBadge status="pending_review" type="task" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardDocumentCheckIcon />}
              title="Нет задач на проверке"
            />
          )}
        </Section>
      )}

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditModalOpen(true);
        }}
      />

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={selectedTask}
      />
    </PageContainer>
  );
};
