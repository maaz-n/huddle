import { z } from "zod";

export const idSchema = z.string().trim().min(1, "Missing id");

export const nameSchema = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(1, "Name cannot be empty")
  .max(100, "Name is too long");

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const memberRoleSchema = z
  .string()
  .refine(
    (value): value is "admin" | "member" =>
      value === "admin" || value === "member",
    { message: "Role must be admin or member" },
  );

export const taskStatusSchema = z
  .string()
  .refine(
    (value): value is "todo" | "in_review" | "done" =>
      value === "todo" || value === "in_review" || value === "done",
    { message: "Invalid task status" },
  );

export const taskPrioritySchema = z
  .string()
  .refine(
    (value): value is "low" | "medium" | "high" =>
      value === "low" || value === "medium" || value === "high",
    { message: "Invalid task priority" },
  );

export const taskIdListSchema = z
  .array(idSchema)
  .min(1, "Select at least one task")
  .max(100, "Select at most 100 tasks");

export const taskSortSchema = z
  .string()
  .refine(
    (value): value is "updated" | "due" | "priority" | "title" =>
      value === "updated" || value === "due" || value === "priority" || value === "title",
    { message: "Invalid sort order" },
  );

export const taskSearchSchema = z
  .string()
  .trim()
  .max(100, "Search query is too long");

export const taskTitleSchema = z
  .string({ required_error: "Title is required" })
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title is too long");

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description is too long");

export const noteSchema = z
  .string({ required_error: "Note is required" })
  .trim()
  .min(1, "Note cannot be empty")
  .max(2000, "Note is too long");

export const dueDateSchema = z
  .string({ required_error: "Due date is required" })
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid due date");

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const tokenSchema = z
  .string({ required_error: "Token is required" })
  .trim()
  .min(1, "Invalid or missing token")
  .max(200, "Invalid token");

export const commentSchema = z
  .string({ required_error: "Comment is required" })
  .trim()
  .min(1, "Comment cannot be empty")
  .max(2000, "Comment is too long");

export const createTaskSchema = z.object({
  workspaceId: idSchema,
  title: taskTitleSchema,
  description: taskDescriptionSchema.nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: idSchema,
  dueDate: dueDateSchema,
});

export function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
