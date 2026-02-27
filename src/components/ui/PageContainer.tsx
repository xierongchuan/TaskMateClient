import React from 'react';

export type PageContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: PageContainerMaxWidth;
  className?: string;
  padding?: boolean;
}

const maxWidthClasses: Record<PageContainerMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

/**
 * Унифицированный контейнер страницы.
 *
 * @example
 * <PageContainer maxWidth="7xl">
 *   <PageHeader ... />
 *   {content}
 * </PageContainer>
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '7xl',
  className = '',
  padding = true,
}) => {
  const containerClasses = [
    maxWidthClasses[maxWidth],
    'mx-auto',
    padding ? 'px-4 sm:px-6 lg:px-8 py-6' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};
