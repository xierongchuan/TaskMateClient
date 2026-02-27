import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Modal, Button, Badge, Skeleton } from '../ui';
import { DonutChart, DonutChartLegend } from '../ui/DonutChart';
import { RoleBadge } from '../common';
import { usePermissions } from '../../hooks/usePermissions';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
}

// Описания ролей
const roleDescriptions: Record<string, string> = {
  employee: 'Сотрудник - может выполнять задачи и управлять своими сменами',
  observer: 'Наблюдатель - может только просматривать информацию',
  manager: 'Менеджер - управляет задачами и сотрудниками своего автосалона',
  owner: 'Владелец - полный доступ ко всем функциям системы',
};

// Функция для получения цвета аватара по роли
const getAvatarColor = (role: string): string => {
  switch (role) {
    case 'employee':
      return 'bg-blue-500';
    case 'manager':
      return 'bg-green-500';
    case 'observer':
      return 'bg-purple-500';
    case 'owner':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const periodOptions = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
];

const formatTime = (hours: number): string => {
  if (hours === 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} мин`;
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  return remainHours > 0 ? `${days} д ${remainHours} ч` : `${days} д`;
};

const responseTypeLabels: Record<string, string> = {
  notification: 'Уведомление',
  completion: 'Выполнение',
  completion_with_proof: 'С доказательством',
};

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
}) => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [periodDays, setPeriodDays] = useState('30');

  const dateRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - parseInt(periodDays));
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [periodDays]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats', user?.id, dateRange.from, dateRange.to],
    queryFn: () => usersApi.getUserStats(user!.id, dateRange.from, dateRange.to),
    enabled: isOpen && !!user,
  });

  if (!user) return null;

  const handleViewTasks = () => {
    onClose();
    navigate(`/tasks?assigned_to=${user.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(user);
      onClose();
    }
  };

  const canEdit = permissions.canCreateUsers;
  const phone = user.phone || user.phone_number;
  const userDealerships = user.dealerships || (user.dealership ? [user.dealership] : []);

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600 dark:text-green-400';
    if (score >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const chartSegments = stats ? [
    { value: stats.completed_on_time, color: '#22c55e', label: 'Вовремя' },
    { value: stats.completed_late, color: '#eab308', label: 'С опозданием' },
    { value: stats.overdue_tasks, color: '#ef4444', label: 'Просрочено' },
    { value: stats.pending_review, color: '#f97316', label: 'На проверке' },
    { value: stats.rejected_tasks, color: '#a855f7', label: 'Отклонено' },
  ].filter((s: { value: number }) => s.value > 0) : [];

  const taskTypes = stats?.tasks_by_type
    ? Object.entries(stats.tasks_by_type).filter(([, count]) => (count as number) > 0)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user.full_name}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-6">
          {/* Avatar and Role Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-20 h-20 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white text-3xl font-bold`}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <RoleBadge role={user.role} showDescription />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{user.login}
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <PhoneIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Телефон
                </h4>
              </div>
              <p className="text-gray-900 dark:text-white font-medium">
                {formatPhoneNumber(phone)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID Пользователя
                </h4>
              </div>
              <p className="text-gray-900 dark:text-white font-medium">
                #{user.id}
              </p>
            </div>
          </div>

          {/* Dealership Information Card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {user.role === 'manager' && userDealerships.length > 1 ? 'Автосалоны' : 'Автосалон'}
              </h4>
            </div>
            <div>
              {userDealerships.length > 0 ? (
                user.role === 'manager' ? (
                  <div className="flex flex-wrap gap-2">
                    {userDealerships.map((dealership) => (
                      <Badge key={dealership.id} variant="info">
                        {dealership.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">
                    {userDealerships[0].name}
                  </p>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Не привязан к автосалону
                </p>
              )}
            </div>
          </div>

          {/* Role Description Card */}
          <div className="bg-accent-50 dark:bg-gray-700/50 p-3 rounded-lg border border-accent-100 dark:border-gray-600">
            <p className="text-sm text-accent-900 dark:text-accent-200">
              {roleDescriptions[user.role] || 'Роль пользователя'}
            </p>
          </div>

          {/* Statistics Section */}
          {(
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5" />
                  Статистика
                </h3>
                <select
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              ) : stats && !stats.has_history ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <ChartBarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>У пользователя нет истории задач и смен</p>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Вовремя', value: stats.completed_on_time, icon: CheckCircleIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                      { label: 'С опозданием', value: stats.completed_late, icon: ClockIcon, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                      { label: 'Просрочено', value: stats.overdue_tasks, icon: XCircleIcon, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                      { label: 'На проверке', value: stats.pending_review, icon: EyeIcon, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                      { label: 'Отклонено', value: stats.rejected_tasks, icon: NoSymbolIcon, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                      { label: 'Ср. время', value: formatTime(stats.avg_completion_time_hours), icon: ClockIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Опоздания', value: stats.total_shifts > 0 ? `${stats.late_shifts}/${stats.total_shifts}` : '—', icon: ExclamationTriangleIcon, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                      { label: 'Пропущ. смены', value: stats.missed_shifts, icon: XCircleIcon, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                      { label: 'Рейтинг', value: `${stats.performance_score}%`, icon: ChartBarIcon, color: getPerformanceColor(stats.performance_score), bg: stats.performance_score >= 95 ? 'bg-green-50 dark:bg-green-900/20' : stats.performance_score >= 85 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20' },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className={`${stat.bg} rounded-lg p-2 text-center`}>
                          <Icon className={`w-4 h-4 mx-auto mb-0.5 ${stat.color}`} />
                          <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Completion Rate Bar */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Выполнение</span>
                      <span className={`text-sm font-bold ${stats.completion_rate >= 80 ? 'text-green-600' : stats.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.completion_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${stats.completion_rate >= 80 ? 'bg-green-500' : stats.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${stats.completion_rate}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks by Type */}
                  {taskTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {taskTypes.map(([type, count]) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                        >
                          {responseTypeLabels[type] || type}
                          <span className="ml-1.5 font-semibold text-accent-600 dark:text-accent-400">{count as number}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Chart */}
                  {stats.total_tasks > 0 && chartSegments.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                      <DonutChart
                        size={130}
                        strokeWidth={16}
                        centerValue={stats.total_tasks}
                        centerLabel="Всего"
                        segments={chartSegments}
                      />
                      <div className="w-full max-w-xs">
                        <DonutChartLegend segments={chartSegments} />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        {user.role !== 'owner' && (
          <Button
            variant="primary"
            onClick={handleViewTasks}
            className="flex items-center"
          >
            <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
            Посмотреть задачи
          </Button>
        )}
        {canEdit && onEdit && user.role !== 'owner' && (
          <Button
            variant="secondary"
            onClick={handleEdit}
            className="flex items-center"
          >
            <PencilSquareIcon className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
