import '@testing-library/jest-dom/vitest';

import { initializeDb, resetDb } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';

// React Router 7 creates a Request with an AbortSignal during programmatic
// navigation. In the JSDOM test environment, AbortSignal is JSDOM's version
// which is not recognized by Node's native Request constructor. Patch Request
// to strip the incompatible signal before forwarding to the native constructor.
const NativeRequest = globalThis.Request;
globalThis.Request = class PatchedRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal && !(init.signal instanceof NativeRequest.prototype.constructor)) {
      try {
        super(input, init);
      } catch (e: any) {
        if (e?.message?.includes('AbortSignal') || e?.message?.includes('signal')) {
          const { signal: _, ...safeInit } = init;
          super(input, safeInit);
        } else {
          throw e;
        }
      }
    } else {
      super(input, init);
    }
  }
} as any;

vi.mock('zustand');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  const ResizeObserverMock = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);

  window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  window.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

  initializeDb();
});
afterEach(() => {
  server.resetHandlers();
  resetDb();
});
