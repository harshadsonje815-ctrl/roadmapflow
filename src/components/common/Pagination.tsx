import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
  showItemCount?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  showItemCount = true,
}) => {
  if (totalPages <= 1) return null;

  // Calculate range of page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const leftThreshold = Math.max(2, page - 1);
      const rightThreshold = Math.min(totalPages - 1, page + 1);

      if (leftThreshold > 2) {
        pages.push('ellipsis');
      }

      for (let i = leftThreshold; i <= rightThreshold; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (rightThreshold < totalPages - 1) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min((page - 1) * pageSize + 1, totalItems)
    : undefined;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(page * pageSize, totalItems)
    : undefined;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200/80 text-xs text-slate-500 ${className}`}
    >
      {/* Item count summary */}
      {showItemCount && (
        <div>
          {startItem !== undefined && endItem !== undefined && totalItems !== undefined ? (
            <p className="font-medium">
              Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
              <span className="font-bold text-slate-800">{endItem}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> proposals
            </p>
          ) : (
            <p className="font-medium">
              Showing page <span className="font-bold text-slate-800">{page}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </p>
          )}
        </div>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          id="btn-pagination-prev-control"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Number Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 select-none"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 inline" />
                </span>
              );
            }

            const isActive = p === page;
            return (
              <button
                key={p}
                id={`btn-pagination-page-${p}`}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          id="btn-pagination-next-control"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
