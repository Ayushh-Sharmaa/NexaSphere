import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    navigator.clipboard = originalClipboard;
    vi.useRealTimers();
  });

  it('copies text via the async Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard = { writeText };

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('hello world');
    });

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets copied back to false after the timeout', async () => {
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { result } = renderHook(() => useCopyToClipboard({ timeout: 1500 }));

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.copied).toBe(false);
  });

  it('keeps copied true indefinitely when timeout is 0', async () => {
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { result } = renderHook(() => useCopyToClipboard({ timeout: 0 }));

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.copied).toBe(true);
  });

  it('coerces non-string values before copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard = { writeText };

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy(42);
    });
    expect(writeText).toHaveBeenCalledWith('42');
  });

  it('reports the error when the Clipboard API rejects', async () => {
    navigator.clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };
    const onError = vi.fn();
    const { result } = renderHook(() => useCopyToClipboard({ onError }));

    await act(async () => {
      await result.current.copy('secret');
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Permission denied');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('invokes onSuccess with the copied value', async () => {
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCopyToClipboard({ onSuccess }));

    await act(async () => {
      await result.current.copy('payload');
    });
    expect(onSuccess).toHaveBeenCalledWith('payload');
  });

  it('falls back to execCommand when the Clipboard API is missing', async () => {
    navigator.clipboard = undefined;
    const execSpy = vi
      .spyOn(document, 'execCommand')
      .mockImplementation(() => true);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('legacy text');
    });

    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);

    execSpy.mockRestore();
  });

  it('surfaces an error when execCommand fails', async () => {
    navigator.clipboard = undefined;
    vi.spyOn(document, 'execCommand').mockImplementation(() => false);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('legacy text');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.copied).toBe(false);
  });

  it('resets copied and error state', async () => {
    navigator.clipboard = { writeText: vi.fn().mockRejectedValue(new Error('nope')) };
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => {
      result.current.reset();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.copied).toBe(false);
  });
});
