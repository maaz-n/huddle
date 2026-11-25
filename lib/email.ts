export type SendEmailResult = {
  success: boolean;
  message?: string;
};

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Huddle <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY is not set; skipping "${subject}" to ${to}`);
    return { success: false, message: "Email service is not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[email] Resend rejected the email (${response.status}):`, detail);
      return { success: false, message: "Could not send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("[email] Could not send email:", error);
    return { success: false, message: "Could not send email" };
  }
}
