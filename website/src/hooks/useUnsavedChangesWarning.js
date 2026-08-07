import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * A custom hook to warn users of unsaved changes before leaving a dirty form.
 * Handles both browser refresh/close (beforeunload) and React Router navigation.
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes.
 */
export function useUnsavedChangesWarning(isDirty) {
  // 1. Intercept browser unload (refresh, close tab, external link)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ''; // Standard requirement for modern browsers to show the default prompt
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 2. Intercept internal React Router navigation
  // Note: useBlocker works on Data Routers (e.g. createBrowserRouter)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}
