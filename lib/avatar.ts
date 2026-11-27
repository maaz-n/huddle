export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export const ALLOWED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const

export function avatarUrl(userId: string) {
  return `/api/avatars/${userId}`
}
