import React from "react";
import { auth } from "../services/auth";

export function PermissionGuard({ requiredScope, children, fallback = null }) {
  const scopes = auth.getScopes();
  if (scopes.includes(requiredScope)) {
    return <>{children}</>;
  }
  return fallback;
}
