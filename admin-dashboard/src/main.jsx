import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./i18n";
import { setupFetchInterceptor } from "./services/interceptor";
import { setClerkTokenGetter } from "./api/axiosInstance";

setupFetchInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_bW9yYWwtc25haWwtNzAuY2xlcmsuYWNjb3VudHMuZGV2JA";

function ClerkAuthBridge({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ClerkAuthBridge>
          <App />
        </ClerkAuthBridge>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
);
