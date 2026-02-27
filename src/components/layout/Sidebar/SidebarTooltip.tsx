import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  content: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  content,
  children,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        });
        setIsVisible(true);
      }
    }, 300);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            className="
              fixed z-[100] px-2.5 py-1.5 text-sm font-medium
              bg-gray-900 dark:bg-gray-700 text-white
              rounded-lg shadow-lg pointer-events-none
              transform -translate-y-1/2
              animate-in fade-in-0 zoom-in-95 duration-150
            "
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {content}
            <div
              className="
                absolute top-1/2 -left-1 -translate-y-1/2
                w-2 h-2 bg-gray-900 dark:bg-gray-700
                rotate-45
              "
            />
          </div>,
          document.body
        )}
    </>
  );
};
