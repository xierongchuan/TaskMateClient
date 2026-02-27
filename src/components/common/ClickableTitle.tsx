import React from 'react';

interface ClickableTitleProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const ClickableTitle: React.FC<ClickableTitleProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left cursor-pointer hover:text-accent-600 dark:hover:text-accent-400 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-accent-500 rounded ${className}`}
    >
      <span className="font-medium text-gray-900 dark:text-white">
        {children}
      </span>
    </button>
  );
};
