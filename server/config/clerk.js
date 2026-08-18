import { createClerkClient } from "@clerk/backend";

export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "";
export const CLERK_PUBLISHABLE_KEY =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "";
export const CLERK_JWT_KEY = process.env.CLERK_JWT_KEY || "";

export const clerkClient = createClerkClient({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY,
  jwtKey: CLERK_JWT_KEY || undefined,
});

export const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
