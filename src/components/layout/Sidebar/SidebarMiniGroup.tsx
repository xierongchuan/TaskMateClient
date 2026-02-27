import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SidebarItem } from './SidebarItem';
import { SidebarTooltip } from './SidebarTooltip';
import type { NavGroup, NavItem } from '../../../types/navigation';

interface SidebarMiniGroupProps {
  group: NavGroup;
  isItemActive: (item: NavItem) => boolean;
  onItemClick: () => void;
}

export const SidebarMiniGroup: React.FC<SidebarMiniGroupProps> = ({
  group,
  isItemActive,
  onItemClick,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { title, icon: GroupIcon, items } = group;
  const hasActiveItem = items.some(isItemActive);
  const hasBadge = items.some((item) => item.badge !== undefined);

  const openPopover = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Рассчитываем позицию с учетом границ экрана
      let top = rect.top;
      const popoverHeight = items.length * 44 + 40; // примерная высота

      if (top + popoverHeight > viewportHeight - 20) {
        top = viewportHeight - popoverHeight - 20;
      }

      setPopoverPosition({
        top: Math.max(20, top),
        left: rect.right + 8,
      });
      setIsPopoverOpen(true);
    }
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  // Закрытие при клике вне popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closePopover();
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Закрытие при нажатии Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover();
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen]);

  const handleItemClick = () => {
    closePopover();
    onItemClick();
  };

  return (
    <div className="px-3">
      <SidebarTooltip content={title} disabled={isPopoverOpen}>
        <button
          ref={buttonRef}
          onClick={openPopover}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
            ${hasActiveItem || isPopoverOpen
              ? 'bg-white dark:bg-gray-800 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          aria-expanded={isPopoverOpen}
          aria-haspopup="true"
        >
          <GroupIcon className="w-5 h-5" />
          {hasBadge && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </SidebarTooltip>

      {isPopoverOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="
              fixed z-[100] min-w-[200px] py-2 px-2
              bg-white dark:bg-gray-900
              rounded-xl shadow-xl
              ring-1 ring-gray-200 dark:ring-gray-700
              animate-in fade-in-0 slide-in-from-left-2 duration-150
            "
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
          >
            <div className="px-3 py-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {title}
            </div>
            <ul className="space-y-1">
              {items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={isItemActive(item)}
                  onClick={handleItemClick}
                />
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
};
