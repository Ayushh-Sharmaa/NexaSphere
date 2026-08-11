import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only fires once after a burst of calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced('a');
    debounced('b');
    debounced('c');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('preserves the call-site context', () => {
    const obj = { value: 7, log() { return this.value; } };
    const spy = vi.spyOn(obj, 'log');
    const debounced = debounce(obj.log, 100);

    debounced.call(obj);
    vi.advanceTimersByTime(100);
    expect(spy).toHaveReturnedWith(7);
  });

  it('invokes on the leading edge when leading is true', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250, { leading: true });

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('enforces maxWait for continuous streams', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250, { maxWait: 500 });

    const interval = setInterval(() => debounced(), 100);
    vi.advanceTimersByTime(1000);
    clearInterval(interval);

    // At least one invocation must have happened within the first 500ms.
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('cancel() drops the pending call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('flush() runs the pending call immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced('payload');
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('payload');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes at most once per interval on the leading edge', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 250);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('captures the last trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 250);

    throttled('first');
    vi.advanceTimersByTime(100);
    throttled('second');
    vi.advanceTimersByTime(100);
    throttled('third');

    vi.advanceTimersByTime(250);
    // leading invocation + one trailing invocation with the latest args
    expect(fn.mock.calls.length).toBe(2);
    expect(fn).toHaveBeenLastCalledWith('third');
  });

  it('does not invoke on the leading edge when leading is false', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 250, { leading: false });

    throttled();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('skips trailing calls when trailing is false', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 250, { trailing: false });

    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    vi.advanceTimersByTime(250);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() clears the pending trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 250);

    throttled();
    vi.advanceTimersByTime(100);
    throttled('later');

    throttled.cancel();
    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
