export type UserTypeNew = {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

export type UserWithRole = {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role: "owner" | "admin" | "member" | null
}

export type GetFilteredTasks = {
  status: "todo" | "in_review" | "done",
  priority: "low" | "medium" | "high",
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
  dueDate: string | null,
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
  dueDate: string | undefined
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
  image: string | null
}