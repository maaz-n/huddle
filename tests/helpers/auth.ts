import { vi } from 'vitest';
import { auth } from '@/lib/auth';

export type MockUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} | null;

let currentSessionUser: MockUser = null;
let getSessionSpy: ReturnType<typeof vi.spyOn> | null = null;

export function buildSessionPayload(user: NonNullable<MockUser>) {
  const now = new Date();
  return {
    session: {
      id: `session_${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: `token_${user.id}`,
      createdAt: now,
      updatedAt: now,
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? 'Test User',
      image: user.image ?? null,
      emailVerified: user.emailVerified ?? true,
      createdAt: user.createdAt ?? now,
      updatedAt: user.updatedAt ?? now,
    },
  };
}

/**
 * Initializes or re-attaches the auth.api.getSession spy.
 */
export function initAuthMock() {
  if (!getSessionSpy) {
    getSessionSpy = vi.spyOn(auth.api, 'getSession');
  }

  getSessionSpy.mockImplementation(async () => {
    if (!currentSessionUser) return null;
    return buildSessionPayload(
      currentSessionUser,
    ) as unknown as Awaited<ReturnType<typeof auth.api.getSession>>;
  });

  return getSessionSpy;
}

/**
 * Sets the active user for the session lookup.
 * All subsequent calls to requireUser(), getCurrentUser(), and requireWorkspaceAccess()
 * will act as this user. Pass null to simulate an unauthenticated request.
 */
export function actAs(user: MockUser) {
  currentSessionUser = user;
  initAuthMock();
}

/**
 * Convenience alias for actAs.
 */
export function mockSession(user: MockUser) {
  actAs(user);
}

/**
 * Clears the session lookup (simulates logged out / unauthenticated).
 */
export function clearSession() {
  actAs(null);
}

/**
 * Returns the currently active mock user.
 */
export function getCurrentMockUser(): MockUser {
  return currentSessionUser;
}
