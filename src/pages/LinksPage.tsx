import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksApi } from '../api/links';
import { usePermissions } from '../hooks/usePermissions';
import { useResponsiveViewMode } from '../hooks/useResponsiveViewMode';
import { usePagination } from '../hooks/usePagination';
import type { Link, CreateLinkRequest } from '../types/link';
import {
  PlusIcon,
  LinkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Унифицированные компоненты
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  ViewModeToggle,
  SearchInput,
  Pagination,
  Skeleton,
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  Card,
  Modal,
  ConfirmDialog,
  FormField,
} from '../components/ui';
import { ActionButtons } from '../components/common';

export const LinksPage: React.FC = () => {
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  const { limit } = usePagination();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode('grid', 'grid', 768, 'view_mode_links');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Link | null>(null);
  const [formData, setFormData] = useState<CreateLinkRequest>({
    title: '',
    url: '',
    description: '',
    category: 'general',
  });

  // Reset page on search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const { data: linksData, isLoading, error, refetch } = useQuery({
    queryKey: ['links', page, limit, searchTerm],
    queryFn: () => linksApi.getLinks({
      page,
      per_page: limit,
      search: searchTerm
    }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLinkRequest) => linksApi.createLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateLinkRequest }) =>
      linksApi.updateLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => linksApi.deleteLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      setConfirmDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({ title: '', url: '', description: '', category: 'general' });
    setSelectedLink(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crm': return <UserGroupIcon className="w-6 h-6" />;
      case 'documents': return <DocumentTextIcon className="w-6 h-6" />;
      case 'analytics': return <ChartBarIcon className="w-6 h-6" />;
      case 'tools': return <Squares2X2Icon className="w-6 h-6" />;
      default: return <GlobeAltIcon className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crm': return 'bg-blue-500';
      case 'documents': return 'bg-green-500';
      case 'analytics': return 'bg-purple-500';
      case 'tools': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'crm': return 'CRM';
      case 'documents': return 'Документы';
      case 'analytics': return 'Аналитика';
      case 'tools': return 'Инструменты';
      default: return 'Общее';
    }
  };

  // Grouping logic
  const groupedLinks = (linksData?.data || []).reduce((acc, link) => {
    const category = link.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, Link[]>);

  const handleCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (link: Link) => {
    setSelectedLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      category: link.category || 'general',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (link: Link) => {
    setConfirmDelete(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLink) {
      updateMutation.mutate({ id: selectedLink.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const categoryOptions = [
    { value: 'general', label: 'Общее' },
    { value: 'crm', label: 'CRM' },
    { value: 'documents', label: 'Документы' },
    { value: 'analytics', label: 'Аналитика' },
    { value: 'tools', label: 'Инструменты' },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Ссылки"
        description="Важные ссылки для быстрого доступа к рабочим инструментам"
      >
        {!isMobile && (
          <ViewModeToggle
            mode={viewMode}
            onChange={(mode) => setViewMode(mode as 'grid' | 'list')}
            options={[
              { value: 'list', icon: <ListBulletIcon />, label: 'Список' },
              { value: 'grid', icon: <Squares2X2Icon />, label: 'Карточки' },
            ]}
          />
        )}
        {permissions.canManageTasks && (
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleCreate}
          >
            Добавить ссылку
          </Button>
        )}
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск ссылок..."
          debounceMs={500}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <Card.Body>
            <Skeleton variant="card" count={6} />
          </Card.Body>
        </Card>
      ) : error ? (
        <ErrorState
          title="Ошибка загрузки ссылок"
          onRetry={() => refetch()}
        />
      ) : linksData?.data.length === 0 ? (
        <EmptyState
          icon={<LinkIcon />}
          title={searchTerm ? 'Ссылки не найдены' : 'Нет ссылок'}
          description={searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первые ссылки для быстрого доступа'}
          action={permissions.canManageTasks && !searchTerm ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={handleCreate}>
              Добавить ссылку
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* Grid View with Categories */}
          {viewMode === 'grid' && (
            <div className="space-y-8">
              {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
                <div key={category}>
                  <div className="flex items-center mb-4">
                    <div className={`${getCategoryColor(category)} rounded-xl p-2 mr-3 text-white`}>
                      {getCategoryIcon(category)}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getCategoryLabel(category)}
                    </h2>
                    <Badge variant="gray" className="ml-3">
                      {(categoryLinks as Link[]).length} ссылок
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(categoryLinks as Link[]).map((link) => (
                      <Card key={link.id} hover className="group">
                        <Card.Body>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className={`${getCategoryColor(link.category || 'general')} rounded-xl p-2 mr-3 text-white`}>
                                {getCategoryIcon(link.category || 'general')}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                                  {link.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                  {new URL(link.url).hostname}
                                </p>
                              </div>
                            </div>
                            {permissions.canManageTasks && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionButtons
                                  onEdit={() => handleEdit(link)}
                                  onDelete={() => handleDelete(link)}
                                  showDuplicate={false}
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>
                          {link.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {link.description}
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            icon={<ArrowTopRightOnSquareIcon />}
                            onClick={() => openLink(link.url)}
                            fullWidth
                            className="bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-gray-700 dark:text-accent-300 dark:hover:bg-gray-600"
                          >
                            Открыть
                          </Button>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Card.Body className="space-y-4">
                {linksData?.data.map((link) => (
                  <div key={link.id} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-sm hover:border-accent-200 dark:hover:border-accent-500 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0 pr-4">
                        <div className={`${getCategoryColor(link.category || 'general')} rounded-xl p-3 mr-4 text-white flex-shrink-0`}>
                          {getCategoryIcon(link.category || 'general')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {link.title}
                            </h3>
                            <Badge variant="gray">
                              {getCategoryLabel(link.category || 'general')}
                            </Badge>
                          </div>
                          {link.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{link.description}</p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new URL(link.url).hostname}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          icon={<EyeIcon />}
                          onClick={() => openLink(link.url)}
                          className="bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-gray-700 dark:text-accent-300 dark:hover:bg-gray-600"
                        >
                          Открыть
                        </Button>
                        {permissions.canManageTasks && (
                          <ActionButtons
                            onEdit={() => handleEdit(link)}
                            onDelete={() => handleDelete(link)}
                            showDuplicate={false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Pagination */}
          {linksData && linksData.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={linksData.last_page}
              onPageChange={setPage}
              total={linksData.total}
              perPage={limit}
              showInfo
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLink ? 'Редактировать ссылку' : 'Добавить ссылку'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <FormField label="Название" required>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="URL" required>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
              </FormField>

              <FormField label="Категория">
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categoryOptions}
                />
              </FormField>

              <FormField label="Описание">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание ссылки..."
                  rows={3}
                />
              </FormField>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedLink ? 'Сохранить' : 'Создать'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={`Удалить ссылку "${confirmDelete?.title}"?`}
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
