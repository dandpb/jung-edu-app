/**
 * Mock implementations for crypto APIs in test environment
 */

// Mock subtle crypto for JWT operations
export const mockSubtle = {
  importKey: jest.fn().mockResolvedValue('mock-key'),
  sign: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  verify: jest.fn().mockResolvedValue(true),
  encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  generateKey: jest.fn().mockResolvedValue('mock-generated-key'),
  digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  deriveKey: jest.fn().mockResolvedValue('mock-derived-key'),
  wrapKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  unwrapKey: jest.fn().mockResolvedValue('mock-unwrapped-key')
};

// Mock crypto.getRandomValues
export const mockGetRandomValues = jest.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

// Setup crypto mocks
export function setupCryptoMocks() {
  // Mock crypto.subtle
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: mockSubtle,
      getRandomValues: mockGetRandomValues
    },
    writable: true
  });

  // Mock TextEncoder/TextDecoder for crypto operations
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = class MockTextEncoder {
      readonly encoding = 'utf-8';
      
      encode(str: string): Uint8Array {
        return new Uint8Array(Buffer.from(str, 'utf-8'));
      }
      
      encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
        const encoded = this.encode(source);
        const written = Math.min(encoded.length, destination.length);
        destination.set(encoded.subarray(0, written));
        return { read: source.length, written };
      }
    } as any;
  }

  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = class MockTextDecoder {
      readonly encoding: string;
      readonly fatal: boolean;
      readonly ignoreBOM: boolean;
      
      constructor(encoding = 'utf-8', options: TextDecoderOptions = {}) {
        this.encoding = encoding;
        this.fatal = options.fatal || false;
        this.ignoreBOM = options.ignoreBOM || false;
      }
      
      decode(input?: BufferSource, options?: TextDecodeOptions): string {
        if (!input) return '';
        return Buffer.from(input as ArrayBuffer).toString('utf-8');
      }
    } as any;
  }

  // Mock btoa/atob if not available
  if (typeof global.btoa === 'undefined') {
    global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  }

  if (typeof global.atob === 'undefined') {
    global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
  }
}

// Cleanup crypto mocks
export function cleanupCryptoMocks() {
  jest.clearAllMocks();
}