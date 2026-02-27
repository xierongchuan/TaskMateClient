import React, { useState } from 'react';
import type { Dealership } from '../types/dealership';
import { DealershipForm } from '../components/dealerships/DealershipForm';
import { DealershipList } from '../components/dealerships/DealershipList';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '../hooks/usePermissions';

// UI Components
import { PageContainer, PageHeader, Card, Button } from '../components/ui';

export const DealershipsPage: React.FC = () => {
  const { canManageDealerships } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDealership, setEditingDealership] = useState<Dealership | undefined>();

  const handleCreateDealership = () => {
    setEditingDealership(undefined);
    setIsFormOpen(true);
  };

  const handleEditDealership = (dealership: Dealership) => {
    setEditingDealership(dealership);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDealership(undefined);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDealership(undefined);
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Автосалоны"
        description="Управление автосалонами вашей компании"
      >
        {canManageDealerships && (
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleCreateDealership}
          >
            Создать автосалон
          </Button>
        )}
      </PageHeader>

      {/* Form View */}
      {isFormOpen && (
        <Card className="mb-8">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingDealership ? 'Редактировать автосалон' : 'Создать новый автосалон'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingDealership
                    ? 'Обновите информацию об автосалоне'
                    : 'Заполните информацию о новом автосалоне'
                  }
                </p>
              </div>
              <button
                onClick={handleFormClose}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            <DealershipForm
              dealership={editingDealership}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </Card.Body>
        </Card>
      )}

      {/* List View */}
      <DealershipList onEdit={handleEditDealership} />
    </PageContainer>
  );
};
