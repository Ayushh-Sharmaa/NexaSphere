import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  // ── Basic rendering ──────────────────────────────────────────────

  test("renders nothing when total is 0", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} total={0} pageSize={25} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders page info with correct range", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        total={53}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByText("Showing 1–25 of 53")).toBeInTheDocument();
  });

  test("renders correct range on last page", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        total={53}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByText("Showing 51–53 of 53")).toBeInTheDocument();
  });

  // ── Page buttons ─────────────────────────────────────────────────

  test("renders correct number of page buttons", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    // Should have 5 page buttons + Previous + Next
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(7);
    expect(screen.getByLabelText("Go to page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to page 5")).toBeInTheDocument();
  });

  test("highlights current page with aria-current", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    const currentBtn = screen.getByLabelText("Go to page 2");
    expect(currentBtn).toHaveAttribute("aria-current", "page");
  });

  test("calls onPageChange when clicking a page button", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Go to page 3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("calls onPageChange when clicking Next", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("calls onPageChange when clicking Previous", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  // ── Disabled state ───────────────────────────────────────────────

  test("disables Previous button on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  test("disables Next button on last page", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  // ── Ellipsis ─────────────────────────────────────────────────────

  test("shows ellipsis for large page counts", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        total={500}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    // Should show ellipsis markers (they're aria-hidden)
    const ellipses = document.querySelectorAll('[aria-hidden="true"]');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
    // Should always show first and last page
    expect(screen.getByLabelText("Go to page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to page 20")).toBeInTheDocument();
  });

  test("does not show ellipsis when totalPages <= 7", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={7}
        total={175}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    const ellipses = document.querySelectorAll('[aria-hidden="true"]');
    expect(ellipses.length).toBe(0);
  });

  // ── Page size selector ───────────────────────────────────────────

  test("renders page size selector with options", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        total={53}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    const select = screen.getByLabelText("Results per page");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("25");
    // Should have 10, 25, 50, 100 options
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  test("calls onPageSizeChange when selecting a new page size", () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        total={53}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Results per page"), {
      target: { value: "50" },
    });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  // ── Loading state ────────────────────────────────────────────────

  test("shows loading indicator when loading", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        loading={true}
      />
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  test("disables all buttons when loading", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        loading={true}
      />
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  test("disables page size selector when loading", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        loading={true}
      />
    );
    expect(screen.getByLabelText("Results per page")).toBeDisabled();
  });

  // ── Keyboard navigation ──────────────────────────────────────────

  test("calls onPageChange on Enter key press on page button", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    const page3Btn = screen.getByLabelText("Go to page 3");
    fireEvent.keyDown(page3Btn, { key: "Enter" });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("calls onPageChange on Space key press on page button", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        pageSize={25}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    const page3Btn = screen.getByLabelText("Go to page 3");
    fireEvent.keyDown(page3Btn, { key: " " });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  // ── Navigation accessibility ──────────────────────────────────────

  test("has proper aria-label on nav element", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        total={53}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Pagination")).toBeInTheDocument();
  });

  // ── Single page ──────────────────────────────────────────────────

  test("renders nothing when on single page (total <= pageSize)", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        total={15}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    // Component returns null when total === 0, but for total > 0 with 1 page
    // it should still render for showing info and page-size selector
    expect(screen.getByText("Showing 1–15 of 15")).toBeInTheDocument();
    expect(container.querySelector("nav")).toBeInTheDocument();
  });
});
