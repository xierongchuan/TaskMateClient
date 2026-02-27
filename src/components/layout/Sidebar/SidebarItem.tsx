import React from 'react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '../../../types/navigation';

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  onClick,
  compact = false,
}) => {
  const { path, label, icon: Icon, badge } = item;

  if (compact) {
    return (
      <NavLink
        to={path}
        onClick={onClick}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
          ${isActive
            ? 'bg-white dark:bg-gray-800 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <div className="relative">
          <Icon className="w-5 h-5" />
          {badge !== undefined && (
            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </NavLink>
    );
  }

  return (
    <li>
      <NavLink
        to={path}
        onClick={onClick}
        className={`
          w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium
          rounded-lg transition-all duration-150
          ${isActive
            ? 'bg-white dark:bg-gray-800 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <div className="flex items-center">
          <Icon
            className={`w-5 h-5 mr-3 ${
              isActive
                ? 'text-accent-500 dark:text-accent-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span>{label}</span>
        </div>

        {badge !== undefined && (
          <span
            className="
              inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
              text-xs font-semibold rounded-full
              bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
            "
          >
            {badge}
          </span>
        )}
      </NavLink>
    </li>
  );
};
