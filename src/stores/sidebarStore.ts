import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NavGroupId, SidebarMode, ExpandedGroups } from '../types/navigation';
import { createZustandStorage } from '../platform/storage/zustand';

interface SidebarState {
  /** Режим отображения сайдбара (expanded/mini) */
  mode: SidebarMode;
  /** Сайдбар открыт (для мобильных) */
  isOpen: boolean;
  /** Состояние сворачивания групп */
  expandedGroups: ExpandedGroups;

  /** Переключить режим expanded/mini */
  toggleMode: () => void;
  /** Установить режим */
  setMode: (mode: SidebarMode) => void;
  /** Переключить состояние группы */
  toggleGroup: (groupId: NavGroupId) => void;
  /** Установить состояние группы */
  setGroupExpanded: (groupId: NavGroupId, expanded: boolean) => void;
  /** Развернуть все группы */
  expandAll: () => void;
  /** Свернуть все группы */
  collapseAll: () => void;
  /** Открыть/закрыть сайдбар (для мобильных) */
  setOpen: (open: boolean) => void;
  /** Переключить сайдбар */
  toggleSidebar: () => void;
}

const DEFAULT_EXPANDED: ExpandedGroups = {
  'workspace': true,        // Всегда развёрнута
  'task-management': true,  // По умолчанию развёрнута
  'organization': true,     // По умолчанию развёрнута
  'resources': true,        // Всегда развёрнута (не collapsible)
  'administration': false,  // По умолчанию свёрнута (реже используется)
};

const ALL_GROUP_IDS: NavGroupId[] = [
  'workspace',
  'task-management',
  'organization',
  'resources',
  'administration',
];

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      mode: 'expanded',
      isOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
      expandedGroups: DEFAULT_EXPANDED,

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'expanded' ? 'mini' : 'expanded',
        })),

      setMode: (mode) => set({ mode }),

      toggleGroup: (groupId) =>
        set((state) => ({
          expandedGroups: {
            ...state.expandedGroups,
            [groupId]: !state.expandedGroups[groupId],
          },
        })),

      setGroupExpanded: (groupId, expanded) =>
        set((state) => ({
          expandedGroups: {
            ...state.expandedGroups,
            [groupId]: expanded,
          },
        })),

      expandAll: () =>
        set({
          expandedGroups: ALL_GROUP_IDS.reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as ExpandedGroups
          ),
        }),

      collapseAll: () =>
        set({
          expandedGroups: ALL_GROUP_IDS.reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {} as ExpandedGroups
          ),
        }),

      setOpen: (open) => set({ isOpen: open }),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'sidebar-storage',
      storage: createZustandStorage(),
      partialize: (state) => ({
        mode: state.mode,
        expandedGroups: state.expandedGroups,
      }),
    }
  )
);
