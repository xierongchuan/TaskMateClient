import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentWeekRange, getCurrentMonthRange } from '../utils/dateTime';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { reportsApi } from '../api/reports';
import { UserStatsModal, type EmployeePerformance } from '../components/reports/UserStatsModal';
import { IssueDetailsModal } from '../components/reports/IssueDetailsModal';
import { useWorkspace } from '../hooks/useWorkspace';

// Унифицированные компоненты
import {
  Button,
  Select,
  Badge,
  Skeleton,
  EmptyState,
  PageContainer,
  Card,
  Section,
  PageHeader,
} from '../components/ui';

export const ReportsPage: React.FC = () => {
  const { dealershipId: workspaceDealershipId } = useWorkspace();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('week');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<{ type: string; description: string } | null>(null);
  const [dateRange, setDateRange] = useState(getCurrentWeekRange);
  const [reportFormat, setReportFormat] = useState<'json' | 'pdf'>('json');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports', dateRange.from, dateRange.to, workspaceDealershipId],
    queryFn: () => reportsApi.getReport(dateRange.from, dateRange.to, workspaceDealershipId),
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const handlePeriodChange = (period: 'week' | 'month' | 'custom') => {
    setSelectedPeriod(period);

    switch (period) {
      case 'week':
        setDateRange(getCurrentWeekRange());
        break;
      case 'month':
        setDateRange(getCurrentMonthRange());
        break;
      case 'custom':
        // оставляем текущие даты
        break;
    }
  };

  const handleExport = () => {
    if (reportFormat === 'pdf') {
      window.print();
    } else {
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `report-${dateRange.from}-${dateRange.to}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'info' | 'warning' | 'gray' => {
    switch (status) {
      case 'completed': return 'success';
      case 'completed_late': return 'warning';
      case 'overdue': return 'danger';
      case 'pending': return 'info';
      case 'pending_review': return 'warning';
      case 'acknowledged': return 'info';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'completed_late': return 'Выполнено с опозданием';
      case 'overdue': return 'Просрочено';
      case 'pending': return 'Ожидает';
      case 'pending_review': return 'На проверке';
      case 'acknowledged': return 'Принято';
      default: return status;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600 dark:text-green-400';
    if (score >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBarColor = (score: number) => {
    if (score >= 95) return 'bg-green-500';
    if (score >= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'completed_late': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'pending_review': return 'bg-orange-500';
      case 'acknowledged': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'pdf', label: 'PDF' },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Отчетность"
        description="Еженедельные и ежемесячные отчеты по системе управления задачами"
      >
        <div className="flex items-center space-x-3 print:hidden">
          <Select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value as 'json' | 'pdf')}
            options={formatOptions}
            selectSize="sm"
            fullWidth={false}
          />
          <Button
            variant="secondary"
            icon={<ArrowPathIcon />}
            onClick={() => refetch()}
          >
            Обновить
          </Button>
          <Button
            variant="primary"
            icon={<ArrowDownTrayIcon />}
            onClick={handleExport}
            disabled={!reportData}
          >
            Экспорт
          </Button>
        </div>
      </PageHeader>

      {/* Period Selector */}
      <Card className="mb-6">
        <Card.Body>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Period Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Период:</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant={selectedPeriod === 'week' ? 'primary' : 'secondary'}
                    onClick={() => handlePeriodChange('week')}
                    fullWidth={false}
                  >
                    Эта неделя
                  </Button>
                  <Button
                    variant={selectedPeriod === 'month' ? 'primary' : 'secondary'}
                    onClick={() => handlePeriodChange('month')}
                    fullWidth={false}
                  >
                    Этот месяц
                  </Button>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Диапазон дат:</span>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block sm:hidden">Диапазон дат:</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="unified-input w-full sm:w-auto px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-base focus:outline-none focus:border-accent-500 min-h-[44px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-center sm:text-left hidden sm:block">—</span>
                  <div className="text-center sm:hidden text-gray-500 dark:text-gray-400 text-sm mb-1">до</div>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="unified-input w-full sm:w-auto px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-base focus:outline-none focus:border-accent-500 min-h-[44px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>
            </div>

          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="card" count={6} />
          </Card.Body>
        </Card>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <Card.Body>
                <div className="flex items-center">
                  <div className="p-3 bg-accent-100 dark:bg-gray-700 rounded-xl">
                    <DocumentTextIcon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего задач</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reportData.summary.total_tasks}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Выполнено</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reportData.summary.completed_tasks}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {((reportData.summary.completed_tasks / reportData.summary.total_tasks) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Просрочено</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reportData.summary.overdue_tasks}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {((reportData.summary.overdue_tasks / reportData.summary.total_tasks) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Опоздания</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reportData.summary.late_shifts}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">смен</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Tasks by Status */}
          <Section title="Распределение задач по статусам">
            <div className="space-y-3">
              {reportData.tasks_by_status.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} задач</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressBarColor(item.status)}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Employee Performance */}
          <Section title="Эффективность сотрудников">
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Сотрудник</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Задачи</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Просрочено</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Смены</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">Рейтинг</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.employees_performance.map((employee, index) => (
                    <tr
                      key={employee.employee_id}
                      onClick={() => setSelectedEmployee(employee)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      {/* Номер в рейтинге */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Сотрудник с аватаром */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-accent">{getInitials(employee.employee_name)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.employee_name}</span>
                        </div>
                      </td>

                      {/* Задачи: выполнено/всего + прогресс-бар */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold text-green-600 dark:text-green-400">{employee.completed_tasks}</span>
                            <span className="text-gray-400 dark:text-gray-500"> / {employee.total_tasks}</span>
                          </span>
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-green-500 transition-all"
                              style={{ width: `${employee.completion_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Просрочено */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={employee.overdue_tasks > 0 ? 'danger' : 'success'} size="sm">
                          {employee.overdue_tasks}
                        </Badge>
                      </td>

                      {/* Смены: опоздания/всего + среднее опоздание */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {employee.late_shifts > 0 ? (
                              <>
                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{employee.late_shifts}</span>
                                <span className="text-gray-400 dark:text-gray-500"> / {employee.total_shifts}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">{employee.total_shifts} смен</span>
                            )}
                          </span>
                          {employee.late_shifts > 0 && employee.avg_late_minutes > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">~{employee.avg_late_minutes} мин</span>
                          )}
                        </div>
                      </td>

                      {/* Рейтинг с прогресс-баром */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getPerformanceBarColor(employee.performance_score)}`}
                              style={{ width: `${employee.performance_score}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-semibold min-w-[42px] text-right ${getPerformanceColor(employee.performance_score)}`}>
                            {employee.performance_score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Top Issues */}
          <Section title="Топ проблем за период">
            {reportData.top_issues.length > 0 ? (
              <div className="space-y-3">
                {reportData.top_issues.map((issue, index) => (
                  <div
                    key={issue.issue_type}
                    onClick={() => setSelectedIssue({ type: issue.issue_type, description: issue.description })}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{issue.description}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{issue.count} инцидентов</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{issue.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium text-green-600 dark:text-green-400">Проблем не обнаружено</p>
                <p className="text-sm">За выбранный период все показатели в норме</p>
              </div>
            )}
          </Section>
        </div>
      ) : (
        <EmptyState
          icon={<ChartBarIcon />}
          title="Нет данных для отчета"
          description="Выберите период для генерации отчета"
        />
      )}

      <UserStatsModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        periodLabel={`с ${dateRange.from} по ${dateRange.to}`}
      />

      <IssueDetailsModal
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        issueType={selectedIssue?.type ?? null}
        issueDescription={selectedIssue?.description ?? ''}
        dateFrom={dateRange.from}
        dateTo={dateRange.to}
        dealershipId={workspaceDealershipId}
      />
    </PageContainer>
  );
};
