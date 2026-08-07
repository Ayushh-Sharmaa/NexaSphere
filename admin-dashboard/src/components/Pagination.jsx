import { useMemo, useCallback } from "react";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Pagination — Reusable server-side pagination component.
 *
 * Props:
 *   currentPage    — 1-based current page number
 *   totalPages     — total number of pages
 *   total          — total number of items across all pages
 *   pageSize       — current page size
 *   onPageChange   — (page: number) => void
 *   onPageSizeChange — (pageSize: number) => void
 *   loading        — if true, shows loading indicator instead of nav
 *   pageKey        — optional unique key to reset internal state (e.g. when search changes)
 */
export function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) {
  const safePage = Math.max(1, Math.min(currentPage || 1, totalPages || 1));
  const safeTotalPages = Math.max(1, totalPages || 1);
  const isFirstPage = safePage <= 1;
  const isLastPage = safePage >= safeTotalPages;
  const startItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, total);

  // Build visible page range with ellipsis
  const pageRange = useMemo(() => {
    const range = [];
    const maxVisible = 7;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) range.push(i);
    } else {
      // Always show first, last, and pages around current
      range.push(1);
      if (safePage > 3) range.push("ellipsis-start");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(safeTotalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (safePage < safeTotalPages - 2) range.push("ellipsis-end");
      range.push(safeTotalPages);
    }

    return range;
  }, [safePage, safeTotalPages]);

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > safeTotalPages || page === safePage) return;
      onPageChange(page);
    },
    [safePage, safeTotalPages, onPageChange]
  );

  const handlePageSizeChange = useCallback(
    (e) => {
      onPageSizeChange(Number(e.target.value));
    },
    [onPageSizeChange]
  );

  const handleKeyDown = useCallback(
    (e, page) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePageChange(page);
      }
    },
    [handlePageChange]
  );

  // Don't render if single page or no items
  if (total === 0) return null;

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    padding: "0 10px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--text2)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    userSelect: "none",
    fontFamily: "inherit",
  };

  const btnHover = {
    borderColor: "var(--text2)",
    color: "var(--text)",
  };

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        fontSize: "13px",
      }}
    >
      {/* Total count */}
      <span
        style={{
          color: "var(--text-muted)",
          marginRight: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {total > 0
          ? `Showing ${startItem}–${endItem} of ${total}`
          : "0 results"}
      </span>

      {/* Loading indicator */}
      {loading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
          aria-live="polite"
        >
          <span className="animate-spin" style={{ width: 14, height: 14 }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
          Loading…
        </span>
      )}

      {/* Page size selector */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>Per page:</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={loading}
          aria-label="Results per page"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text)",
            padding: "4px 8px",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--red)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {/* Previous button */}
      <button
        onClick={() => handlePageChange(safePage - 1)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isFirstPage && !loading) handlePageChange(safePage - 1);
          }
        }}
        disabled={isFirstPage || loading}
        aria-label="Previous page"
        style={{
          ...btnBase,
          padding: "0 12px",
          opacity: isFirstPage || loading ? 0.4 : 1,
          cursor: isFirstPage || loading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isFirstPage && !loading)
            Object.assign(e.currentTarget.style, btnHover);
        }}
        onMouseLeave={(e) => {
          if (!isFirstPage && !loading)
            Object.assign(e.currentTarget.style, btnBase);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Page buttons */}
      {pageRange.map((item, idx) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span
              key={item}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "36px",
                height: "36px",
                color: "var(--text-muted)",
                fontSize: "13px",
                userSelect: "none",
              }}
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const isActive = item === safePage;
        return (
          <button
            key={item}
            onClick={() => handlePageChange(item)}
            disabled={loading}
            aria-label={`Go to page ${item}`}
            aria-current={isActive ? "page" : undefined}
            style={{
              ...btnBase,
              background: isActive ? "var(--red)" : "transparent",
              borderColor: isActive ? "var(--red)" : "var(--border)",
              color: isActive ? "#fff" : "var(--text2)",
              fontWeight: isActive ? 700 : 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive && !loading)
                Object.assign(e.currentTarget.style, btnHover);
            }}
            onMouseLeave={(e) => {
              if (!isActive && !loading) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text2)";
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, item)}
          >
            {item}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => handlePageChange(safePage + 1)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isLastPage && !loading) handlePageChange(safePage + 1);
          }
        }}
        disabled={isLastPage || loading}
        aria-label="Next page"
        style={{
          ...btnBase,
          padding: "0 12px",
          opacity: isLastPage || loading ? 0.4 : 1,
          cursor: isLastPage || loading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isLastPage && !loading)
            Object.assign(e.currentTarget.style, btnHover);
        }}
        onMouseLeave={(e) => {
          if (!isLastPage && !loading)
            Object.assign(e.currentTarget.style, btnBase);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}
