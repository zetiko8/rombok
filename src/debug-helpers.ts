export const logger = {
  logLevel: 0,
  debug (...args: unknown[]): void {
    if (this.logLevel > 3) console.log(...args);
  },
  log (...args: unknown[]): void {
    if (this.logLevel > 2) console.log(...args);
  },
  warn (...args: unknown[]): void {
    if (this.logLevel > 1) console.log(...args);
  },
  error (...args: unknown[]): void {
    if (this.logLevel > 0) console.log(...args);
  },
};