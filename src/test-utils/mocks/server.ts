import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

/**
 * MSW server instance for Node.js test environment
 */
export const server = setupServer(...handlers);

/**
 * Utility to temporarily override handlers for specific tests
 */
export const useErrorHandlers = () => {
  server.use(...errorHandlers);
};

/**
 * Utility to add delay to all requests for testing loading states
 */
export const useDelayedHandlers = () => {
  // For MSW v2, we would need to create delayed handlers differently
  // This is left as a placeholder for future implementation
  console.warn('Delayed handlers not implemented for MSW v2');
};