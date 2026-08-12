/**
 * Shared admin auth storage keys.
 * All auth modules must import from here so login, session rehydration,
 * logout, and HTTP clients operate on the same localStorage / cookie names.
 */

export const TOKEN_KEY = "ns_admin_token";
export const EMAIL_KEY = "ns_admin_email";
export const EXPIRY_KEY = "ns_admin_token_expiry";
export const CSRF_TOKEN_KEY = "ns_csrf_token";
export const OFFLINE_FLAG_KEY = "ns_offline_mode";
export const ROLE_KEY = "ns_admin_role";
export const SCOPES_KEY = "ns_admin_scopes";
