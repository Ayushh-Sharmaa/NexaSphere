import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Skeleton, SkeletonText } from "../Skeleton";

describe("Skeleton Component", () => {
  it("renders a single skeleton element by default", () => {
    const { container } = render(<Skeleton />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements).toHaveLength(1);
  });

  it("renders the specified number of elements", () => {
    const { container } = render(<Skeleton count={3} />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements).toHaveLength(3);
  });

  it("applies skeleton-shimmer class by default", () => {
    const { container } = render(<Skeleton />);
    const element = container.querySelector(".skeleton");
    expect(element).toHaveClass("skeleton-shimmer");
  });

  it("does not apply skeleton-shimmer when animate is false", () => {
    const { container } = render(<Skeleton animate={false} />);
    const element = container.querySelector(".skeleton");
    expect(element).not.toHaveClass("skeleton-shimmer");
  });

  it("applies skeleton-rounded class when rounded is true", () => {
    const { container } = render(<Skeleton rounded={true} />);
    const element = container.querySelector(".skeleton");
    expect(element).toHaveClass("skeleton-rounded");
  });

  it("does not apply skeleton-rounded when rounded is false", () => {
    const { container } = render(<Skeleton rounded={false} />);
    const element = container.querySelector(".skeleton");
    expect(element).not.toHaveClass("skeleton-rounded");
  });

  it("applies borderRadius 50% when rounded is true", () => {
    const { container } = render(<Skeleton rounded={true} />);
    const element = container.querySelector(".skeleton");
    expect(element).toHaveStyle("border-radius: 50%");
  });

  it("sets custom height and width from props", () => {
    const { container } = render(<Skeleton height={80} width="50%" />);
    const element = container.querySelector(".skeleton");
    expect(element).toHaveStyle("height: 80px");
    expect(element).toHaveStyle("width: 50%");
  });

  it('has aria-hidden and role="presentation" for accessibility', () => {
    const { container } = render(<Skeleton />);
    const element = container.querySelector(".skeleton");
    expect(element).toHaveAttribute("aria-hidden", "true");
    expect(element).toHaveAttribute("role", "presentation");
  });

  it("handles count=0 gracefully (renders 1)", () => {
    const { container } = render(<Skeleton count={0} />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements).toHaveLength(1);
  });

  it("renders elements with marginBottom except for the last one", () => {
    const { container } = render(<Skeleton count={3} />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements[0]).toHaveStyle("margin-bottom: 8px");
    expect(elements[1]).toHaveStyle("margin-bottom: 8px");
    // Last element should not have margin-bottom (or it's 0)
    expect(elements[2]).not.toHaveStyle("margin-bottom: 8px");
  });
});

describe("SkeletonText Component", () => {
  it("renders the specified number of lines", () => {
    const { container } = render(<SkeletonText lines={4} />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements).toHaveLength(4);
  });

  it("renders 3 lines by default", () => {
    const { container } = render(<SkeletonText />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements).toHaveLength(3);
  });

  it("last line has 60% width", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const elements = container.querySelectorAll(".skeleton");
    expect(elements[2]).toHaveStyle("width: 60%");
  });

  it("applies skeleton-shimmer class by default", () => {
    const { container } = render(<SkeletonText />);
    const elements = container.querySelectorAll(".skeleton");
    elements.forEach((el) => {
      expect(el).toHaveClass("skeleton-shimmer");
    });
  });

  it("does not apply skeleton-shimmer when animate is false", () => {
    const { container } = render(<SkeletonText animate={false} />);
    const elements = container.querySelectorAll(".skeleton");
    elements.forEach((el) => {
      expect(el).not.toHaveClass("skeleton-shimmer");
    });
  });
});
