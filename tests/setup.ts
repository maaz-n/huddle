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

// Tests must never send real email. Suites that care about delivery can
// import sendEmail from "@/lib/email" and assert on this mock.
vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>();
  return {
    ...actual,
    sendEmail: vi.fn(async () => ({ success: true })),
  };
});

// Initialize auth session lookup mock
initAuthMock();
