import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) => {
    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // How many buttons to show at once

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Complex logic to show "1 ... 4 5 6 ... 10" style
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col md:flex-row justify-between items-center py-4 space-y-3 md:space-y-0 text-xs text-gray-600">
            <div>
                Showing page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span> ({totalItems} Entries)
            </div>

            <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                >
                    Prev
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                    {getPageNumbers().map((p, index) => (
                        <button
                            key={index}
                            onClick={() => typeof p === 'number' && onPageChange(p)}
                            disabled={p === '...'}
                            className={`px-3 py-1 border rounded transition-colors ${p === currentPage
                                ? 'bg-green-500 text-white border-green-500'
                                : p === '...'
                                    ? 'bg-transparent border-none cursor-default'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border rounded transition-colors ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};