// Utility function za production-safe logging
export const devLog = (message, ...args) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

export const devWarn = (message, ...args) => {
  if (import.meta.env.DEV) {
    console.warn(message, ...args);
  }
};

export const devError = (message, ...args) => {
  // Error se uvek prikazuje
  console.error(message, ...args);
};