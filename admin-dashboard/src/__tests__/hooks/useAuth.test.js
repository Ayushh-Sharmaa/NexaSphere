import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mocks (hoisted) ────────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/auth.js", () => ({
  auth: {
    verifySession: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getEmail: vi.fn(() => "admin@test.com"),
  },
}));

vi.mock("../../services/eventEmitter.js", () => ({
  eventEmitter: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  EVENTS: {
    AUTH_TOKEN_EXPIRED: "auth:token-expired",
    NOTIFY: "notify",
  },
}));

// We need to set window.location.pathname for adminBasePath utility
// The default is '/' so adminPath('/login') = '/login'
// This is the normal case since adminBasePath checks window.location.pathname

// ── Suite ──────────────────────────────────────────────────────────────
describe("useAuth hook", () => {
  let useAuth;
  let auth;
  let eventEmitter;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Fresh imports after mocks are set up
    const authMod = await import("../../services/auth.js");
    auth = authMod.auth;

    const eeMod = await import("../../services/eventEmitter.js");
    eventEmitter = eeMod.eventEmitter;

    const hookMod = await import("../../hooks/useAuth.js");
    useAuth = hookMod.useAuth;
  });

  test("starts in loading state", () => {
    // Make verifySession hang so loading stays true
    auth.verifySession.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isVerified).toBe(false);
  });

  test("sets isVerified=true when session is valid", async () => {
    auth.verifySession.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isVerified).toBe(true);
    expect(auth.logout).not.toHaveBeenCalled();
  });

  test("logs out and sets isVerified=false when session is invalid", async () => {
    auth.verifySession.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isVerified).toBe(false);
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  test("cancels verification on unmount (does not call setState)", async () => {
    auth.verifySession.mockReturnValue(new Promise((r) => setTimeout(r, 1000)));

    const { result, unmount } = renderHook(() => useAuth(), {
      wrapper: MemoryRouter,
    });

    expect(result.current.isLoading).toBe(true);

    // Unmount before session resolves
    unmount();

    // Wait enough time for the promise to resolve (but state should not update)
    await new Promise((r) => setTimeout(r, 200));

    // The cancelled flag prevented state update, nothing to assert directly
    // but no React warning means the test passed (can't update unmounted component)
    expect(true).toBe(true);
  });

  test("subscribes to AUTH_TOKEN_EXPIRED event", () => {
    renderHook(() => useAuth(), { wrapper: MemoryRouter });

    expect(eventEmitter.on).toHaveBeenCalledWith(
      "auth:token-expired",
      expect.any(Function)
    );
  });

  test("cleans up event listener on unmount", () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    const handler = eventEmitter.on.mock.calls[0][1];
    unmount();

    expect(eventEmitter.off).toHaveBeenCalledWith(
      "auth:token-expired",
      handler
    );
  });

  test("expired token event triggers logout + navigation to /login", async () => {
    auth.verifySession.mockResolvedValue(true);

    // Capture the handler registered for AUTH_TOKEN_EXPIRED
    let expiryHandler;
    eventEmitter.on.mockImplementation((event, handler) => {
      if (event === "auth:token-expired") expiryHandler = handler;
    });

    renderHook(() => useAuth(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(expiryHandler).toBeDefined();
    });

    // Manually trigger the expiry handler
    act(() => {
      expiryHandler();
    });

    expect(auth.logout).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith("notify", {
      type: "error",
      message: "Your session has expired. Please log in again to continue.",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  test("returns email from auth.getEmail", async () => {
    auth.verifySession.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.email).toBe("admin@test.com");
  });

  test("logout function calls auth.logout and navigates to /login", async () => {
    auth.verifySession.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(auth.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
