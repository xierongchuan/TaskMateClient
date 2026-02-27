import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

export interface TagProps {
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({ label, className = '', size = 'sm' }) => {
  const baseClasses = 'inline-flex items-center rounded bg-accent-100 text-accent-700 dark:bg-gray-700 dark:text-accent-300';

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs', // Keep text-xs for both as they are tags
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      <TagIcon className={`${iconSizes[size]} mr-1`} />
      {label}
    </span>
  );
};
