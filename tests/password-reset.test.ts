import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { verification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requestPasswordReset, resetPassword } from "@/actions/auth";
import {
  cleanupTestFixture,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

const NEW_PASSWORD = "NewPassword123!";

describe("Password reset", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
  });

  afterEach(async () => {
    await db
      .delete(verification)
      .where(
        inArray(verification.value, [fixture.userA.id, fixture.userB.id]),
      );
    await cleanupTestFixture(fixture);
  });

  async function resetTokenFor(userId: string) {
    const rows = await db
      .select()
      .from(verification)
      .where(sql`${verification.identifier} like 'reset-password:%'`);

    return rows.find((row) => row.value === userId)?.identifier.replace(
      "reset-password:",
      "",
    );
  }

  it("sends a token that can be used to set a new password", async () => {
    const requested = await requestPasswordReset(fixture.userA.email);
    expect(requested.success).toBe(true);

    const token = await resetTokenFor(fixture.userA.id);
    expect(token).toBeTruthy();

    const reset = await resetPassword(token!, NEW_PASSWORD);
    expect(reset.success).toBe(true);

    const signedIn = await auth.api.signInEmail({
      body: { email: fixture.userA.email, password: NEW_PASSWORD },
    });
    expect(signedIn.user.id).toBe(fixture.userA.id);
  });

  it("returns the same result for an unknown email", async () => {
    const response = await requestPasswordReset("no-one@test.local");

    expect(response.success).toBe(true);
    expect(response.message).toContain("check your inbox");
  });

  it("rejects an invalid token", async () => {
    const response = await resetPassword("not-a-token", NEW_PASSWORD);

    expect(response.success).toBe(false);
  });

  it("rejects a password that is too short", async () => {
    await requestPasswordReset(fixture.userA.email);
    const token = await resetTokenFor(fixture.userA.id);

    const response = await resetPassword(token!, "short");

    expect(response.success).toBe(false);
  });
});
