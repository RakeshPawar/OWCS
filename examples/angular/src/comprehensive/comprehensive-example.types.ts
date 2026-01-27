/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Status enum
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Complex nested configuration
 */
export interface Configuration {
  /** API endpoint URL */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Enable retry logic */
  retry?: boolean;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * User data structure
 */
export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

/**
 * Action event payload
 */
export interface ActionPayload {
  action: string;
  payload?: any;
  timestamp: number;
}

/**
 * Data load event payload
 */
export interface DataLoadPayload {
  data: any[];
  count: number;
}

/**
 * Error event payload
 */
export interface ErrorPayload {
  message: string;
  stack?: string;
}
