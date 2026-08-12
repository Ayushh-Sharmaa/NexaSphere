import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdminShortcuts({ onOpenCommandMenu, onToggleShortcutsHelp }) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K: Global Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandMenu();
      }

      // Cmd/Ctrl + Shift + A: Create Announcement (Assuming route is /dashboard/announcements/new)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/dashboard/announcements/new'); // or wherever the route is
      }

      // Cmd/Ctrl + Shift + E: Create Event
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        navigate('/dashboard/events/new');
      }

      // ? key: Show all shortcuts
      if (e.key === '?') {
        e.preventDefault();
        onToggleShortcutsHelp();
      }
    },
    [navigate, onOpenCommandMenu, onToggleShortcutsHelp]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
