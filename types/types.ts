export type UserTypeNew = {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  emailNotifications?: boolean;
}

export type UserWithRole = {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role: "owner" | "admin" | "member" | null
}

export type GetFilteredTasks = {
  status: "todo" | "in_review" | "done" | "",
  priority: "low" | "medium" | "high" | "",
  assignee: string
}

export type TasksWithAssignees = {
  id: string,
  workspaceId: string,
  title: string,
  description: string | null,
  status: "todo" | "in_review" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string,
  dueDate: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date,
  revisionNote?: string | null,
  user?: {
    id: string,
    name: string,
    email: string,
    image: string | null
  }
}

export type InsertTask = {
  workspaceId: string,
  title: string,
  description: string | null,
  status: "todo" | "in_review" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string,
  dueDate: string
}

export type WorkspaceWithRole = {
  workspaceId: string,
  workspaceName: string,
  role: "owner" | "admin" | "member"
}

export type WorkspaceUser = {
  id: string
  name: string
  email: string
  role: string
}

export type Workspace = {
  id: string;
  name: string,
  ownerId: string,
}

export type Actor = {
  name: string,
  image: string | null | undefined
}

export type NotificationType =
  | "task_assigned"
  | "task_submitted"
  | "task_completed"
  | "changes_requested"
  | "workspace_added"
  | "role_changed"
  | "invitation_accepted"

export type NotificationMetadata = {
  taskId?: string
  taskTitle?: string
  workspaceName?: string
  role?: string
}

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  workspaceId: string
  entityType: "task" | "workspace"
  entityId: string
  readAt: string | null
  createdAt: string
}