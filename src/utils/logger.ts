import { logger, consoleTransport } from 'react-native-logs';

const defaultConfig = {
  severity: __DEV__ ? 'debug' : 'error',
  transport: __DEV__ ? [consoleTransport] : [],
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
};

const log = logger.createLogger(defaultConfig);

// Custom API logger that shows in Metro terminal
export const apiLogger = {
  request: (method: string, url: string, params?: any) => {
    const message = `🌤️ API Request: ${method} ${url}`;
    log.info(message);
    // Force log to Metro terminal using console.warn
    console.warn(`[API] ${message}`, params ? `Params: ${JSON.stringify(params)}` : '');
  },
  
  response: (status: number, url: string, data?: any) => {
    const message = `✅ API Response: ${status} ${url}`;
    log.info(message);
    console.warn(`[API] ${message}`, data ? `Data: ${JSON.stringify(data).substring(0, 100)}...` : '');
  },
  
  error: (error: any, url?: string) => {
    const message = `❌ API Error: ${error.message}`;
    log.error(message);
    console.warn(`[API ERROR] ${message}`, url ? `URL: ${url}` : '');
  },
  
  info: (message: string, data?: any) => {
    log.info(message);
    console.warn(`[INFO] ${message}`, data || '');
  }
};

export default log;