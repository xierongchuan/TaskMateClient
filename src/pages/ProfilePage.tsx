import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { shiftsApi } from '../api/shifts';
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Input,
  Skeleton,
  useToast, // Use our custom hook
} from '../components/ui';
import type { UpdateUserRequest } from '../types/user'; // Import type
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
// import { toast } from 'react-hot-toast'; // Removed
import {
  UserIcon,
  KeyIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PhoneIcon,

  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { RoleBadge } from '../components/common';
// import { formatPhoneNumber } from '../utils/phoneFormatter'; // Removed unused
import { DonutChart, DonutChartLegend } from '../components/ui/DonutChart';
import { reportsApi } from '../api/reports';
import { getCurrentMonthRange } from '../utils/dateTime';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast(); // Destructure showToast
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'stats'>('info');

  // Personal Info Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',

    dealership_id: undefined as number | undefined,
    dealership_ids: [] as number[],
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || user.phone_number || '',

        dealership_id: user.dealership_id || undefined,
        dealership_ids: user.dealerships?.map(d => d.id) || [],
      });
    }
  }, [user]);

  // Fetch shifts stats (Total)
  const { data: shiftsData, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['my-shifts-count'],
    queryFn: () => shiftsApi.getMyShifts({ per_page: 1 }),
  });

  // Fetch comprehensive report stats for current month
  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: ['my-report-stats', user?.id],
    queryFn: async () => {
      const { from, to } = getCurrentMonthRange();
      return reportsApi.getReport(from, to);
    },
    enabled: !!user,
  });

  const myStats = reportData?.employees_performance?.find(e => e.employee_id === user?.id);
  const hasTaskActivity = myStats && (myStats.completed_tasks > 0 || myStats.overdue_tasks > 0);
  const showTaskStats = user?.role === 'employee' || hasTaskActivity;

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.updateUser(user!.id, data),
    onSuccess: async () => {
      showToast({ type: 'success', message: 'Профиль обновлен' });
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['users', user?.id] });
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any)?.response?.data?.message || (error as Error)?.message || 'Ошибка обновления профиля';
      showToast({ type: 'error', message });
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      full_name: formData.full_name,
      phone: formData.phone,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.current_password) {
      showToast({ type: 'error', message: 'Введите текущий пароль' });
      return;
    }
    if (passwordData.password !== passwordData.confirm_password) {
      showToast({ type: 'error', message: 'Пароли не совпадают' });
      return;
    }
    if (passwordData.password.length < 6) {
      showToast({ type: 'error', message: 'Пароль должен быть не менее 6 символов' });
      return;
    }

    updateProfileMutation.mutate({
      current_password: passwordData.current_password,
      password: passwordData.password,
    });
    setPasswordData({ current_password: '', password: '', confirm_password: '' });
  };

  const handleLogout = async () => {
    await logout();
    // Navigate is handled by ProtectedRoute/Layout usually, or App router
    window.location.href = '/login'; // Fallback force reload/redirect
  };

  if (!user) return null;

  const tabs = [
    { id: 'info', label: 'Личные данные', icon: UserIcon },
    { id: 'security', label: 'Безопасность', icon: KeyIcon },
    { id: 'stats', label: 'Статистика', icon: ChartBarIcon },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Мой профиль"
        description="Управление аккаунтом и личными данными"
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* User Card */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card>
            <Card.Body className="flex flex-col items-center text-center p-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 ${user.role === 'owner' ? 'bg-red-500' :
                user.role === 'manager' ? 'bg-green-500' :
                  user.role === 'observer' ? 'bg-purple-500' : 'bg-blue-500'
                }`}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {user.full_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                @{user.login}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <RoleBadge role={user.role} />
              </div>

              <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-6">
                {isShiftsLoading || isReportLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton variant="rectangular" height={48} />
                    <Skeleton variant="rectangular" height={48} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {shiftsData?.total || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                        Смен
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {myStats?.completed_tasks || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                        Задач
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="danger"
                className="w-full mt-6 flex justify-center items-center gap-2"
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Выйти из аккаунта
              </Button>
            </Card.Body>
          </Card>
        </div>

        {/* content */}
        <div className="w-full lg:w-2/3">
          {/* Tabs Navigation */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'info' | 'security' | 'stats')}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }
                    `}
                    title={tab.label}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-accent-500 dark:text-accent-400' : 'opacity-70'}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card>
            <Card.Body className="p-6">
              {activeTab === 'info' && (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Мой Логин"
                      value={user.login}
                      disabled
                      className="bg-gray-50 dark:bg-gray-700/50"
                    />

                    <Input
                      label="Полное имя"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />

                    <Input
                      label="Телефон"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      type="tel"
                      icon={<PhoneIcon className="w-5 h-5 text-gray-400" />}
                      required
                    />


                  </div>

                  {/* Dealership Info (Read Only for all roles) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Автосалон
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <BriefcaseIcon className="w-5 h-5" />
                      {user.dealership?.name || user.dealerships?.map(d => d.name).join(', ') || 'Не привязан'}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updateProfileMutation.isPending}
                    >
                      Сохранить изменения
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="alert bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                      <KeyIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        Используйте надежный пароль. После смены пароля вам может потребоваться выполнить вход заново.
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Текущий пароль"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />

                  <Input
                    label="Новый пароль"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />

                  <Input
                    label="Подтверждение пароля"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    required
                    placeholder="••••••••"
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      variant="warning"
                      isLoading={updateProfileMutation.isPending}
                      disabled={!passwordData.current_password || !passwordData.password}
                    >
                      Обновить пароль
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'stats' && (isShiftsLoading || isReportLoading) && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Skeleton variant="card" count={4} />
                  </div>
                  <Skeleton variant="card" height={200} />
                </div>
              )}

              {activeTab === 'stats' && !isShiftsLoading && !isReportLoading && (
                <div className="space-y-8">
                  {/* Key Metrics Grid */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Total Shifts */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-3 opacity-10">
                        <CalendarDaysIcon className="w-16 h-16 text-accent-600 dark:text-accent-400" />
                      </div>
                      <div className="flex flex-col items-start gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-accent-50 dark:bg-accent-900/20 rounded-xl text-accent-600 dark:text-accent-400">
                          <CalendarDaysIcon className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего смен</div>
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-white pl-1 relative z-10">
                        {shiftsData?.total || 0}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-3 opacity-10">
                        <BriefcaseIcon className="w-16 h-16 text-accent-600 dark:text-accent-400" />
                      </div>
                      <div className="flex flex-col items-start gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-accent-50 dark:bg-gray-700 rounded-xl text-accent-600 dark:text-accent-400">
                          <BriefcaseIcon className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Роль</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white pl-1 capitalize truncate relative z-10">
                        {user.role}
                      </div>
                    </div>

                    {/* Late Shifts (Always Visible) */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-3 opacity-10">
                        <ClockIcon className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex flex-col items-start gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-600 dark:text-yellow-400">
                          <ClockIcon className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Опоздания</div>
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-white pl-1 relative z-10">
                        {myStats?.late_shifts ?? 0}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 pl-1 relative z-10">за текущий месяц</div>
                    </div>

                    {/* Efficiency (Always Visible) */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-3 opacity-10">
                        <CheckCircleIcon className={`w-16 h-16 ${(myStats?.performance_score ?? 100) >= 80 ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      <div className="flex flex-col items-start gap-3 mb-2 relative z-10">
                        <div className={`p-2 rounded-xl ${(myStats?.performance_score ?? 100) >= 80
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                          }`}>
                          <CheckCircleIcon className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Эффективность</div>
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-white pl-1 relative z-10">
                        {myStats?.performance_score ?? 100}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1 pl-1 relative z-10">средний показатель</div>
                    </div>
                  </div>

                  {/* Completion Rate Progress - Only if has tasks */}
                  {showTaskStats && myStats && (myStats.completed_tasks > 0 || myStats.overdue_tasks > 0) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Выполнение в срок</h3>
                      {(() => {
                        const total = myStats.completed_tasks + myStats.overdue_tasks;
                        const rate = total > 0 ? Math.round((myStats.completed_tasks / total) * 100) : 100;
                        const textColorClass = rate >= 80 ? 'text-green-600 dark:text-green-400' : rate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                        const bgColorClass = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {myStats.completed_tasks} из {total} задач выполнено в срок
                              </span>
                              <span className={`text-2xl font-bold ${textColorClass}`}>
                                {rate}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full transition-all duration-500 ${bgColorClass}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Task Statistics Chart - Only if relevant */}
                  {showTaskStats && myStats && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Статистика задач (текущий месяц)</h3>
                      </div>
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                          <DonutChart
                            size={200}
                            strokeWidth={20}
                            centerValue={myStats.completed_tasks + myStats.overdue_tasks}
                            centerLabel="Всего задач"
                            segments={[
                              { value: myStats.completed_tasks, color: '#22c55e', label: 'Выполнено' },
                              { value: myStats.overdue_tasks, color: '#ef4444', label: 'Просрочено' },
                            ]}
                          />
                          <div className="w-full max-w-xs">
                            <DonutChartLegend
                              segments={[
                                { value: myStats.completed_tasks, color: '#22c55e', label: 'Выполнено' },
                                { value: myStats.overdue_tasks, color: '#ef4444', label: 'Просрочено' },
                              ]}
                            />
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Примечание</div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                Статистика отображается за текущий календарный месяц. Для просмотра полной истории используйте раздел "Отчеты".
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!showTaskStats && (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <BriefcaseIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Нет активных задач</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                        Для вашей роли статистика задач не отображается, так как вы не выполняли задач в этом месяце.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
