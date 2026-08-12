import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatCompact,
  pad2,
  formatSignedPercent,
} from "../../utils/formatters";

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("respects decimal places", () => {
    expect(formatNumber(3.14159, 2)).toBe("3.14");
  });

  it("falls back gracefully", () => {
    expect(formatNumber("nope")).toBe("nope");
    expect(formatNumber(null)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats INR by default", () => {
    expect(formatCurrency(1500)).toContain("₹");
  });

  it("honours the requested currency", () => {
    expect(formatCurrency(1500, { currency: "USD" })).toContain("$");
  });

  it("handles invalid input", () => {
    expect(formatCurrency("x")).toBe("x");
  });
});

describe("formatPercent", () => {
  it("scales ratios to percentages", () => {
    expect(formatPercent(0.625)).toBe("62.5%");
  });

  it("supports pre-scaled values", () => {
    expect(formatPercent(62.5, { isScaled: true, decimals: 0 })).toBe("63%");
  });
});

describe("formatBytes", () => {
  it("renders the right unit", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(5 * 1024 ** 2)).toBe("5 MB");
  });

  it("rejects negative values", () => {
    expect(formatBytes(-10)).toBe("0 B");
  });
});

describe("formatCompact", () => {
  it("abbreviates large values", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(3400000)).toMatch(/3\.4M/);
  });
});

describe("pad2", () => {
  it("zero-pads single digits", () => {
    expect(pad2(5)).toBe("05");
    expect(pad2(12)).toBe("12");
  });

  it("handles invalid input", () => {
    expect(pad2("x")).toBe("00");
  });
});

describe("formatSignedPercent", () => {
  it("adds explicit signs", () => {
    expect(formatSignedPercent(12.4)).toBe("+12.4%");
    expect(formatSignedPercent(-3)).toBe("-3.0%");
    expect(formatSignedPercent(0)).toBe("0.0%");
  });

  it("can omit zero deltas", () => {
    expect(formatSignedPercent(0, { showZero: false })).toBe("");
  });
});
