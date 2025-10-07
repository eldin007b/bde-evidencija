// Production-safe logging utility
const ENV_MODE = import.meta.env.MODE || 'production';

export const logger = {
  log: (...args) => {
    if (ENV_MODE === 'development') {
      console.log(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    if (ENV_MODE === 'development') {
      console.info(...args);
    }
  }
};

export default logger;