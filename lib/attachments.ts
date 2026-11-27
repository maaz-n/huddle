export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_TASK = 20

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
