export type TaskStatus = "todo" | "in_review" | "done";
export type WorkspaceRole = "owner" | "admin" | "member";

interface TransitionInput {
  role: WorkspaceRole;
  isAssignee: boolean;
  from: TaskStatus;
  to: TaskStatus;
}

/**
 * The review workflow is:
 *
 *   todo -> in_review -> done
 *                 \-> todo (changes requested)
 *
 * Members may only submit their own todo tasks for review. Managers may
 * submit, approve, request changes, and reopen tasks.
 */
export function canTransition({
  role,
  isAssignee,
  from,
  to,
}: TransitionInput): boolean {
  if (from === to) return false;

  if (role === "member") {
    return isAssignee && from === "todo" && to === "in_review";
  }

  if (from === "todo") return to === "in_review";
  if (from === "in_review") return to === "done" || to === "todo";
  if (from === "done") return to === "todo";

  return false;
}

/**
 * The next status the primary action button should apply, or null when the
 * current user has no available action.
 */
export function getNextStatus(
  role: WorkspaceRole,
  from: TaskStatus,
): TaskStatus | null {
  if (from === "todo") return "in_review";
  if (from === "in_review") return role === "member" ? null : "done";
  return null;
}
