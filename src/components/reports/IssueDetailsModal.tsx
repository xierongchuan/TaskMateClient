import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { Modal, Button, Skeleton } from '../ui';
import { reportsApi, type IssueDetail } from '../../api/reports';

interface IssueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueType: string | null;
  issueDescription: string;
  dateFrom: string;
  dateTo: string;
  dealershipId?: number | null;
  onSelectEmployee?: (employeeId: number) => void;
}

const ISSUE_TITLES: Record<string, string> = {
  overdue_tasks: 'Просроченные задачи',
  late_shifts: 'Опоздания на смены',
  frequent_postponements: 'Частые переносы задач',
  pending_review_tasks: 'Задачи на проверке',
  low_performers: 'Сотрудники с низким рейтингом',
  stale_pending_tasks: 'Долго невыполненные задачи',
  missed_shifts: 'Неявки на смены',
};

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  isOpen,
  onClose,
  issueType,
  issueDescription,
  dateFrom,
  dateTo,
  dealershipId,
  onSelectEmployee,
}) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['issue-details', issueType, dateFrom, dateTo, dealershipId],
    queryFn: () => reportsApi.getIssueDetails(issueType!, dateFrom, dateTo, dealershipId),
    enabled: isOpen && !!issueType,
  });

  const handleItemClick = (item: IssueDetail) => {
    onClose();
    const params = new URLSearchParams();

    // Добавляем dealership_id из самого элемента
    if (item.dealership_id) {
      params.append('dealership_id', item.dealership_id.toString());
    }

    switch (item.type) {
      case 'task':
        params.append('task_id', item.id.toString());
        navigate(`/tasks?${params.toString()}`);
        break;
      case 'shift':
        if (item.user_id) {
          params.append('user_id', item.user_id.toString());
          params.append('is_late', 'true');
          navigate(`/shifts?${params.toString()}`);
        }
        break;
      case 'user':
        if (onSelectEmployee) {
          onSelectEmployee(item.id);
        }
        break;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-accent-500" />;
      case 'shift':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'user':
        return <UserIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const title = issueType ? ISSUE_TITLES[issueType] || issueDescription : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-2">
          {isLoading ? (
            <Skeleton variant="list" count={5} />
          ) : data?.items && data.items.length > 0 ? (
            data.items.map((item, index) => (
              <div
                key={`${item.type}-${item.id}-${index}`}
                onClick={() => handleItemClick(item)}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getItemIcon(item.type)}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {item.date && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.date}
                    </span>
                  )}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Нет данных для отображения
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
