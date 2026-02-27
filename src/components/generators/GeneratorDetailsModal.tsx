import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../../utils/dateTime';
import {
  PencilIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { taskGeneratorsApi } from '../../api/taskGenerators';
import { usePermissions } from '../../hooks/usePermissions';
import type { TaskGenerator, PeriodStats } from '../../types/taskGenerator';
import { Modal, Button, Badge, Skeleton } from '../ui';
import { DonutChart, DonutChartLegend } from '../ui/DonutChart';
import { StatCard } from '../ui/StatCard';
import { PriorityBadge } from '../common';

interface GeneratorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  generator: TaskGenerator | null;
  onEdit?: (generator: TaskGenerator) => void;
}

export const GeneratorDetailsModal: React.FC<GeneratorDetailsModalProps> = ({
  isOpen,
  onClose,
  generator,
  onEdit
}) => {
  const permissions = usePermissions();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['generator-stats', generator?.id],
    queryFn: () => taskGeneratorsApi.getStatistics(generator!.id),
    enabled: isOpen && !!generator,
  });

  if (!isOpen || !generator) return null;

  const stats = statsData?.data;

  const getRecurrenceLabel = (
    recurrence: string,
    daysOfWeek?: number[] | null,
    daysOfMonth?: number[] | null
  ) => {
    const dayLabels: Record<number, string> = {
      1: 'Пн', 2: 'Вт', 3: 'Ср',
      4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'
    };

    switch (recurrence) {
      case 'daily':
        return 'Ежедневно';
      case 'weekly': {
        if (!daysOfWeek || daysOfWeek.length === 0) {
          return 'Еженедельно';
        }
        if (daysOfWeek.length === 1) {
          return `Еженедельно (${dayLabels[daysOfWeek[0]] || 'Пн'})`;
        }
        const labels = daysOfWeek.map(d => dayLabels[d]).join(', ');
        return `Еженедельно (${labels})`;
      }
      case 'monthly': {
        if (!daysOfMonth || daysOfMonth.length === 0) {
          return 'Ежемесячно';
        }
        if (daysOfMonth.length === 1) {
          const day = daysOfMonth[0];
          if (day < 0) {
            return day === -1 ? 'Ежемесячно (последний день)' : `Ежемесячно (${Math.abs(day)}-й с конца)`;
          }
          return `Ежемесячно (${day}-го)`;
        }
        const dayLabelsMonth = daysOfMonth.map(d => {
          if (d === -1) return 'последний';
          if (d === -2) return 'предпосл.';
          return `${d}`;
        }).join(', ');
        return `Ежемесячно (${dayLabelsMonth})`;
      }
      default:
        return recurrence;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '—';
    return time.slice(0, 5);
  };

  const formatMinutes = (minutes: number | null | undefined) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${Math.round(minutes)} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  const getChartSegments = (periodStats: PeriodStats | undefined) => {
    if (!periodStats) return [];
    return [
      { value: periodStats.completed_count, color: '#22c55e', label: 'Выполнено' },
      { value: periodStats.expired_count, color: '#ef4444', label: 'Просрочено' },
      { value: periodStats.pending_count, color: '#f59e0b', label: 'В ожидании' },
    ];
  };

  const renderPeriodCard = (label: string, periodStats: PeriodStats | undefined) => {
    if (!periodStats) return null;
    const total = periodStats.total_generated;

    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
        <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {label}
        </h5>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {total > 0 ? `${periodStats.completion_rate}%` : '—'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {total} задач
          </span>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600 dark:text-green-400">
              ✓ {periodStats.completed_count}
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {periodStats.expired_count}
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              ⏳ {periodStats.pending_count}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={generator.title} size="2xl">
      <Modal.Body>
        {/* Header badges */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <PriorityBadge priority={generator.priority} />
          {generator.is_active ? (
            <Badge variant="success" size="sm" icon={<CheckCircleIcon className="w-3 h-3" />}>
              Активен
            </Badge>
          ) : (
            <Badge variant="gray" size="sm">
              Приостановлен
            </Badge>
          )}
          <Badge variant="info" size="sm" icon={<ArrowPathIcon className="w-3 h-3" />}>
            {getRecurrenceLabel(generator.recurrence, generator.recurrence_days_of_week, generator.recurrence_days_of_month)}
          </Badge>
        </div>

        {/* Description */}
        {generator.description && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Описание</h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              {generator.description}
            </p>
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <ClockIcon className="w-4 h-4 mr-1.5" />
              Время появления / дедлайн
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {formatTime(generator.recurrence_time)} → {formatTime(generator.deadline_time)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
              Автосалон
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {generator.dealership?.name || 'Все салоны'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Период действия
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              С {formatDate(generator.start_date)}
              {generator.end_date && ` по ${formatDate(generator.end_date)}`}
              {!generator.end_date && ' (бессрочно)'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <UserIcon className="w-4 h-4 mr-1.5" />
              Создатель
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {generator.creator?.full_name || 'Неизвестно'}
            </div>
          </div>
        </div>

        {/* Assignees */}
        {generator.assignments && generator.assignments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1.5" />
              Исполнители ({generator.assignments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {generator.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                  <div className="h-8 w-8 rounded-full bg-accent-100 dark:bg-gray-700 flex items-center justify-center text-accent-600 dark:text-accent-400 text-xs font-semibold mr-3">
                    {assignment.user.full_name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{assignment.user.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <ChartBarIcon className="w-4 h-4 mr-1.5" />
            Статистика
          </h4>

          {statsLoading ? (
            <Skeleton variant="list" count={3} />
          ) : stats ? (
            <>
              {/* All Time Chart */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 rounded-xl">
                <DonutChart
                  segments={getChartSegments(stats.all_time)}
                  size={140}
                  strokeWidth={20}
                  centerValue={stats.all_time.total_generated > 0 ? `${stats.all_time.completion_rate}%` : '—'}
                  centerLabel="Выполнение"
                />
                <div className="flex-1">
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">За всё время</h5>
                  <DonutChartLegend segments={getChartSegments(stats.all_time)} />
                  {stats.all_time.total_generated > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                      Вовремя: <span className="font-medium text-green-600 dark:text-green-400">{stats.all_time.on_time_rate}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Period Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {renderPeriodCard('За неделю', stats.week)}
                {renderPeriodCard('За месяц', stats.month)}
                {renderPeriodCard('За год', stats.year)}
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Всего задач"
                  value={stats.all_time.total_generated}
                  icon={<ArrowPathIcon />}
                  variant="info"
                  size="sm"
                />
                <StatCard
                  title="Выполнено вовремя"
                  value={`${stats.all_time.on_time_rate}%`}
                  subtitle={`${stats.all_time.on_time_count} из ${stats.all_time.completed_count}`}
                  icon={<CheckCircleIcon />}
                  variant="success"
                  size="sm"
                />
                <StatCard
                  title="Среднее время"
                  value={formatMinutes(stats.average_completion_time_minutes)}
                  subtitle="до выполнения"
                  icon={<ClockIcon />}
                  variant="default"
                  size="sm"
                />
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Нет данных для отображения
            </p>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
        {onEdit && permissions.canManageTasks && (
          <Button
            variant="primary"
            icon={<PencilIcon />}
            onClick={() => onEdit(generator)}
          >
            Редактировать
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
