import React, { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { createNavigationConfig } from '../../../config/navigation';
import { SidebarExpanded } from './SidebarExpanded';
import { SidebarMini } from './SidebarMini';
import type { NavGroup, NavItem } from '../../../types/navigation';

export const Sidebar: React.FC = () => {
  const permissions = usePermissions();
  const location = useLocation();
  const {
    mode,
    isOpen,
    expandedGroups,
    toggleMode,
    toggleGroup,
    setGroupExpanded,
    setOpen,
  } = useSidebarStore();

  // Отслеживаем размер экрана реактивно
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  // Слушаем изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      const wasMobile = isMobile;
      setIsMobile(mobile);

      // При переходе с мобильного на десктоп — автоматически открываем сайдбар
      if (wasMobile && !mobile && !isOpen) {
        setOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isOpen, setOpen]);

  // Мемоизируем конфигурацию навигации
  const navigationConfig = useMemo(
    () =>
      createNavigationConfig({
        canManageTasks: permissions.canManageTasks,
        canCreateUsers: permissions.canCreateUsers,
        isObserver: permissions.isObserver,
        isOwner: permissions.isOwner,
      }),
    [
      permissions.canManageTasks,
      permissions.canCreateUsers,
      permissions.isObserver,
      permissions.isOwner,
    ]
  );

  // Фильтруем группы и элементы по видимости
  const visibleGroups = useMemo(() => {
    return navigationConfig.groups
      .map((group): NavGroup | null => {
        // Фильтруем элементы внутри группы
        const visibleItems = group.items.filter(
          (item) => item.visible === undefined || item.visible
        );

        // Проверяем видимость группы
        const groupVisible =
          group.visible === undefined ? visibleItems.length > 0 : group.visible;

        if (!groupVisible || visibleItems.length === 0) {
          return null;
        }

        return { ...group, items: visibleItems };
      })
      .filter((group): group is NavGroup => group !== null);
  }, [navigationConfig]);

  // Определяем активный путь для подсветки
  const isItemActive = (item: NavItem): boolean => {
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  // Автоматическое разворачивание группы с активным элементом
  useEffect(() => {
    const activeGroup = visibleGroups.find((group) =>
      group.items.some(isItemActive)
    );

    if (activeGroup && !expandedGroups[activeGroup.id] && activeGroup.collapsible) {
      setGroupExpanded(activeGroup.id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Закрытие на мобильных при навигации
  const handleItemClick = () => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  // На мобильных всегда показываем expanded mode
  const effectiveMode = isMobile ? 'expanded' : mode;

  return (
    <>
      {/* Overlay для мобильных */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={handleClose}
        />
      )}

      {effectiveMode === 'expanded' ? (
        <SidebarExpanded
          groups={visibleGroups}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onToggleMode={toggleMode}
          onClose={handleClose}
          isItemActive={isItemActive}
          onItemClick={handleItemClick}
          isMobile={isMobile}
        />
      ) : (
        <SidebarMini
          groups={visibleGroups}
          onToggleMode={toggleMode}
          isItemActive={isItemActive}
          onItemClick={handleItemClick}
        />
      )}
    </>
  );
};
