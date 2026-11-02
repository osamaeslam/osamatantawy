import React, { useState, useCallback } from 'react';

interface UseProductPaginationProps {
  products: any[];
  pageSize: number;
  // Optional: initial page (default to 1)
  initialPage?: number;
}

export function useProductPagination({
  products,
  pageSize,
  initialPage = 1,
}: UseProductPaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  // Ensure currentPage is within valid range
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  // Get products for current page
  const paginatedProducts = useCallback(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return products.slice(startIndex, endIndex);
  }, [safeCurrentPage, pageSize, products]);

  // Go to next page
  const next = useCallback(() => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [safeCurrentPage, totalPages]);

  // Go to previous page
  const prev = useCallback(() => {
    if (safeCurrentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [safeCurrentPage]);

  // Go to specific page
  const goTo = useCallback((page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    if (pageNum !== safeCurrentPage) {
      setCurrentPage(pageNum);
    }
  }, [safeCurrentPage, totalPages]);

  // Get page numbers for display (show limited pages)
  const pageNumbers = useCallback(() => {
    const totalDisplay = 5; // Number of page numbers to show
    const current = safeCurrentPage;
    const total = totalPages;

    if (total <= totalDisplay) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Calculate start and end page numbers
    let startPage, endPage;

    if (current <= Math.ceil(totalDisplay / 2)) {
      startPage = 1;
      endPage = totalDisplay;
    } else if (current >= total - Math.floor(totalDisplay / 2)) {
      startPage = total - totalDisplay + 1;
      endPage = total;
    } else {
      startPage = current - Math.floor(totalDisplay / 2);
      endPage = current + Math.floor(totalDisplay / 2);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [safeCurrentPage, totalPages]);

  return {
    // State
    currentPage,
    totalPages,
    safeCurrentPage,
    productsCount: products.length,

    // Methods
    next,
    prev,
    goTo,
    setCurrentPage,

    // Computed
    paginatedProducts,
    pageNumbers,
    hasPreviousPage: safeCurrentPage > 1,
    hasNextPage: safeCurrentPage < totalPages,
    startIndex: (safeCurrentPage - 1) * pageSize + 1,
    endIndex: Math.min(safeCurrentPage * pageSize, products.length),
  };
}