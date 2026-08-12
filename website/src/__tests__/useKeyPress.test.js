import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, fireEvent } from '@testing-library/react';
import useKeyPress from '../hooks/useKeyPress';

function press(key, options = {}) {
  fireEvent.keyDown(window, { key, ...options });
}

describe('useKeyPress', () => {
  afterEach(cleanup);

  it('calls the handler when the key is pressed', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress('Escape', handler));

    press('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler for other keys', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress('Escape', handler));

    press('Enter');
    expect(handler).not.toHaveBeenCalled();
  });

  it('matches single letters case-insensitively', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress('a', handler));

    press('a');
    press('A');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('matches any key in an array', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress(['Escape', 'Enter'], handler));

    press('Enter');
    expect(handler).toHaveBeenCalledTimes(1);

    press('Escape');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('matches modifier combinations exactly', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress({ key: 'k', ctrlKey: true }, handler));

    press('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    press('k', { ctrlKey: false });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('matches meta-key shortcuts (Cmd+K)', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress({ key: 'k', metaKey: true }, handler));

    press('k', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    press('k', { metaKey: false });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports multiple descriptor objects', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyPress(
        [
          { key: 'k', ctrlKey: true },
          { key: 'k', metaKey: true },
        ],
        handler
      )
    );

    press('k', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    press('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does nothing while disabled', () => {
    const handler = vi.fn();
    renderHook(() => useKeyPress('Escape', handler, { enabled: false }));

    press('Escape');
    expect(handler).not.toHaveBeenCalled();
  });

  it('re-binds when the key set changes', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ key }) => useKeyPress(key, handler), {
      initialProps: { key: 'Escape' },
    });

    rerender({ key: 'Enter' });
    press('Escape');
    expect(handler).not.toHaveBeenCalled();

    press('Enter');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyPress('Escape', handler));

    unmount();
    press('Escape');
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the latest handler without re-binding', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ handler }) => useKeyPress('Escape', handler), {
      initialProps: { handler: first },
    });

    rerender({ handler: second });
    press('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
