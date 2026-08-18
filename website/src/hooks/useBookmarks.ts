import { useContext } from 'react';
import { BookmarkContext } from '../context/BookmarkContext';

const defaultBookmarkState = {
  bookmarks: [],
  addBookmark: () => {},
  removeBookmark: () => {},
  isBookmarked: () => false,
  clearBookmarks: () => {},
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    return defaultBookmarkState;
  }
  return context;
};
