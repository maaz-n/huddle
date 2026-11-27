import { randomUUID } from "crypto";
import { relations, sql } from "drizzle-orm";
import type { NotificationMetadata, NotificationType } from "../types/types";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<"admin" | "member" | "owner">().notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (table) => [
    // A user can only have one membership per workspace.
    uniqueIndex("workspace_member_unique_idx").on(
      table.workspaceId,
      table.userId,
    ),
    // Listing the workspaces a user belongs to.
    index("workspace_members_userId_idx").on(table.userId),
    // A workspace can never have more than one owner.
    uniqueIndex("workspace_single_owner_idx")
      .on(table.workspaceId)
      .where(sql`${table.role} = 'owner'`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull()
      .$type<"todo" | "in_review" | "done">()
      .default("todo"),
    priority: text("priority").notNull()
      .$type<"low" | "medium" | "high">()
      .default("medium"),
      revisionNote: text("revision_note"),
    dueDate: text("due_date").notNull(),
    assigneeId: text("assignee_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdBy: text("created_by").notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tasks_workspaceId_idx").on(table.workspaceId),
    index("tasks_assigneeId_idx").on(table.assigneeId),
    index("tasks_status_idx").on(table.status),
  ],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // The task detail modal reads one task's thread oldest first.
    index("task_comments_taskId_createdAt_idx").on(
      table.taskId,
      table.createdAt,
    ),
    index("task_comments_workspaceId_idx").on(table.workspaceId),
  ],
);

export const labels = pgTable(
  "labels",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("slate"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("labels_workspaceId_name_idx").on(
      table.workspaceId,
      table.name,
    ),
  ],
);

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);

export const subtasks = pgTable(
  "subtasks",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("subtasks_taskId_createdAt_idx").on(table.taskId, table.createdAt),
    index("subtasks_workspaceId_idx").on(table.workspaceId),
  ],
);

export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    // Bytes are stored base64-encoded so the app stays on the Neon HTTP
    // driver without a separate object-storage provider.
    size: integer("size").notNull(),
    data: text("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("task_attachments_taskId_createdAt_idx").on(
      table.taskId,
      table.createdAt,
    ),
    index("task_attachments_workspaceId_idx").on(table.workspaceId),
  ],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade"}),
    actorId: text("actor_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<{
      entityName?: string,
      oldName?: string,
      oldStatus?: string,
      newStatus?: string,
      note?: string,
      comment?: string,
      role?: string,
      oldRole?: string,
      email?: string,
      assigneeId?: string,
      assigneeName?: string
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // The dashboard reads the newest entries for one workspace.
    index("activity_logs_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<"admin" | "member">().notNull(),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("workspace_invitations_workspaceId_idx").on(table.workspaceId),
    // One active invitation per email per workspace; expired ones may be resent.
    uniqueIndex("workspace_invitations_pending_email_idx")
      .on(table.workspaceId, table.email)
      .where(sql`${table.acceptedAt} is null`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    entityType: text("entity_type").$type<"task" | "workspace">().notNull(),
    entityId: text("entity_id").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    metadata: jsonb("metadata").$type<NotificationMetadata>(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // The bell reads the newest notifications for one user.
    index("notifications_userId_createdAt_idx").on(
      table.userId,
      table.createdAt,
    ),
    // The unread badge only ever counts rows where read_at is null.
    index("notifications_userId_unread_idx")
      .on(table.userId)
      .where(sql`${table.readAt} is null`),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  user: one(user, {
    fields: [tasks.assigneeId],
    references: [user.id]
  }),
  labels: many(taskLabels),
  attachments: many(taskAttachments),
  subtasks: many(subtasks),
}))

export const subtaskRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
  author: one(user, {
    fields: [subtasks.authorId],
    references: [user.id],
  }),
}))

export const taskAttachmentRelations = relations(
  taskAttachments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskAttachments.taskId],
      references: [tasks.id],
    }),
    uploader: one(user, {
      fields: [taskAttachments.uploaderId],
      references: [user.id],
    }),
  }),
)

export const labelRelations = relations(labels, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [labels.workspaceId],
    references: [workspaces.id],
  }),
  taskLabels: many(taskLabels),
}))

export const taskLabelRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}))