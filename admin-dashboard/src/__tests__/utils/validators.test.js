import { describe, it, expect } from "vitest";
import {
  isRequired,
  isValidEmail,
  isValidUrl,
  isLengthInRange,
  isNumberInRange,
  isValidHexColor,
  matchesPattern,
  validateFields,
} from "../../utils/validators";

describe("isRequired", () => {
  it("rejects empty strings", () => {
    expect(isRequired("")).toBe(false);
    expect(isRequired("   ")).toBe(false);
  });

  it("accepts present values", () => {
    expect(isRequired("x")).toBe(true);
    expect(isRequired(0)).toBe(true);
    expect(isRequired({})).toBe(true);
    expect(isRequired(null)).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts valid addresses", () => {
    expect(isValidEmail("admin@nexasphere.com")).toBe(true);
    expect(isValidEmail("first.last@example.co.in")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("accepts http(s) and scheme-less hosts", () => {
    expect(isValidUrl("https://nexasphere.com/admin")).toBe(true);
    expect(isValidUrl("nexasphere.com")).toBe(true);
  });

  it("rejects non-URLs", () => {
    expect(isValidUrl("hello world")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("isLengthInRange", () => {
  it("checks trimmed length bounds", () => {
    expect(isLengthInRange("hello", 3, 10)).toBe(true);
    expect(isLengthInRange("  hi  ", 2, 2)).toBe(true);
    expect(isLengthInRange("hello", 6, 10)).toBe(false);
  });
});

describe("isNumberInRange", () => {
  it("accepts numeric strings within bounds", () => {
    expect(isNumberInRange("150", 0, 500)).toBe(true);
    expect(isNumberInRange(150, 0, 500)).toBe(true);
  });

  it("rejects out-of-range and non-numeric values", () => {
    expect(isNumberInRange("600", 0, 500)).toBe(false);
    expect(isNumberInRange("abc", 0, 500)).toBe(false);
    expect(isNumberInRange(null, 0, 500)).toBe(false);
  });
});

describe("isValidHexColor", () => {
  it("accepts 3 and 6 digit hex colours", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#FF5733")).toBe(true);
  });

  it("rejects invalid colours", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#ggg")).toBe(false);
  });
});

describe("matchesPattern", () => {
  it("tests against a custom pattern", () => {
    expect(matchesPattern("abc123", /^[a-z0-9]+$/)).toBe(true);
    expect(matchesPattern("has space", /^[a-z0-9]+$/)).toBe(false);
    expect(matchesPattern(5, /^[a-z0-9]+$/)).toBe(false);
  });
});

describe("validateFields", () => {
  const rules = {
    email: [{ test: isValidEmail, message: "Invalid email" }],
    name: [
      {
        test: (v) => isLengthInRange(v, 2, 50),
        message: "Name must be 2-50 chars",
      },
    ],
  };

  it("returns valid for clean fields", () => {
    const result = validateFields({ email: "a@b.co", name: "Jane" }, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("collects per-field error messages", () => {
    const result = validateFields({ email: "broken", name: "J" }, rules);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      email: "Invalid email",
      name: "Name must be 2-50 chars",
    });
  });
});
