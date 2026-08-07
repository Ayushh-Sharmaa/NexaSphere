export function getAdminBasePath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.startsWith("/admin") ? "/admin" : "";
}

export function adminPath(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAdminBasePath()}${normalizedPath}`;
}
