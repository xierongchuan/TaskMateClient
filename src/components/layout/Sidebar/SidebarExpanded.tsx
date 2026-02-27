import React from 'react';
import { SidebarGroup } from './SidebarGroup';
import { SidebarHeader } from './SidebarHeader';
import type { NavGroup, NavItem, NavGroupId, ExpandedGroups } from '../../../types/navigation';

interface SidebarExpandedProps {
  groups: NavGroup[];
  expandedGroups: ExpandedGroups;
  onToggleGroup: (groupId: NavGroupId) => void;
  onToggleMode: () => void;
  onClose: () => void;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: () => void;
  isMobile: boolean;
}

export const SidebarExpanded: React.FC<SidebarExpandedProps> = ({
  groups,
  expandedGroups,
  onToggleGroup,
  onToggleMode,
  onClose,
  isItemActive,
  onItemClick,
  isMobile,
}) => {
  return (
    <aside
      className={`
        fixed lg:static top-0 left-0 z-50
        w-64 flex-shrink-0 flex flex-col
        bg-white dark:bg-gray-900
        lg:bg-gray-50/80 lg:dark:bg-gray-900/95 lg:backdrop-blur-sm
        border-r border-gray-200 dark:border-gray-800
        transition-all duration-200
      `}
      style={{ height: 'var(--viewport-height)' }}
    >
      <SidebarHeader
        mode="expanded"
        onToggleMode={onToggleMode}
        onClose={onClose}
        isMobile={isMobile}
      />

      <nav className="flex-1 pt-4 overflow-y-auto" style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}>
        <div className="space-y-2">
          {groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              isExpanded={expandedGroups[group.id]}
              onToggle={() => onToggleGroup(group.id)}
              isItemActive={isItemActive}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
};
