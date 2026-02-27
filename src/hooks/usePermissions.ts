import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();

  // Permissions based on updated security requirements
  const canCreateUsers = user?.role === 'manager' || user?.role === 'owner';
  const canEditUsers = user?.role === 'manager' || user?.role === 'owner';
  const canDeleteUsers = user?.role === 'manager' || user?.role === 'owner';
  const canManageTasks = user?.role === 'manager' || user?.role === 'owner';

  // Settings are now restricted to Owner only
  const canManageSettings = user?.role === 'owner';
  const canManageDealerships = user?.role === 'owner';

  // Dealership-specific settings - Owner only
  const canManageDealershipSettings = user?.role === 'owner';
  const canManageGlobalSettings = user?.role === 'owner';

  // Check if user can manage settings for specific dealership
  const canManageDealershipSettingsFor = (_dealershipId: number) => {
    return user?.role === 'owner';
  };

  // Shift work via admin panel - Owner and Employee can work with shifts
  const canWorkShifts = user?.role === 'owner' || user?.role === 'employee';

  // Employees can complete tasks assigned to them
  const canCompleteAssignedTasks = user?.role !== 'observer';

  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const isObserver = user?.role === 'observer';
  const isEmployee = user?.role === 'employee';

  // Delegation permissions
  const canDelegateTasks = user?.role === 'employee';
  const canCancelDelegations = user?.role === 'manager' || user?.role === 'owner';

  return {
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManageTasks,
    canManageSettings,
    canManageDealerships,
    canManageDealershipSettings,
    canManageGlobalSettings,
    canManageDealershipSettingsFor,
    canWorkShifts,
    canCompleteAssignedTasks,
    canDelegateTasks,
    canCancelDelegations,
    isOwner,
    isManager,
    isObserver,
    isEmployee,
    role: user?.role,
    userId: user?.id,
    dealershipId: user?.dealership_id,
  };
};
