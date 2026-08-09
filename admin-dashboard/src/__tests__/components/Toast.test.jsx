import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { Toast } from "../../components/Toast";
import { eventEmitter, EVENTS } from "../../services/eventEmitter";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    eventEmitter.clear(EVENTS.NOTIFY);
  });

  afterEach(() => {
    cleanup();
    eventEmitter.clear(EVENTS.NOTIFY);
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test("caps visible toasts and removes the oldest toast when the limit is exceeded", () => {
    render(<Toast />);

    act(() => {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "info", message: "Toast 1" });
      eventEmitter.emit(EVENTS.NOTIFY, { type: "info", message: "Toast 2" });
      eventEmitter.emit(EVENTS.NOTIFY, { type: "info", message: "Toast 3" });
      eventEmitter.emit(EVENTS.NOTIFY, { type: "info", message: "Toast 4" });
    });

    expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
    expect(screen.getByText("Toast 4")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /close notification/i })
    ).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Toast 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Toast 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Toast 4")).not.toBeInTheDocument();
  });
});
