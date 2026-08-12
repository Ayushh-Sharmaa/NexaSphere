import { useEffect, useRef } from 'react';

/**
 * Calls a handler when a pointer event lands outside the referenced element.
 *
 * Useful for dismissing dropdowns, menus, modals and popovers. Supports any
 * number of extra "ignore" refs (e.g. a trigger button) so interacting with
 * those nodes does not close the surface. Events are captured at the document
 * level with the capture flag, which keeps the hook working even when the
 * click target is removed from the DOM before the handler runs (a common
 * React pitfall with onClickOutside implementations).
 *
 * @param {Function} onOutside - Callback invoked with the native event when a
 *   click/tap occurs outside every watched node.
 * @param {object} [options] - Behaviour options.
 * @param {boolean} [options.enabled=true] - When `false`, listeners are not
 *   attached and the hook becomes a no-op.
 * @param {string[]} [options.events=['mousedown','touchstart']] - Event types
 *   that count as "outside" interactions.
 * @param {React.RefObject[]} [options.ignore=[]] - Additional refs whose nodes
 *   are treated as inside.
 * @returns {React.RefObject} A ref that must be attached to the element being
 *   watched.
 *
 * @example
 * function Dropdown() {
 *   const triggerRef = useRef(null);
 *   const panelRef = useClickOutside(() => setOpen(false), { ignore: [triggerRef] });
 *   return (
 *     <>
 *       <button ref={triggerRef}>Open</button>
 *       {open && <div ref={panelRef}>Panel</div>}
 *     </>
 *   );
 * }
 */
export function useClickOutside(
  onOutside,
  { enabled = true, events = ['mousedown', 'touchstart'], ignore = [] } = {}
) {
  const ref = useRef(null);
  const handlerRef = useRef(onOutside);
  const optionsRef = useRef({ events, ignore });

  handlerRef.current = onOutside;
  optionsRef.current = { events, ignore };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof onOutside !== 'function') {
      return undefined;
    }

    const handleEvent = (event) => {
      const { target } = event;
      if (!target || !target.isConnected) return;

      const { events: eventTypes, ignore: ignoredRefs } = optionsRef.current;
      const insideNodes = [ref.current, ...ignoredRefs.map((r) => r?.current)].filter(Boolean);
      const hitInside = insideNodes.some((node) => {
        if (node === target) return true;
        if (typeof node.contains === 'function') return node.contains(target);
        return false;
      });

      if (hitInside) return;
      handlerRef.current?.(event);
    };

    const { events: eventTypes } = optionsRef.current;
    eventTypes.forEach((type) => document.addEventListener(type, handleEvent, true));
    return () => {
      eventTypes.forEach((type) => document.removeEventListener(type, handleEvent, true));
    };
  }, [enabled]);

  return ref;
}

export default useClickOutside;
