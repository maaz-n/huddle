type Role = "admin" | "member" | "viewer";

export function canManageTasks(role: Role) {
  return role === "admin" || role === "member";
}

export function canManageWorkspace(role: Role) {
  return role === "admin";
}
