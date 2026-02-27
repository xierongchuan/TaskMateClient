import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  CogIcon,
  ArchiveBoxIcon,
  ClockIcon,
  UsersIcon,
  LinkIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  Squares2X2Icon,
  FolderIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import type { NavGroup, NavigationConfig } from '../types/navigation';

export interface NavigationPermissions {
  canManageTasks: boolean;
  canCreateUsers: boolean;
  isObserver: boolean;
  isOwner: boolean;
}

/**
 * Создаёт конфигурацию навигации на основе permissions
 */
export const createNavigationConfig = (
  permissions: NavigationPermissions
): NavigationConfig => {
  const { canManageTasks, canCreateUsers, isObserver, isOwner } = permissions;

  const groups: NavGroup[] = [
    // Рабочая зона - доступна всем
    {
      id: 'workspace',
      title: 'Рабочая зона',
      icon: Squares2X2Icon,
      collapsible: false, // Всегда видна
      defaultExpanded: true,
      items: [
        {
          id: 'dashboard',
          path: '/dashboard',
          label: 'Dashboard',
          icon: HomeIcon,
        },
        {
          id: 'tasks',
          path: '/tasks',
          label: 'Задачи',
          icon: ClipboardDocumentListIcon,
        },
        {
          id: 'my-history',
          path: '/my-history',
          label: 'Моя история',
          icon: ClockIcon,
        },
        {
          id: 'shifts',
          path: '/shifts',
          label: 'Смены',
          icon: BriefcaseIcon,
        },
      ],
    },

    // Управление задачами - только manager/owner
    {
      id: 'task-management',
      title: 'Управление задачами',
      icon: FolderIcon,
      collapsible: true,
      defaultExpanded: true,
      visible: canManageTasks,
      items: [
        {
          id: 'generators',
          path: '/task-generators',
          label: 'Генераторы',
          icon: CogIcon,
        },
        {
          id: 'pending-review',
          path: '/pending-review',
          label: 'На проверке',
          icon: ClipboardDocumentCheckIcon,
          // badge будет добавлен динамически
        },
        {
          id: 'archive',
          path: '/archived-tasks',
          label: 'Архив',
          icon: ArchiveBoxIcon,
        },
      ],
    },

    // Организация - manager/owner + observer (только сотрудники)
    {
      id: 'organization',
      title: 'Организация',
      icon: BuildingOfficeIcon,
      collapsible: true,
      defaultExpanded: true,
      visible: canCreateUsers || isObserver,
      items: [
        {
          id: 'employees',
          path: '/employees',
          label: 'Сотрудники',
          icon: UsersIcon,
          visible: canCreateUsers || isObserver,
        },
        {
          id: 'dealerships',
          path: '/dealerships',
          label: 'Автосалоны',
          icon: BuildingOfficeIcon,
          visible: canManageTasks,
        },
      ],
    },

    // Ресурсы - доступны всем
    {
      id: 'resources',
      title: 'Ресурсы',
      icon: LinkIcon,
      collapsible: false, // Один пункт - не нужно сворачивать
      defaultExpanded: true,
      items: [
        {
          id: 'links',
          path: '/links',
          label: 'Ссылки',
          icon: LinkIcon,
        },
      ],
    },

    // Администрирование - manager/owner (Аудит только owner)
    {
      id: 'administration',
      title: 'Администрирование',
      icon: WrenchScrewdriverIcon,
      collapsible: true,
      defaultExpanded: false, // По умолчанию свёрнута
      visible: canManageTasks,
      items: [
        {
          id: 'reports',
          path: '/reports',
          label: 'Отчёты',
          icon: ChartBarIcon,
        },
        {
          id: 'settings',
          path: '/settings',
          label: 'Настройки',
          icon: Cog6ToothIcon,
        },
        {
          id: 'audit',
          path: '/audit-logs',
          label: 'Аудит',
          icon: DocumentMagnifyingGlassIcon,
          visible: isOwner,
        },
      ],
    },
  ];

  return { groups };
};
