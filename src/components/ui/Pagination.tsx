import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  perPage?: number;
  showInfo?: boolean;
  className?: string;
}

/**
 * Унифицированный компонент пагинации.
 *
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={data.last_page}
 *   onPageChange={setPage}
 *   showInfo={true}
 *   total={data.total}
 *   perPage={data.per_page}
 * />
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  total,
  perPage,
  showInfo = true,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startItem = perPage ? (currentPage - 1) * perPage + 1 : null;
  const endItem = perPage && total ? Math.min(currentPage * perPage, total) : null;

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1; // Number of pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - delta - 1 ||
        i === currentPage + delta + 1
      ) {
        pages.push('ellipsis');
      }
    }

    // Remove duplicate ellipsis
    return pages.filter((page, index, arr) => {
      if (page === 'ellipsis') {
        return arr[index - 1] !== 'ellipsis';
      }
      return true;
    });
  };

  const visiblePages = getVisiblePages();

  const baseButtonClasses = 'relative inline-flex items-center px-2 py-2 text-sm font-medium transition-colors focus:z-20 focus:outline-offset-0 disabled:opacity-50';
  const activeClasses = 'z-10 bg-accent-600 text-white focus:ring-2 focus:ring-offset-2 focus:ring-accent-500';
  const inactiveClasses = 'text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800';

  return (
    <div className={`flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 ${className}`}>
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Назад
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Вперед
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {showInfo && startItem && endItem && total && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Показано с <span className="font-medium">{startItem}</span> по{' '}
              <span className="font-medium">{endItem}</span> из{' '}
              <span className="font-medium">{total}</span> результатов
            </p>
          </div>
        )}

        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`${baseButtonClasses} ${inactiveClasses} rounded-l-md`}
            >
              <span className="sr-only">Назад</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page numbers */}
            {visiblePages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`${baseButtonClasses} px-4 ${currentPage === page ? activeClasses : inactiveClasses
                    }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`${baseButtonClasses} ${inactiveClasses} rounded-r-md`}
            >
              <span className="sr-only">Вперед</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
