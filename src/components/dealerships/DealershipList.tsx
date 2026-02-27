import React, { useState, useEffect, useCallback } from 'react';
import { useDealerships, useDeleteDealership } from '../../hooks/useDealerships';
import { usePermissions } from '../../hooks/usePermissions';
import { usePagination } from '../../hooks/usePagination';
import type { Dealership } from '../../types/dealership';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateTime';

// UI Components
import {
  Card,
  Button,
  Input,
  Skeleton,
  EmptyState,
  ErrorState,
  Pagination,
  ConfirmDialog,
} from '../ui';
import { useToast } from '../ui/Toast';

interface DealershipListProps {
  onEdit?: (dealership: Dealership) => void;
}

export const DealershipList: React.FC<DealershipListProps> = ({ onEdit }) => {
  const { canManageDealerships } = usePermissions();
  const { showToast } = useToast();
  const { limit } = usePagination();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
  });
  const [confirmDelete, setConfirmDelete] = useState<Dealership | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const { data, isLoading, error, refetch } = useDealerships({ ...filters, page, per_page: limit });

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Обработчик изменения ввода с useCallback для оптимизации
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Debounce эффект с управлением состоянием загрузки
  useEffect(() => {
    if (searchInput !== filters.search) {
      setIsSearchLoading(true);
    }

    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput }));
      }
      setIsSearchLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput, filters.search]);

  const deleteDealership = useDeleteDealership();

  const handleDelete = (dealership: Dealership) => {
    setConfirmDelete(dealership);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      await deleteDealership.mutateAsync(confirmDelete.id);
      showToast({ type: 'success', message: 'Автосалон удалён' });
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      showToast({ type: 'error', message: 'Ошибка удаления автосалона' });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, search: '' }));
    setPage(1);
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <Skeleton variant="list" count={3} />
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Ошибка загрузки"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {/* Search */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Поиск по названию или адресу..."
                value={searchInput}
                onChange={handleSearchChange}
                icon={<MagnifyingGlassIcon className={isSearchLoading ? 'text-accent-500 animate-pulse' : ''} />}
              />
              {isSearchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-500"></div>
                </div>
              )}
            </div>
            {filters.search && (
              <Button
                variant="secondary"
                onClick={clearSearch}
              >
                Очистить
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Dealerships Grid */}
      {data?.data.length === 0 ? (
        <EmptyState
          icon={<BuildingOfficeIcon className="w-16 h-16" />}
          title={filters.search ? 'Автосалоны не найдены' : 'Нет автосалонов'}
          description={filters.search ? 'Попробуйте изменить параметры поиска' : 'Создайте первый автосалон для начала работы'}
          action={filters.search ? (
            <Button variant="primary" onClick={clearSearch}>
              Сбросить поиск
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((dealership) => (
              <Card
                key={dealership.id}
                className="hover:shadow-md transition-all duration-200 hover:border-accent-200 dark:hover:border-accent-500"
              >
                <Card.Body>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-accent-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {dealership.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {dealership.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    {dealership.address && (
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {dealership.address}
                        </p>
                      </div>
                    )}

                    {dealership.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {dealership.phone}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Создан: {formatDate(dealership.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PencilIcon />}
                      onClick={() => onEdit?.(dealership)}
                    >
                      Изменить
                    </Button>
                    {canManageDealerships && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<TrashIcon />}
                        onClick={() => handleDelete(dealership)}
                        disabled={deleteDealership.isPending}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700"
                      >
                        Удалить
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data && data.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.last_page}
              total={data.total}
              perPage={data.per_page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Удаление автосалона"
        message={`Вы уверены, что хотите удалить автосалон "${confirmDelete?.name}"? Это действие нельзя будет отменить.`}
        variant="danger"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        isLoading={deleteDealership.isPending}
      />
    </>
  );
};
