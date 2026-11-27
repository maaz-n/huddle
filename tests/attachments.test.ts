import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, taskAttachments, workspaceMembers } from "@/db/schema";
import {
  deleteTaskAttachment,
  getTaskAttachments,
  uploadTaskAttachment,
} from "@/actions/attachments";
import { GET as downloadAttachment } from "@/app/api/attachments/[id]/route";
import { deleteObject, getObjectUrl, putObject } from "@/lib/storage";
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

vi.mock("@/lib/storage", () => ({
  putObject: vi.fn(async () => {}),
  deleteObject: vi.fn(async () => {}),
  getObjectUrl: vi.fn(async () => "https://storage.neon.test/signed-file"),
  avatarKey: (userId: string) => `avatars/${userId}`,
  attachmentKey: (id: string) => `attachments/${id}`,
}));

function uploadForm(contents: string, name: string, type = "text/plain") {
  const formData = new FormData();
  formData.set("file", new File([contents], name, { type }));
  return formData;
}

describe("Task attachments", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    vi.clearAllMocks();
    fixture = await createTwoUsersAndWorkspaces();
  });

  afterEach(async () => {
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  it("stores bytes in object storage and keeps only metadata in the DB", async () => {
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
    expect(stored?.objectKey).toBe(`attachments/${result.attachment!.id}`);

    expect(putObject).toHaveBeenCalledTimes(1);
    const [params] = vi.mocked(putObject).mock.calls[0];
    expect(params.key).toBe(`attachments/${result.attachment!.id}`);
    expect(params.contentType).toBe("text/plain");
    expect(Buffer.from(params.body).toString()).toBe("hello");

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

  it("redirects downloads to a signed object URL for workspace members", async () => {
    actAs(fixture.userA);
    const uploaded = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    actAs(fixture.userB);
    const response = await downloadAttachment(
      new Request("http://localhost/api/attachments"),
      { params: Promise.resolve({ id: uploaded.attachment!.id }) },
    );

    expect(response.status).toBe(404); // userB is not a member of workspace A
    expect(getObjectUrl).not.toHaveBeenCalled();

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });

    const allowed = await downloadAttachment(
      new Request("http://localhost/api/attachments"),
      { params: Promise.resolve({ id: uploaded.attachment!.id }) },
    );

    expect(allowed.status).toBe(302);
    expect(allowed.headers.get("location")).toBe(
      "https://storage.neon.test/signed-file",
    );
    expect(getObjectUrl).toHaveBeenCalledWith(
      `attachments/${uploaded.attachment!.id}`,
      expect.objectContaining({ expiresIn: 60 }),
    );
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
    expect(putObject).not.toHaveBeenCalled();
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
    expect(putObject).not.toHaveBeenCalled();

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
        objectKey: `attachments/seed-${index}`,
      })),
    );

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "overflow.txt"),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("at most");
    expect(putObject).not.toHaveBeenCalled();
  });

  it("lets the uploader delete the attachment and its object", async () => {
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
    expect(deleteObject).toHaveBeenCalledWith(
      `attachments/${uploaded.attachment!.id}`,
    );
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
    expect(deleteObject).not.toHaveBeenCalled();
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
    expect(deleteObject).toHaveBeenCalledWith(
      `attachments/${uploaded.attachment!.id}`,
    );
  });

  it("rejects uploads from users outside the workspace", async () => {
    actAs(fixture.userB);

    const result = await uploadTaskAttachment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      uploadForm("hello", "notes.txt"),
    );

    expect(result.success).toBe(false);
    expect(putObject).not.toHaveBeenCalled();
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
    expect(deleteObject).not.toHaveBeenCalled();
    const stored = await db.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, uploaded.attachment!.id),
    });
    expect(stored).toBeDefined();
  });
});
