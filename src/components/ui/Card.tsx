import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlighted' | 'warning' | 'danger';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  highlighted: 'bg-accent-50 dark:bg-gray-800 border-accent-200 dark:border-accent-800/50',
  warning: 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-yellow-700',
  danger: 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-red-700',
};

/**
 * Универсальный компонент карточки.
 *
 * @example
 * <Card variant="default" hover>
 *   <Card.Header>Заголовок</Card.Header>
 *   <Card.Body>Контент</Card.Body>
 *   <Card.Footer>Действия</Card.Footer>
 * </Card>
 */
export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({
  children,
  className = '',
  hover = false,
  padding = 'none',
  variant = 'default',
  ...props
}) => {
    const cardClasses = [
      'rounded-xl shadow-sm border transition-all duration-200 overflow-hidden',
      variantClasses[variant],
      paddingClasses[padding],
      hover ? 'hover:shadow-md' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={cardClasses} {...props}>
        {children}
      </div>
    );
  };

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  border = true,
}) => {
  const headerClasses = [
    'p-4 sm:p-6',
    border ? 'border-b border-gray-200 dark:border-gray-700' : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={headerClasses}>{children}</div>;
};

const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  const bodyClasses = ['p-4 sm:p-6', className].filter(Boolean).join(' ');
  return <div className={bodyClasses}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  border = true,
}) => {
  const footerClasses = [
    'p-4 sm:p-6',
    border ? 'border-t border-gray-200 dark:border-gray-700' : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={footerClasses}>{children}</div>;
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
