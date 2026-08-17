import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text to the clipboard and tracks the transient "copied" state.
 *
 * Prefers the async `navigator.clipboard` API and falls back to a hidden
 * textarea + `document.execCommand('copy')` for browsers/contexts (or older
 * WebViews) where the Clipboard API is not exposed. `copied` resets
 * automatically after `timeout` ms so components can drive a checkmark or
 * toast without extra bookkeeping.
 *
 * @param {object} [options] - Behaviour options.
 * @param {number} [options.timeout=2000] - How long `copied` stays `true`
 *   after a successful copy. Pass `0` to keep it set until `reset()`.
 * @param {Function} [options.onSuccess] - Called with the copied string.
 * @param {Function} [options.onError] - Called with the thrown error.
 * @returns {object} `{ copy, copied, error, reset }`.
 *
 * @example
 * const { copy, copied } = useCopyToClipboard();
 * <button onClick={() => copy('npm i react')}>{copied ? 'Copied!' : 'Copy'}</button>
 */
export function useCopyToClipboard({ timeout = 2000, onSuccess, onError } = {}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(
    async (text) => {
      const value = String(text ?? '');
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(value);
        } else {
          legacyCopy(value);
        }

        setCopied(true);
        setError(null);
        clearTimeout(timerRef.current);
        if (timeout > 0) {
          timerRef.current = setTimeout(() => setCopied(false), timeout);
        }
        callbacksRef.current.onSuccess?.(value);
      } catch (err) {
        setCopied(false);
        setError(err);
        callbacksRef.current.onError?.(err);
      }
    },
    [timeout]
  );

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}

/**
 * Synchronous fallback using a temporary textarea and execCommand.
 * Only reached when `navigator.clipboard` is unavailable.
 *
 * @param {string} text - Text to place on the clipboard.
 */
function legacyCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const ok = document.execCommand('copy');
    if (!ok) {
      throw new Error('execCommand("copy") returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

export default useCopyToClipboard;
