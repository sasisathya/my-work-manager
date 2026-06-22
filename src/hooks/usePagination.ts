'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * usePagination Hook - Handle pagination logic
 *
 * Manages:
 * - Current page
 * - Items per page
 * - Total items
 * - Previous/Next navigation
 *
 * Usage:
 * const {
 *   currentPage,
 *   pageSize,
 *   total,
 *   totalPages,
 *   startIndex,
 *   endIndex,
 *   paginatedItems,
 *   goToPage,
 *   nextPage,
 *   prevPage
 * } = usePagination(items, { pageSize: 10 });
 *
 * return (
 *   <>
 *     {paginatedItems.map((item) => <Item key={item.id} {...item} />)}
 *     <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
 *     <span>Page {currentPage} of {totalPages}</span>
 *     <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
 *   </>
 * );
 */

export interface PaginationOptions {
  pageSize?: number; // Items per page (default: 10)
  initialPage?: number; // Starting page (default: 1)
}

export function usePagination<T>(items: T[], options: PaginationOptions = {}) {
  const { pageSize = 10, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate pagination values
  const pagination = useMemo(() => {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Ensure current page is within bounds
    const validPage = Math.min(currentPage, totalPages);

    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage: validPage,
      pageSize,
      total,
      totalPages,
      startIndex,
      endIndex,
      paginatedItems,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1,
    };
  }, [items, pageSize, currentPage]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [pagination.hasPrevPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(pagination.totalPages);
  }, [pagination.totalPages]);

  return {
    currentPage: pagination.currentPage,
    pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages,
    startIndex: pagination.startIndex,
    endIndex: pagination.endIndex,
    paginatedItems: pagination.paginatedItems,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
  };
}
