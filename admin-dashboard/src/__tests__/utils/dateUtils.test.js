import { describe, it, expect } from "vitest";
import {
  toDate,
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  daysBetween,
  dayBuckets,
  formatDate,
  toISODate,
} from "../../utils/dateUtils";

describe("toDate", () => {
  it("parses Date, ISO string and timestamp", () => {
    const d = new Date("2025-06-10T10:00:00Z");
    expect(toDate(d).getTime()).toBe(d.getTime());
    expect(toDate("2025-06-10T10:00:00Z").getTime()).toBe(d.getTime());
  });

  it("returns null for invalid input", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate("garbage")).toBeNull();
    expect(toDate(new Date("invalid"))).toBeNull();
  });
});

describe("startOfDay", () => {
  it("zeroes the time components", () => {
    const start = startOfDay(new Date(2025, 5, 15, 22, 45));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });
});

describe("startOfWeek", () => {
  it("returns the preceding Monday", () => {
    // 2025-06-12 is a Thursday
    const monday = startOfWeek(new Date(2025, 5, 12));
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(9);
  });
});

describe("startOfMonth", () => {
  it("returns the first day at midnight", () => {
    const first = startOfMonth(new Date(2025, 5, 22));
    expect(first.getDate()).toBe(1);
    expect(first.getHours()).toBe(0);
    expect(first.getMonth()).toBe(5);
  });
});

describe("addDays", () => {
  it("adds and subtracts days without mutating input", () => {
    const base = new Date(2025, 0, 10);
    expect(addDays(base, 5).getDate()).toBe(15);
    expect(addDays(base, -3).getDate()).toBe(7);
    expect(base.getDate()).toBe(10);
  });
});

describe("daysBetween", () => {
  it("computes whole-day differences", () => {
    expect(daysBetween("2025-01-01", "2025-01-04")).toBe(3);
    expect(daysBetween("2025-01-04", "2025-01-01")).toBe(-3);
  });

  it("returns null for invalid input", () => {
    expect(daysBetween("bad", "2025-01-01")).toBeNull();
  });
});

describe("dayBuckets", () => {
  it("generates one bucket per day inclusive", () => {
    const buckets = dayBuckets("2025-01-01", "2025-01-03");
    expect(buckets).toHaveLength(3);
    expect(buckets[0].getDate()).toBe(1);
    expect(buckets[2].getDate()).toBe(3);
  });

  it("returns empty for invalid ranges", () => {
    expect(dayBuckets(null, "2025-01-01")).toEqual([]);
  });
});

describe("formatDate", () => {
  it("formats using the default style", () => {
    const out = formatDate(new Date(2025, 5, 10));
    expect(out).toContain("2025");
    expect(out).toContain("Jun");
  });

  it("returns null for invalid input", () => {
    expect(formatDate(null)).toBeNull();
  });
});

describe("toISODate", () => {
  it("formats with zero padding", () => {
    expect(toISODate(new Date(2025, 5, 9))).toBe("2025-06-09");
  });

  it("returns null for invalid input", () => {
    expect(toISODate(null)).toBeNull();
  });
});
