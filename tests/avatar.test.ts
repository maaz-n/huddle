import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user, userAvatars } from "@/db/schema";
import { removeAvatar, uploadAvatar } from "@/actions/avatar";
import { GET as getAvatar } from "@/app/api/avatars/[userId]/route";
import { deleteObject, getObjectUrl, putObject } from "@/lib/storage";
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
  getObjectUrl: vi.fn(async () => "https://storage.neon.test/signed-avatar"),
  avatarKey: (userId: string) => `avatars/${userId}`,
  attachmentKey: (id: string) => `attachments/${id}`,
}));

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function imageForm(
  contents: Uint8Array = PNG,
  type = "image/png",
  name = "avatar.png",
) {
  const formData = new FormData();
  // Copy into a fresh ArrayBuffer so the File keeps exact byte values.
  const bytes = new Uint8Array(contents).buffer as ArrayBuffer;
  formData.set("file", new File([bytes], name, { type }));
  return formData;
}

describe("Avatar upload", () => {
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

  it("stores the image in object storage and keeps only metadata in the DB", async () => {
    actAs(fixture.userA);

    const result = await uploadAvatar(imageForm());
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBe(`/api/avatars/${fixture.userA.id}`);

    const stored = await db.query.userAvatars.findFirst({
      where: eq(userAvatars.userId, fixture.userA.id),
    });
    expect(stored?.mimeType).toBe("image/png");
    expect(stored?.size).toBe(PNG.length);
    expect(stored?.objectKey).toBe(`avatars/${fixture.userA.id}`);
    expect("data" in stored!).toBe(false);

    expect(putObject).toHaveBeenCalledTimes(1);
    const [params] = vi.mocked(putObject).mock.calls[0];
    expect(params.key).toBe(`avatars/${fixture.userA.id}`);
    expect(params.contentType).toBe("image/png");
    expect(Buffer.from(params.body)).toEqual(Buffer.from(PNG));

    const [updated] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, fixture.userA.id));
    expect(updated.image).toBe(`/api/avatars/${fixture.userA.id}`);
  });

  it("redirects the avatar route to a signed object URL", async () => {
    actAs(fixture.userA);
    await uploadAvatar(imageForm());

    // A different signed-in user may view another member's avatar.
    actAs(fixture.userB);
    const response = await getAvatar(
      new Request("http://localhost/api/avatars"),
      { params: Promise.resolve({ userId: fixture.userA.id }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://storage.neon.test/signed-avatar",
    );
    expect(getObjectUrl).toHaveBeenCalledWith(
      `avatars/${fixture.userA.id}`,
      expect.objectContaining({ expiresIn: 3600 }),
    );
  });

  it("hides avatars from signed-out requests", async () => {
    actAs(fixture.userA);
    await uploadAvatar(imageForm());

    clearSession();
    const response = await getAvatar(
      new Request("http://localhost/api/avatars"),
      { params: Promise.resolve({ userId: fixture.userA.id }) },
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when no avatar has been uploaded", async () => {
    actAs(fixture.userA);

    const response = await getAvatar(
      new Request("http://localhost/api/avatars"),
      { params: Promise.resolve({ userId: fixture.userA.id }) },
    );

    expect(response.status).toBe(404);
  });

  it("replaces an existing object at the same key", async () => {
    actAs(fixture.userA);
    await uploadAvatar(imageForm());

    const replacement = new Uint8Array([1, 2, 3, 4]);
    const result = await uploadAvatar(
      imageForm(replacement, "image/webp", "new.webp"),
    );
    expect(result.success).toBe(true);

    const rows = await db
      .select()
      .from(userAvatars)
      .where(eq(userAvatars.userId, fixture.userA.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].mimeType).toBe("image/webp");
    expect(rows[0].objectKey).toBe(`avatars/${fixture.userA.id}`);

    expect(vi.mocked(putObject).mock.calls.map(([call]) => call.key)).toEqual([
      `avatars/${fixture.userA.id}`,
      `avatars/${fixture.userA.id}`,
    ]);
  });

  it("rejects non-image files", async () => {
    actAs(fixture.userA);

    const result = await uploadAvatar(imageForm(PNG, "text/plain"));
    expect(result.success).toBe(false);
    expect(putObject).not.toHaveBeenCalled();

    const rows = await db
      .select()
      .from(userAvatars)
      .where(eq(userAvatars.userId, fixture.userA.id));
    expect(rows).toHaveLength(0);
  });

  it("rejects files over 2 MB", async () => {
    actAs(fixture.userA);

    const result = await uploadAvatar(
      imageForm(new Uint8Array(2 * 1024 * 1024 + 1)),
    );
    expect(result.success).toBe(false);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("rejects a missing file", async () => {
    actAs(fixture.userA);

    const result = await uploadAvatar(new FormData());
    expect(result.success).toBe(false);
  });

  it("requires a signed-in user", async () => {
    clearSession();

    const result = await uploadAvatar(imageForm());
    expect(result.success).toBe(false);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("removes the metadata and deletes the object", async () => {
    actAs(fixture.userA);
    await uploadAvatar(imageForm());

    const result = await removeAvatar();
    expect(result.success).toBe(true);
    expect(deleteObject).toHaveBeenCalledWith(`avatars/${fixture.userA.id}`);

    const rows = await db
      .select()
      .from(userAvatars)
      .where(eq(userAvatars.userId, fixture.userA.id));
    expect(rows).toHaveLength(0);

    const [updated] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, fixture.userA.id));
    expect(updated.image).toBeNull();
  });
});
