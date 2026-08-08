export function validateEnvironment() {
  const required = ['CORS_ORIGIN', 'ADMIN_EVENT_PASSWORD', 'JWT_SECRET', 'ENCRYPTION_KEY'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    if (process.env.NODE_ENV === 'test') {
      missing.forEach((key) => {
        process.env[key] = 'mock_' + key;
      });
    } else {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  if (missing.length && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
