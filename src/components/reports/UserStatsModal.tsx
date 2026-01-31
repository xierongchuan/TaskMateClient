import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { Modal, Button } from '../ui';
import { DonutChart, DonutChartLegend } from '../ui/DonutChart';

export interface EmployeePerformance {
  employee_id: number;
  employee_name: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  total_shifts: number;
  late_shifts: number;
  avg_late_minutes: number;
  performance_score: number;
  completed_on_time: number;
  completed_late: number;
  avg_completion_time_hours: number;
  pending_review: number;
  rejected_tasks: number;
  tasks_by_type: {
    notification: number;
    completion: number;
    completion_with_proof: number;
  };
  missed_shifts: number;
  has_history: boolean;
}

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeePerformance | null;
  periodLabel?: string;
}

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

export const UserStatsModal: React.FC<UserStatsModalProps> = ({
  isOpen,
  onClose,
  employee,
  periodLabel = 'за выбранный период',
}) => {
  const navigate = useNavigate();

  if (!employee) return null;

  const totalTasks = employee.total_tasks;

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600 dark:text-green-400';
    if (score >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 95) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 85) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const handleViewTasks = () => {
    onClose();
    navigate(`/tasks?assigned_to=${employee.employee_id}`);
  };

  const stats = [
    {
      label: 'Вовремя',
      value: employee.completed_on_time,
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'С опозданием',
      value: employee.completed_late,
      icon: ClockIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Просрочено',
      value: employee.overdue_tasks,
      icon: XCircleIcon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'На проверке',
      value: employee.pending_review,
      icon: EyeIcon,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Отклонено',
      value: employee.rejected_tasks,
      icon: NoSymbolIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Ср. время',
      value: formatTime(employee.avg_completion_time_hours),
      icon: ClockIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Опоздания на смены',
      value: employee.total_shifts > 0 ? `${employee.late_shifts} / ${employee.total_shifts}` : '—',
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Пропущ. смены',
      value: employee.missed_shifts,
      icon: XCircleIcon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Рейтинг',
      value: `${employee.performance_score}%`,
      icon: ChartBarIcon,
      color: getPerformanceColor(employee.performance_score),
      bg: getPerformanceBg(employee.performance_score),
    },
  ];

  const chartSegments = [
    { value: employee.completed_on_time, color: '#22c55e', label: 'Вовремя' },
    { value: employee.completed_late, color: '#eab308', label: 'С опозданием' },
    { value: employee.overdue_tasks, color: '#ef4444', label: 'Просрочено' },
    { value: employee.pending_review, color: '#f97316', label: 'На проверке' },
    { value: employee.rejected_tasks, color: '#a855f7', label: 'Отклонено' },
  ].filter(s => s.value > 0);

  const taskTypes = Object.entries(employee.tasks_by_type || {}).filter(([, count]) => count > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Статистика: ${employee.employee_name}`}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-6">
          {/* Period Badge */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Данные {periodLabel}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`${stat.bg} rounded-xl p-3 text-center`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Rate */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Процент выполнения
              </span>
              <span className={`text-lg font-bold ${employee.completion_rate >= 80 ? 'text-green-600' : employee.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {employee.completion_rate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${employee.completion_rate >= 80 ? 'bg-green-500' : employee.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${employee.completion_rate}%` }}
              />
            </div>
          </div>

          {/* Tasks by Type */}
          {taskTypes.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                По типам задач
              </h4>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-gray-600 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-500"
                  >
                    {responseTypeLabels[type] || type}
                    <span className="ml-2 font-semibold text-accent-600 dark:text-accent-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Avg late minutes */}
          {employee.late_shifts > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Среднее опоздание на смену
                </span>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {employee.avg_late_minutes} мин
                </span>
              </div>
            </div>
          )}

          {/* Chart */}
          {totalTasks > 0 && chartSegments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
              <DonutChart
                size={160}
                strokeWidth={20}
                centerValue={totalTasks}
                centerLabel="Всего задач"
                segments={chartSegments}
              />
              <div className="w-full max-w-xs">
                <DonutChartLegend segments={chartSegments} />
              </div>
            </div>
          )}

          {totalTasks === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Нет задач за выбранный период</p>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleViewTasks}>
          <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
          Посмотреть задачи
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
