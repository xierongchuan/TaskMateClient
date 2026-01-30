import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
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
}

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeePerformance | null;
  periodLabel?: string;
}

export const UserStatsModal: React.FC<UserStatsModalProps> = ({
  isOpen,
  onClose,
  employee,
  periodLabel = 'за выбранный период',
}) => {
  const navigate = useNavigate();

  if (!employee) return null;

  const totalTasks = employee.total_tasks;
  const completionRate = employee.completion_rate;

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
      label: 'Выполнено',
      value: `${employee.completed_tasks} / ${employee.total_tasks}`,
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Просрочено',
      value: employee.overdue_tasks,
      icon: XCircleIcon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Опоздания на смены',
      value: employee.total_shifts > 0 ? `${employee.late_shifts} / ${employee.total_shifts}` : '—',
      icon: ClockIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
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
    { value: employee.completed_tasks, color: '#22c55e', label: 'Выполнено в срок' },
    { value: employee.overdue_tasks, color: '#ef4444', label: 'Просрочено' },
  ];

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`${stat.bg} rounded-xl p-4 text-center`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
                Выполнение в срок
              </span>
              <span className={`text-lg font-bold ${completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Chart */}
          {totalTasks > 0 && (
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
