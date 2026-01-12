export type UserType = {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  email: string;
  emailVerified?: boolean;
  name: string;
  image?: string | null | undefined;
}

export type GetFilteredTasks = {
  status: "todo" | "in_progress" | "blocked" | "done",
  priority: "low" | "medium" | "high",
  assignee: string
}

export type TasksWithAssignees = {
  id: string,
  workspaceId: string,
  title: string,
  description: string | null,
  status: "todo" | "in_progress" | "blocked" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date,
  user: {
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
  status: "todo" | "in_progress" | "blocked" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string
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

export type Actor = {
  name: string,
  image: string | null
}