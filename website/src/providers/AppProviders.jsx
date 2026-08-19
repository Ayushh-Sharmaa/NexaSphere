import React, { useEffect } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setClerkTokenGetter, api } from '../services/apiClient';
import { BookmarkProvider } from '../context/BookmarkContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 mins
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  // Fail loudly in dev rather than silently falling back to an unrelated
  // Clerk test instance. Set VITE_CLERK_PUBLISHABLE_KEY in website/.env.local
  // (see website/.env.example).
  throw new Error(
    'VITE_CLERK_PUBLISHABLE_KEY is not set. Add it to website/.env.local — see website/.env.example.'
  );
}

function ClerkAuthSyncBridge({ children }) {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn && user) {
      api
        .syncAuth({
          email: user.primaryEmailAddress?.emailAddress || '',
          fullName: user.fullName || user.firstName || 'Student',
          avatarUrl: user.imageUrl || '',
        })
        .catch((err) => {
          console.warn('[ClerkAuthSync] Profile sync warning:', err.message);
        });
    }
  }, [isSignedIn, user]);

  return children;
}

export function AppProviders({ children }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <ClerkAuthSyncBridge>
          <BookmarkProvider>{children}</BookmarkProvider>
        </ClerkAuthSyncBridge>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default AppProviders;
