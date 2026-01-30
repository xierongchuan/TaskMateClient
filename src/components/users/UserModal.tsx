import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { DealershipSelector } from '../common/DealershipSelector';
import { DealershipCheckboxList } from '../common/DealershipCheckboxList';
import { useDealerships } from '../../hooks/useDealerships';
import { Input, Select, Button, Alert } from '../ui';
import type { User, CreateUserRequest, UpdateUserRequest, Role, ApiErrorResponse } from '../../types/user';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Сотрудник' },
  { value: 'observer', label: 'Наблюдатель' },
  { value: 'manager', label: 'Управляющий' },
];

const ROLE_OPTIONS_WITH_OWNER = [
  ...ROLE_OPTIONS,
  { value: 'owner', label: 'Владелец' },
];

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  const { data: dealershipsData } = useDealerships();
  const [serverError, setServerError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateUserRequest & UpdateUserRequest>>({
    login: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'employee',
    dealership_id: undefined,
    dealership_ids: [],
  });

  /**
   * Обработка ошибок API с учётом error_type.
   */
  const handleApiError = (error: any, defaultMessage: string): void => {
    const errorData = error.response?.data as ApiErrorResponse | undefined;
    const errorType = errorData?.error_type;
    const message = errorData?.message;

    if (errorType === 'access_denied') {
      setServerError('У вас нет доступа для выполнения этого действия.');
    } else {
      setServerError(message || defaultMessage);
    }
  };

  useEffect(() => {
    setServerError(null);
    if (user) {
      setFormData({
        login: user.login,
        full_name: user.full_name,
        phone: user.phone || user.phone_number || '',
        role: user.role,
        dealership_id: user.dealership_id || undefined,
        dealership_ids: user.dealerships?.map(d => d.id) || [],
      });
    } else {
      setFormData({
        login: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'employee',
        dealership_id: undefined,
        dealership_ids: [],
      });
    }
  }, [user]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: any) => {
      handleApiError(error, 'Ошибка при создании пользователя');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.updateUser(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: any) => {
      handleApiError(error, 'Ошибка при обновлении пользователя');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (user) {
      updateMutation.mutate(formData as UpdateUserRequest);
    } else {
      createMutation.mutate(formData as CreateUserRequest);
    }
  };

  if (!isOpen) return null;

  const roleOptions = user?.role === 'owner' ? ROLE_OPTIONS_WITH_OWNER : ROLE_OPTIONS;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm dark:bg-gray-900/80" onClick={onClose}></div>

        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl text-left shadow-xl transform transition-all">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                {user ? 'Редактировать пользователя' : 'Создать пользователя'}
              </h3>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 -mx-2">
                {serverError && (
                  <Alert
                    variant="error"
                    title="Ошибка"
                    message={serverError}
                    onClose={() => setServerError(null)}
                  />
                )}

                <Input
                  label="Логин *"
                  type="text"
                  required
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  title="Только латинские буквы, цифры, одна точка и одно подчеркивание"
                  maxLength={64}
                  pattern="^(?!.*\..*\.)(?!.*_.*_)[a-zA-Z0-9._]+$"
                  inputSize="lg"
                />

                {!user && (
                  <Input
                    label="Пароль *"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    inputSize="lg"
                  />
                )}

                {user && (
                  <Input
                    label="Новый пароль (оставьте пустым, чтобы не менять)"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    inputSize="lg"
                  />
                )}

                <Input
                  label="Полное имя *"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  inputSize="lg"
                />

                <Input
                  label="Телефон *"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 XXX XXX XX XX"
                  inputSize="lg"
                />

                <Select
                  label="Роль *"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  options={roleOptions}
                  selectSize="lg"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Автосалон</label>
                  {formData.role === 'manager' ? (
                    <DealershipCheckboxList
                      dealerships={dealershipsData?.data || []}
                      selectedIds={formData.dealership_ids || []}
                      onToggle={(dealershipId) => {
                        const currentIds = formData.dealership_ids || [];
                        let newIds;
                        if (currentIds.includes(dealershipId)) {
                          newIds = currentIds.filter(id => id !== dealershipId);
                        } else {
                          newIds = [...currentIds, dealershipId];
                        }
                        const newPrimaryId = newIds.length > 0 ? newIds[0] : undefined;
                        setFormData({
                          ...formData,
                          dealership_ids: newIds,
                          dealership_id: newPrimaryId
                        });
                      }}
                      description="Выберите салоны для управления:"
                    />
                  ) : (
                    <DealershipSelector
                      value={formData.dealership_id}
                      onChange={(dealershipId) => setFormData({ ...formData, dealership_id: dealershipId || undefined })}
                      placeholder="Выберите автосалон"
                      className="unified-input rounded-xl"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-col-reverse gap-2 sm:flex-row-reverse sm:gap-3 rounded-b-2xl [&>button]:w-full [&>button]:sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {user ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
