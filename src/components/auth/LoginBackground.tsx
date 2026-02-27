import React from 'react';

/**
 * Анимированный фон для страницы логина.
 * Содержит mesh gradient блобы и геометрический паттерн.
 */
export const LoginBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated mesh gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Geometric pattern overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="login-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 60"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#login-grid)"
          className="text-gray-900 dark:text-white"
        />
      </svg>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent dark:from-gray-900/60" />
    </div>
  );
};
