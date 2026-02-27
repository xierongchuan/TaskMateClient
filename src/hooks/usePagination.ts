import { useNotificationConfig } from './useSettings';
import { useAuth } from './useAuth';

export const usePagination = () => {
  const { user } = useAuth();
  // Pass undefined if dealership_id is null/undefined to match hook signature or fix it
  const dealershipId = user?.dealership_id ?? undefined;
  const { data: notificationConfig } = useNotificationConfig(dealershipId);

  // Default to 10 rows per page
  const limit = notificationConfig?.data?.rows_per_page || 10;

  return { limit };
};
