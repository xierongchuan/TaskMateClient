import React from 'react';
import { SidebarMiniGroup } from './SidebarMiniGroup';
import { SidebarItem } from './SidebarItem';
import { SidebarHeader } from './SidebarHeader';
import { SidebarTooltip } from './SidebarTooltip';
import type { NavGroup, NavItem } from '../../../types/navigation';

interface SidebarMiniProps {
  groups: NavGroup[];
  onToggleMode: () => void;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: () => void;
}

export const SidebarMini: React.FC<SidebarMiniProps> = ({
  groups,
  onToggleMode,
  isItemActive,
  onItemClick,
}) => {
  return (
    <aside
      className="
        fixed lg:static top-0 left-0 z-50
        w-16 flex-shrink-0 flex flex-col
        bg-white dark:bg-gray-900
        lg:bg-gray-50/80 lg:dark:bg-gray-900/95 lg:backdrop-blur-sm
        border-r border-gray-200 dark:border-gray-800
        transition-all duration-200
      "
      style={{ height: 'var(--viewport-height)' }}
    >
      <SidebarHeader
        mode="mini"
        onToggleMode={onToggleMode}
        onClose={() => {}}
        isMobile={false}
      />

      <nav className="flex-1 pt-4 overflow-y-auto" style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}>
        <div className="space-y-4">
          {groups.map((group) => {
            // Если группа не сворачиваемая и имеет мало элементов,
            // показываем элементы напрямую
            if (!group.collapsible && group.items.length <= 2) {
              return (
                <div key={group.id} className="space-y-1 px-3">
                  {group.items.map((item) => (
                    <SidebarTooltip key={item.id} content={item.label}>
                      <SidebarItem
                        item={item}
                        isActive={isItemActive(item)}
                        onClick={onItemClick}
                        compact
                      />
                    </SidebarTooltip>
                  ))}
                </div>
              );
            }

            // Для сворачиваемых групп или с многими элементами - popover
            return (
              <SidebarMiniGroup
                key={group.id}
                group={group}
                isItemActive={isItemActive}
                onItemClick={onItemClick}
              />
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
