import type { ComponentType } from 'react';

/**
 * Идентификатор группы навигации для хранения состояния сворачивания
 */
export type NavGroupId =
  | 'workspace'        // Рабочая зона
  | 'task-management'  // Управление задачами
  | 'organization'     // Организация
  | 'resources'        // Ресурсы
  | 'administration';  // Администрирование

/**
 * Режим отображения сайдбара
 */
export type SidebarMode = 'expanded' | 'mini';

/**
 * Элемент навигации (пункт меню)
 */
export interface NavItem {
  /** Уникальный идентификатор */
  id: string;
  /** URL путь */
  path: string;
  /** Отображаемое название */
  label: string;
  /** Иконка из Heroicons */
  icon: ComponentType<{ className?: string }>;
  /**
   * Условие видимости.
   * undefined = всегда видим
   * boolean = результат проверки прав
   */
  visible?: boolean;
  /** Badge для уведомлений (опционально) */
  badge?: number | string;
}

/**
 * Группа навигации (секция сайдбара)
 */
export interface NavGroup {
  /** Уникальный идентификатор группы */
  id: NavGroupId;
  /** Заголовок группы */
  title: string;
  /** Иконка группы (обязательно для mini-mode) */
  icon: ComponentType<{ className?: string }>;
  /** Элементы в группе */
  items: NavItem[];
  /**
   * Можно ли сворачивать группу
   * true = collapsible с иконкой chevron
   * false = всегда развёрнута (без заголовка-кнопки)
   */
  collapsible: boolean;
  /** Развёрнута по умолчанию */
  defaultExpanded: boolean;
  /**
   * Условие видимости всей группы
   * undefined = видима если есть хотя бы 1 видимый item
   */
  visible?: boolean;
}

/**
 * Конфигурация всей навигации
 */
export interface NavigationConfig {
  groups: NavGroup[];
}

/**
 * Состояние сворачивания групп (для Zustand store)
 */
export type ExpandedGroups = Record<NavGroupId, boolean>;
