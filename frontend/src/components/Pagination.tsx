import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    zeroIndexed?: boolean;
    style?: React.CSSProperties;
    className?: string;
    maxButtons?: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalCount,
    onPageChange,
    zeroIndexed = false,
    style,
    className = "",
    maxButtons = 10
}) => {
    // Current logical page (always 0-indexed for calculation)
    const logicalPage = zeroIndexed ? currentPage : currentPage - 1;

    // Normalize totalPages to be at least 1
    const safeTotalPages = Math.max(1, totalPages);

    const currentBlock = Math.floor(logicalPage / maxButtons);
    const startPage = currentBlock * maxButtons;
    const endPage = Math.min(startPage + maxButtons - 1, safeTotalPages - 1);

    const handleFirst = () => onPageChange(zeroIndexed ? 0 : 1);
    const handlePrev = () => onPageChange(zeroIndexed ? Math.max(0, logicalPage - 1) : Math.max(1, logicalPage));
    const handleNext = () => onPageChange(zeroIndexed ? Math.min(safeTotalPages - 1, logicalPage + 1) : Math.min(safeTotalPages, logicalPage + 2));
    const handleLast = () => onPageChange(zeroIndexed ? safeTotalPages - 1 : safeTotalPages);

    const buttons = [];
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(
            <button
                key={i}
                onClick={() => onPageChange(zeroIndexed ? i : i + 1)}
                className={`pagination-page-btn ${logicalPage === i ? 'active' : ''}`}
            >
                {i + 1}
            </button>
        );
    }

    return (
        <div className={`pagination-container ${className}`} style={style}>
            <div className="pagination-total">
                총 <span>{totalCount}</span>건
            </div>

            <div className="pagination-controls">
                <button
                    disabled={logicalPage === 0}
                    onClick={handleFirst}
                    className="pagination-nav-btn"
                >
                    맨앞
                </button>
                <button
                    disabled={logicalPage === 0}
                    onClick={handlePrev}
                    className="pagination-nav-btn"
                >
                    이전
                </button>

                <div className="pagination-pages">
                    {buttons}
                </div>

                <button
                    disabled={logicalPage >= safeTotalPages - 1}
                    onClick={handleNext}
                    className="pagination-nav-btn"
                >
                    다음
                </button>
                <button
                    disabled={logicalPage >= safeTotalPages - 1}
                    onClick={handleLast}
                    className="pagination-nav-btn"
                >
                    맨뒤
                </button>
            </div>
            <div className="pagination-spacer"></div>
        </div>
    );
};

export default Pagination;
