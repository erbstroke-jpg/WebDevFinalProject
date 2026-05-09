type Level = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<Level, string> = {
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[90m',  // gray
};
const reset = '\x1b[0m';

const log = (level: Level, ...args: unknown[]) => {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`${colors[level]}[${time}] [${level.toUpperCase()}]${reset}`, ...args);
};

export const logger = {
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
  debug: (...args: unknown[]) => log('debug', ...args),
};