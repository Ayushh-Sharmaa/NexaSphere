import { useEffect, useRef } from 'react';

/**
 * Invokes a handler when one of a set of keyboard keys is pressed.
 *
 * Supports plain key names (`'Escape'`, `'Enter'`, `'a'`) as well as modifier
 * combos expressed as objects, e.g. `{ key: 'k', metaKey: true, ctrlKey: true }`
 * for a Cmd/Ctrl+K shortcut. Matching is normalised to `event.key` and is
 * case-insensitive for single letters, so `'a'` matches both `A` and `a`.
 *
 * @param {string|string[]|object|object[]} keys - Key name(s) or key combo
 *   descriptor(s). A descriptor may include `key` plus any of `ctrlKey`,
 *   `shiftKey`, `altKey`, `metaKey`.
 * @param {Function} handler - Callback invoked with the keydown event.
 * @param {object} [options] - Behaviour options.
 * @param {boolean} [options.enabled=true] - When `false`, the listener is not
 *   attached.
 * @param {string} [options.eventType='keydown'] - DOM event type to listen for.
 * @returns {void}
 *
 * @example
 * useKeyPress('Escape', () => setOpen(false));
 * useKeyPress([{ key: 'k', ctrlKey: true }, { key: 'k', metaKey: true }], openPalette);
 */
export function useKeyPress(keys, handler, { enabled = true, eventType = 'keydown' } = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const keySet = Array.isArray(keys) ? keys : [keys];

    const handleKey = (event) => {
      if (keySet.some((descriptor) => matchesKey(event, descriptor))) {
        handlerRef.current?.(event);
      }
    };

    window.addEventListener(eventType, handleKey);
    return () => window.removeEventListener(eventType, handleKey);
  }, [enabled, eventType, keys]);

  return undefined;
}

/**
 * Tests a keyboard event against a single key descriptor.
 *
 * @param {KeyboardEvent} event - The native keyboard event.
 * @param {string|object} descriptor - Key name or descriptor object.
 * @returns {boolean} Whether the event satisfies the descriptor.
 */
function matchesKey(event, descriptor) {
  if (descriptor && typeof descriptor === 'object') {
    const { key, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = descriptor;
    return (
      normalizeKey(event.key) === normalizeKey(key) &&
      Boolean(event.ctrlKey) === ctrlKey &&
      Boolean(event.shiftKey) === shiftKey &&
      Boolean(event.altKey) === altKey &&
      Boolean(event.metaKey) === metaKey
    );
  }
  return normalizeKey(event.key) === normalizeKey(String(descriptor));
}

/**
 * Normalises a key value so letter comparisons are case-insensitive while
 * named keys like `'Escape'` stay exact.
 *
 * @param {string} key - Raw key value.
 * @returns {string} Normalised key value.
 */
function normalizeKey(key) {
  if (!key) return '';
  return key.length === 1 ? key.toLowerCase() : key;
}

export default useKeyPress;
