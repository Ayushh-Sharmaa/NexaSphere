import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, retry, sequential, mapLimit, delayValue } from '../utils/promise';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('withTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves with the input result before the deadline', async () => {
    const pending = withTimeout(Promise.resolve(42), 1000);
    const result = await pending;
    expect(result).toBe(42);
  });

  it('rejects with the timeout message after the deadline', async () => {
    const pending = withTimeout(new Promise(() => {}), 500);
    let rejected = null;
    pending.catch((e) => {
      rejected = e;
    });

    await vi.advanceTimersByTimeAsync(501);
    expect(rejected).toBeInstanceOf(Error);
    expect(rejected.message).toBe('Operation timed out');
  });

  it('rejects a non-thenable immediately', async () => {
    await expect(withTimeout(null, 100)).rejects.toThrow(TypeError);
  });
});

describe('retry', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves on the first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { retries: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('recovered');

    const resultPromise = retry(fn, { retries: 3, baseDelay: 100 });
    const assertion = resultPromise.then((value) => {
      expect(value).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
  });

  it('rejects with the last error after exhausting attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('stubborn'));
    const promise = retry(fn, { retries: 2, baseDelay: 10 });
    const assertion = expect(promise).rejects.toThrow('stubborn');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops early when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fatal')).mockResolvedValue('ignored');
    const promise = retry(fn, {
      retries: 5,
      shouldRetry: (e) => e.message !== 'fatal',
    });
    const assertion = expect(promise).rejects.toThrow('fatal');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('notifies via onRetry with the attempt number', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');

    const promise = retry(fn, { retries: 2, baseDelay: 50, onRetry });
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][1]).toBe(1);
  });
});

describe('sequential', () => {
  it('runs tasks in order and preserves order', async () => {
    const order = [];
    const results = await sequential([1, 2, 3], async (n) => {
      order.push(n);
      return n * 2;
    });
    expect(order).toEqual([1, 2, 3]);
    expect(results).toEqual([2, 4, 6]);
  });
});

describe('mapLimit', () => {
  it('respects the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve(); // yield to microtask queue
      active -= 1;
      return n;
    });
    expect(peak).toBe(2);
  });

  it('preserves input order', async () => {
    const results = await mapLimit([1, 2, 3, 4], 1, async (n) => n * 3);
    expect(results).toEqual([3, 6, 9, 12]);
  });

  it('rejects invalid limits', async () => {
    await expect(mapLimit([1], 0, async () => {})).rejects.toThrow(RangeError);
  });
});

describe('delayValue', () => {
  it('resolves with the value after the delay', async () => {
    vi.useFakeTimers();
    const pending = delayValue('done', 300);
    const assertion = pending.then((value) => expect(value).toBe('done'));
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
    vi.useRealTimers();
  });
});
