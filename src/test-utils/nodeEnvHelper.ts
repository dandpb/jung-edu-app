/**
 * Helper to safely set NODE_ENV in tests
 */
export function setNodeEnv(value: string): void {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}

/**
 * Helper to restore NODE_ENV after tests
 */
export function restoreNodeEnv(originalValue: string | undefined): void {
  if (originalValue !== undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalValue,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
}