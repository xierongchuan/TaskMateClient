import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { usePermissions } from '../hooks/usePermissions';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { useAuth } from '../hooks/useAuth';
import { usePagination } from '../hooks/usePagination';
import { UserModal } from '../components/users/UserModal';
import { UserDetailsModal } from '../components/users/UserDetailsModal';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import type { User } from '../types/user';
import type { Dealership } from '../types/dealership';
import {
  PlusIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,

  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

// Унифицированные компоненты
import {
  Button,
  Input,
  Select,
  ViewModeToggle,
  FilterPanel,
  Skeleton,
  EmptyState,
  ErrorState,
  PageContainer,
  Card,
  ConfirmDialog,
  Pagination,
  PageHeader,
} from '../components/ui';
import { RoleBadge, ActionButtons } from '../components/common';

export const UsersPage: React.FC = () => {
  const permissions = usePermissions();
  const { user: currentUser } = useAuth();
  const { limit } = usePagination();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('list', 'grid', 768, 'view_mode_users');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [filters, setFilters] = useState<{
    search: string;
    role: string;
    dealership_id: number | undefined;
    sort_by: string;
    sort_dir: 'asc' | 'desc';
  }>({
    search: '',
    role: '',
    dealership_id: undefined,
    sort_by: 'created_at',
    sort_dir: 'desc' as 'asc' | 'desc',
  });

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch dealerships for filtering
  const { data: dealershipsData } = useQuery({
    queryKey: ['dealerships'],
    queryFn: () => usersApi.getDealerships(),
  });

  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['users', filters, page, limit],
    queryFn: () => usersApi.getUsers({ ...filters, page, per_page: limit }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmDelete(null);
    },
  });

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setConfirmDelete(user);
  };

  const handleViewDetails = (user: User) => {
    setDetailsUser(user);
  };

  const handleRoleChange = (user: User, newRole: string) => {
    usersApi.updateUser(user.id, { role: newRole }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      dealership_id: undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    setPage(1);
  };



  const getDealershipsDisplay = (user: User) => {
    if (user.dealerships && user.dealerships.length > 0) {
      return user.dealerships.map(d => d.name).join(', ');
    }
    return user.dealership?.name || 'Не привязан';
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-500';
      case 'manager': return 'bg-green-500';
      case 'observer': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const roleOptions = [
    { value: '', label: 'Все роли' },
    { value: 'employee', label: 'Сотрудник' },
    { value: 'observer', label: 'Наблюдатель' },
    { value: 'manager', label: 'Управляющий' },
    { value: 'owner', label: 'Владелец' },
  ];



  const dealershipOptions = [
    { value: '', label: 'Все салоны' },
    ...(dealershipsData?.data || []).map((d: Dealership) => ({
      value: d.id.toString(),
      label: d.name,
    })),
  ];

  const sortOptions = [
    { value: 'created_at_desc', label: 'Сначала новые' },
    { value: 'created_at_asc', label: 'Сначала старые' },
    { value: 'full_name_asc', label: 'По имени А-Я' },
    { value: 'full_name_desc', label: 'По имени Я-А' },
  ];

  const hasActiveFilters = filters.search || filters.role || filters.dealership_id;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Сотрудники"
        description="Управление сотрудниками, ролями и доступом к салонам"
      >
        {!isMobile && (
          <ViewModeToggle
            mode={viewMode}
            onChange={(mode) => setViewMode(mode as 'list' | 'grid')}
            options={[
              { value: 'list', icon: <ListBulletIcon />, label: 'Список' },
              { value: 'grid', icon: <Squares2X2Icon />, label: 'Карточки' },
            ]}
          />
        )}
        {permissions.canCreateUsers && (
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleCreate}
            fullWidth={isMobile}
          >
            Добавить сотрудника
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <FilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        onClear={hasActiveFilters ? clearFilters : undefined}
        className="mb-6"
      >
        <FilterPanel.Grid columns={5}>
          <Input
            label="Поиск"
            placeholder="Имя, логин..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <Select
            label="Роль"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={roleOptions}
          />

          <Select
            label="Автосалон"
            value={filters.dealership_id?.toString() || ''}
            onChange={(e) => setFilters({ ...filters, dealership_id: e.target.value ? Number(e.target.value) : undefined })}
            options={dealershipOptions}
          />

          <Select
            label="Сортировка"
            value={`${filters.sort_by}_${filters.sort_dir}`}
            onChange={(e) => {
              const parts = e.target.value.split('_');
              const sortDir = parts.pop() as 'asc' | 'desc';
              const sortBy = parts.join('_');
              setFilters({ ...filters, sort_by: sortBy, sort_dir: sortDir });
            }}
            options={sortOptions}
          />
        </FilterPanel.Grid>
      </FilterPanel>

      {/* Content */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="list" count={5} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки сотрудников"
          onRetry={() => refetch()}
        />
      ) : usersData?.data.length === 0 ? (
        <EmptyState
          icon={<UserIcon />}
          title="Сотрудники не найдены"
          description={hasActiveFilters
            ? 'Попробуйте изменить фильтры для поиска сотрудников'
            : 'Добавьте первого сотрудника для начала работы'}
          action={permissions.canCreateUsers && !hasActiveFilters ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={handleCreate}>
              Добавить сотрудника
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Card.Body className="space-y-4">
                {usersData?.data.map((user) => (
                  <div key={user.id} className={`p-4 sm:p-5 rounded-xl border hover:shadow-sm transition-all bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(user.role)}`}>
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>

                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="text-left cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-accent-500 rounded"
                            >
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {user.full_name}
                              </h3>
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.login}</p>
                          </div>
                        </div>

                        <RoleBadge role={user.role} showDescription />

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{formatPhoneNumber(user.phone_number || user.phone)}</span>
                          </div>
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate" title={getDealershipsDisplay(user)}>
                              {getDealershipsDisplay(user)}
                            </span>
                          </div>

                        </div>
                      </div>

                      {permissions.canCreateUsers && (
                        <div className="flex flex-col gap-2">
                          {(!permissions.isOwner && (user.role === 'owner' || user.role === 'manager')) || user.id === currentUser?.id ? null : (
                            <ActionButtons
                              onEdit={() => handleEdit(user)}
                              onDelete={() => handleDelete(user)}
                              isDeleting={deleteMutation.isPending}
                              showDuplicate={false}
                            />
                          )}

                          {/* Quick Role Change - Prevent for self */}
                          {currentUser?.role === 'owner' && user.id !== currentUser?.id && (
                            <Select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              options={roleOptions.filter(r => r.value !== '')}
                              selectSize="sm"
                              fullWidth={false}
                              className="min-w-[130px]"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Cards View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersData?.data.map((user) => (
                <div key={user.id} className={`p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${getAvatarColor(user.role)}`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>

                    </div>
                    {permissions.canCreateUsers && (
                      <>
                        {(!permissions.isOwner && (user.role === 'owner' || user.role === 'manager')) || user.id === currentUser?.id ? null : (
                          <ActionButtons
                            onEdit={() => handleEdit(user)}
                            onDelete={() => handleDelete(user)}
                            isDeleting={deleteMutation.isPending}
                            showDuplicate={false}
                            size="sm"
                          />
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="text-left cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-accent-500 rounded w-full"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {user.full_name}
                      </h3>
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.login}</p>
                  </div>

                  <div className="mb-4">
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatPhoneNumber(user.phone_number || user.phone)}</span>
                    </div>
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate" title={getDealershipsDisplay(user)}>
                        {getDealershipsDisplay(user)}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {usersData && usersData.last_page && usersData.last_page > 1 && (
        <Pagination
          currentPage={page}
          totalPages={usersData.last_page}
          total={usersData.total}
          perPage={usersData.per_page}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />

      <UserDetailsModal
        isOpen={!!detailsUser}
        onClose={() => setDetailsUser(null)}
        user={detailsUser}
        onEdit={(user) => {
          setDetailsUser(null);
          handleEdit(user);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={`Удалить пользователя "${confirmDelete?.full_name}"?`}
        message="Это действие нельзя отменить"
        variant="danger"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
