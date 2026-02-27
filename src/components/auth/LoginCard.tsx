import React from 'react';

interface LoginCardProps {
  children: React.ReactNode;
}

/**
 * Glass morphism карточка для формы логина.
 */
export const LoginCard: React.FC<LoginCardProps> = ({ children }) => {
  return (
    <div className="w-full max-w-md px-4">
      <div className="glass-card rounded-2xl p-8 animate-card-entrance">
        {children}
      </div>
    </div>
  );
};
