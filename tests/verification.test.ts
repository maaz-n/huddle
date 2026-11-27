import { describe, it, expect, vi, afterEach } from "vitest";

import { auth } from "@/lib/auth";
import { resendVerificationEmail } from "@/actions/auth";
import { verificationEmail } from "@/lib/email-templates";

describe("Email verification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires verification before sign-in", () => {
    const options = auth.options as {
      emailAndPassword?: { requireEmailVerification?: boolean };
      emailVerification?: { sendOnSignUp?: boolean };
    };
    expect(options.emailAndPassword?.requireEmailVerification).toBe(true);
    expect(options.emailVerification?.sendOnSignUp).toBe(true);
  });

  it("renders the verification link in the email template", () => {
    const html = verificationEmail("https://huddle.test/verify?token=abc&x=1");
    expect(html).toContain("https://huddle.test/verify?token=abc&amp;x=1");
    expect(html).toContain("Verify your email");
  });

  it("sends a fresh verification link to a normalized address", async () => {
    const send = vi
      .spyOn(auth.api, "sendVerificationEmail")
      .mockResolvedValue({ status: true } as never);

    const result = await resendVerificationEmail("  Person@Test.Local  ");

    expect(result.success).toBe(true);
    expect(send).toHaveBeenCalledWith({
      body: { email: "person@test.local" },
    });
  });

  it("rejects an invalid email without calling the API", async () => {
    const send = vi
      .spyOn(auth.api, "sendVerificationEmail")
      .mockResolvedValue({ status: true } as never);

    const result = await resendVerificationEmail("not-an-email");

    expect(result.success).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a failed send", async () => {
    vi.spyOn(auth.api, "sendVerificationEmail").mockRejectedValue(
      new Error("mail down"),
    );

    const result = await resendVerificationEmail("person@test.local");

    expect(result.success).toBe(false);
  });
});
