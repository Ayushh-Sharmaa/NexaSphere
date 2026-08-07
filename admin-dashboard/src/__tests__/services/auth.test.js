import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

const API_BASE = "http://test:8080";
let auth;
let eventEmitter;
let EVENTS;

beforeAll(async () => {
  process.env.VITE_API_BASE = API_BASE;
  const mod = await import("../../services/auth.js");
  auth = mod.auth;

  const ee = await import("../../services/eventEmitter.js");
  eventEmitter = ee.eventEmitter;
  EVENTS = ee.EVENTS;
});

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth.login", () => {
  test("sends POST with trimmed credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "test@example.com" }),
    });

    const result = await auth.login("  Test@Example.com  ", "  secret123  ");

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test@example.com",
        password: "secret123",
      }),
      body: JSON.stringify({
        email: "test@example.com",
        password: "secret123",
      }),
      credentials: "include",
    });
    expect(result.username).toBe("test@example.com");
  });

  test("throws error message from response body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Account locked" }),
    });

    await expect(auth.login("a@b.com", "x")).rejects.toThrow("Account locked");
  });

  test('throws "Invalid credentials" when response body has no error or message field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "something went wrong" }),
    });

    await expect(auth.login("a@b.com", "x")).rejects.toThrow(
      "Invalid credentials"
    );
  });

  test('throws "Invalid credentials" when response json() fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("parse fail");
      },
    });

    await expect(auth.login("a@b.com", "x")).rejects.toThrow(
      "Invalid credentials"
    );
  });

  test("rethrows network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(auth.login("a@b.com", "x")).rejects.toThrow("Failed to fetch");
  });
});

describe("auth.logout", () => {
  test("sends POST to logout endpoint with credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await auth.logout();

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
  });

  test("does not throw when logout POST fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("net err"));

    await expect(auth.logout()).resolves.toBeUndefined();
  });

  test("clears in-memory state after logout", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await auth.logout();

    expect(auth.getEmail()).toBeNull();
    expect(auth.getScopes()).toEqual([
      "users:read",
      "users:write",
      "settings:admin",
      "events:read",
      "events:write",
    ]);
  });

  test("broadcasts logout so polling can stop immediately", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const emitSpy = vi.spyOn(eventEmitter, "emit");

    await auth.logout();

    expect(emitSpy).toHaveBeenCalledWith(EVENTS.AUTH_LOGOUT);
  });
});

describe("auth.verifySession", () => {
  test("returns true when /api/admin/me returns ok", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    const result = await auth.verifySession();

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/api/admin/me`, {
      credentials: "include",
    });
  });

  test("returns false when /api/admin/me returns non-ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    const result = await auth.verifySession();

    expect(result).toBe(false);
  });

  test("returns false on network error without throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("net fail"));

    const result = await auth.verifySession();
    expect(result).toBe(false);
  });
});

describe("auth.getEmail", () => {
  beforeEach(async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await auth.logout();
  });

  test("getEmail returns stored email after login", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "admin@test.com" }),
    });

    await auth.login("admin@test.com", "x");
    expect(auth.getEmail()).toBe("admin@test.com");
  });

  test("getEmail returns null when not logged in", () => {
    expect(auth.getEmail()).toBeNull();
  });
});

describe("auth.isOffline / isOfflineMode", () => {
  test("isOffline returns false when VITE_API_BASE is set", () => {
    expect(auth.isOffline()).toBe(false);
  });

  test("isOfflineMode mirrors isOffline", () => {
    expect(auth.isOfflineMode()).toBe(auth.isOffline());
  });
});
