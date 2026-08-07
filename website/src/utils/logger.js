const isProduction = process.env.NODE_ENV === 'production' || import.meta.env?.PROD;

const logger = {
  info: (...args) => {
    console.info(...args);
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
};

export default logger;
