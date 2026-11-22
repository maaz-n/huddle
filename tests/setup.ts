import { vi } from 'vitest';
import { initAuthMock } from './helpers/auth';

// Mock next/headers for all test suites
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Initialize auth session lookup mock
initAuthMock();
