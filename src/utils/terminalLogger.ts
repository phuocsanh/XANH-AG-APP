// Terminal Logger - Override console methods to show logs in Metro terminal

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Custom logger that forces logs to appear in Metro terminal
export const setupTerminalLogger = () => {
  // Override console.log to also use console.warn (which shows in Metro)
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    // Force log to Metro terminal using console.warn
    originalConsole.warn('[LOG]', ...args);
  };

  // Override console.info to also use console.warn
  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    originalConsole.warn('[INFO]', ...args);
  };

  // Keep console.warn and console.error as they already show in Metro
  console.warn = (...args: any[]) => {
    originalConsole.warn('[WARN]', ...args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error('[ERROR]', ...args);
  };
};

// Restore original console methods
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
};

// Simple API logger for terminal
export const terminalApiLogger = {
  request: (method: string, url: string, params?: any) => {
    console.warn(`[API REQUEST] 🌤️ ${method} ${url}`, params ? JSON.stringify(params) : '');
  },
  
  response: (status: number, url: string, data?: any) => {
    console.warn(`[API RESPONSE] ✅ ${status} ${url}`, data?.name || data?.city?.name || 'Success');
  },
  
  error: (error: any, url?: string) => {
    console.warn(`[API ERROR] ❌ ${error.message}`, url || '');
  }
};