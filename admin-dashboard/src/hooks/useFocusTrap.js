import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active, onEscape) {
  const ref = useRef(null);
  const previous = useRef(null);

  useEffect(() => {
    if (!active) return;

    previous.current = document.activeElement;

    const timer = setTimeout(() => {
      if (ref.current) {
        const first = ref.current.querySelector(FOCUSABLE);
        if (first) first.focus();
      }
    }, 50);

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = ref.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (previous.current && previous.current.focus) {
        previous.current.focus();
      }
    };
  }, [active, onEscape]);

  return ref;
}
