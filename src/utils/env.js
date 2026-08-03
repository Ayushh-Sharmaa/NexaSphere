/**
 * Runtime Environment Variable Validation Utility
 */

export function validateEnvironment() {
  const isDev = import.meta.env.DEV;
  const criticalVars = {
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
  };

  const missing = [];

  for (const [key, val] of Object.entries(criticalVars)) {
    if (!val || val.trim().length === 0) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    if (isDev) {
      console.warn(
        `[NexaSphere Configuration Warning]: The following environment variables are missing or undefined: ${missing.join(', ')}. ` +
          `Please check your local .env.local file. Defaulting values for development.`
      );
    } else {
      console.error(
        `[NexaSphere Critical Error]: Missing required production environment variables: ${missing.join(', ')}`
      );
    }
  }
}
