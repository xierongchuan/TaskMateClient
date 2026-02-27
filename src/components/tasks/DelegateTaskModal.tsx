import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import type { Task } from '../../types/task';
import { Modal, Button, Textarea } from '../ui';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface DelegateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  userId: number;
  onSubmit: (taskId: number, toUserId: number, reason?: string) => void;
  isLoading?: boolean;
}

export const DelegateTaskModal: React.FC<DelegateTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  userId,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  // Загружаем сотрудников из того же автосалона
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['delegation-users', task?.dealership_id],
    queryFn: () => usersApi.getUsers({
      dealership_id: task?.dealership_id,
      role: 'employee',
      per_page: 100,
    }),
    enabled: isOpen && !!task?.dealership_id,
    staleTime: 1000 * 60,
  });

  // Фильтруем: исключаем себя и уже назначенных на задачу
  const assignedUserIds = task?.assignments?.map(a => a.user.id) || [];
  const availableUsers = (usersData?.data || []).filter(
    u => u.id !== userId && !assignedUserIds.includes(u.id)
  );

  const handleSubmit = () => {
    if (task && selectedUserId) {
      onSubmit(task.id, selectedUserId, reason || undefined);
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    setReason('');
    onClose();
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Делегировать задачу" size="md">
      <Modal.Body>
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <ArrowsRightLeftIcon className="w-4 h-4" />
            Задача
          </div>
          <div className="text-gray-900 dark:text-white font-medium">{task.title}</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Кому делегировать <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={usersLoading || isLoading}
            className="unified-input block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:outline-none focus:border-accent-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
          >
            {usersLoading ? (
              <option value="">Загрузка...</option>
            ) : (
              <>
                <option value="">Выберите сотрудника</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </>
            )}
          </select>
          {!usersLoading && availableUsers.length === 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Нет доступных сотрудников для делегирования
            </p>
          )}
        </div>

        <div>
          <Textarea
            label="Причина (необязательно)"
            placeholder="Укажите причину делегирования..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            disabled={isLoading}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Отмена
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selectedUserId || isLoading}
          isLoading={isLoading}
        >
          Делегировать
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
