import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  activityLogs,
  taskAttachments,
  workspaceMembers,
} from "@/db/schema";
import {
  deleteTaskAttachment,
  getTaskAttachments,
  uploadTaskAttachment,
} from "@/actions/attachments";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_TASK,
} from "@/lib/attachments";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

function uploadForm(contents: string, name: string, type = "text/plain") {
  const formData = new FormData();
  formData.set("file", new File([contents], name, { type }));
  return formData;
}

describe("Task attachments", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
  });

  afterEach(async () => {
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  it("stores an upload and lists only its metadata", async () => {
    actAs(fixture.userA);

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    expect(result.success).toBe(true);
    expect(result.attachment?.fileName).toBe("notes.txt");
    expect(result.attachment?.size).toBe(5);
    expect(result.attachment?.uploaderName).toBe(fixture.userA.name);

    const list = await getTaskAttachments(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );
    expect(list).toHaveLength(1);
    expect("data" in list[0]).toBe(false);

    const stored = await db.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, result.attachment!.id),
    });
    expect(Buffer.from(stored!.data, "base64").toString()).toBe("hello");

    const [log] = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.entityId, fixture.taskA.id),
          eq(activityLogs.action, "TASK_ATTACHMENT_ADDED"),
        ),
      );
    expect(log.metadata?.entityName).toBe("notes.txt");
  });

  it("sanitizes path separators in the file name", async () => {
    actAs(fixture.userA);

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("x", "../../evil.txt"),
    );

    expect(result.success).toBe(true);
    expect(result.attachment?.fileName).toBe(".._.._evil.txt");
  });

  it("rejects files over the size limit", async () => {
    actAs(fixture.userA);

    const formData = new FormData();
    formData.set(
      "file",
      new File([new Uint8Array(MAX_ATTACHMENT_BYTES + 1)], "big.bin"),
    );

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      formData,
    );

    expect(result.success).toBe(false);
    const list = await getTaskAttachments(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );
    expect(list).toHaveLength(0);
  });

  it("rejects an empty file", async () => {
    actAs(fixture.userA);

    const formData = new FormData();
    formData.set("file", new File([], "empty.txt"));

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      formData,
    );

    expect(result.success).toBe(false);
  });

  it("will not attach to a task in another workspace", async () => {
    actAs(fixture.userA);

    const result = await uploadTaskAttachment(
      fixture.taskB.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    expect(result.success).toBe(false);

    const stored = await db.query.taskAttachments.findMany({
      where: eq(taskAttachments.workspaceId, fixture.workspaceA.id),
    });
    expect(stored).toHaveLength(0);
  });

  it("enforces the per-task attachment limit", async () => {
    actAs(fixture.userA);

    await db.insert(taskAttachments).values(
      Array.from({ length: MAX_ATTACHMENTS_PER_TASK }, (_, index) => ({
        taskId: fixture.taskA.id,
        workspaceId: fixture.workspaceA.id,
        uploaderId: fixture.userA.id,
        fileName: `file-${index}.txt`,
        mimeType: "text/plain",
        size: 2,
        data: "aGk=",
      })),
    );

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "overflow.txt"),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("at most");
  });

  it("lets the uploader delete their own attachment", async () => {
    actAs(fixture.userA);
    const uploaded = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    const result = await deleteTaskAttachment(
      uploaded.attachment!.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(true);
    const list = await getTaskAttachments(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );
    expect(list).toHaveLength(0);

    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, "TASK_ATTACHMENT_REMOVED"));
    expect(logs).toHaveLength(1);
  });

  it("stops a member deleting someone else's attachment", async () => {
    actAs(fixture.userA);
    const uploaded = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
    actAs(fixture.userB);

    const result = await deleteTaskAttachment(
      uploaded.attachment!.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(false);
    const stored = await db.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, uploaded.attachment!.id),
    });
    expect(stored).toBeDefined();
  });

  it("lets an admin delete someone else's attachment", async () => {
    actAs(fixture.userA);
    const uploaded = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "admin",
    });
    actAs(fixture.userB);

    const result = await deleteTaskAttachment(
      uploaded.attachment!.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(true);
  });

  it("rejects uploads from users outside the workspace", async () => {
    actAs(fixture.userB);

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    expect(result.success).toBe(false);
  });

  it("does not delete an attachment through another workspace id", async () => {
    actAs(fixture.userA);
    const uploaded = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    const result = await deleteTaskAttachment(
      uploaded.attachment!.id,
      fixture.workspaceB.id,
    );

    expect(result.success).toBe(false);
    const stored = await db.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, uploaded.attachment!.id),
    });
    expect(stored).toBeDefined();
  });
});
