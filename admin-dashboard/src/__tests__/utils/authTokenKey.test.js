import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { TOKEN_KEY, CSRF_TOKEN_KEY } from "../../constants/authConstants";
import { getToken, removeToken } from "../../utils/authUtils";

describe("shared admin auth token key", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("TOKEN_KEY is the canonical ns_admin_token value", () => {
    expect(TOKEN_KEY).toBe("ns_admin_token");
  });

  test("auth service and authUtils read/write the same localStorage key", async () => {
    process.env.VITE_API_BASE = "http://test:8080";
    const { auth } = await import("../../services/auth.js");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "shared-token-123",
        email: "admin@example.com",
        csrfToken: "csrf-abc",
      }),
    });

    await auth.login("admin@example.com", "password");

    expect(localStorage.getItem(TOKEN_KEY)).toBe("shared-token-123");
    expect(localStorage.getItem("admin_token")).toBeNull();
    expect(getToken()).toBe("shared-token-123");
    expect(localStorage.getItem(CSRF_TOKEN_KEY)).toBe("csrf-abc");

    await auth.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(getToken()).toBeNull();
  });

  test("removeToken clears the same shared key used by login", () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    localStorage.setItem(CSRF_TOKEN_KEY, "csrf");
    localStorage.setItem("admin_token", "stale-legacy");

    removeToken();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(CSRF_TOKEN_KEY)).toBeNull();
    // legacy key is unused and left alone — callers must not rely on it
    expect(localStorage.getItem("admin_token")).toBe("stale-legacy");
  });
});
