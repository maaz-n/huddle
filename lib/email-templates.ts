import { escapeHtml } from "./email";

function wrap(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 8px;font-size:20px;">Huddle</h1>
        <h2 style="margin:0 0 24px;font-size:18px;">${escapeHtml(title)}</h2>
        ${content}
        <p style="margin:24px 0 0;font-size:12px;color:#71717a;">If you did not expect this email, you can safely ignore it.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(url: string): string {
  return wrap(
    "Verify your email",
    `<p style="margin:0 0 20px;line-height:1.5;">Verify your email address to finish setting up your Huddle account.</p>
     <p style="margin:0 0 24px;"><a href="${escapeHtml(url)}" style="background:#18181b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Verify email</a></p>
     <p style="margin:0;font-size:13px;color:#71717a;">If the button does not work, copy this link into your browser:<br>${escapeHtml(url)}</p>`,
  );
}

export function passwordResetEmail(url: string): string {
  return wrap(
    "Reset your password",
    `<p style="margin:0 0 20px;line-height:1.5;">We received a request to reset your Huddle password. This link expires in 1 hour.</p>
     <p style="margin:0 0 24px;"><a href="${escapeHtml(url)}" style="background:#18181b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reset password</a></p>
     <p style="margin:0;font-size:13px;color:#71717a;">If the button does not work, copy this link into your browser:<br>${escapeHtml(url)}</p>`,
  );
}

export function invitationEmail({
  workspaceName,
  inviterName,
  role,
  url,
}: {
  workspaceName: string;
  inviterName: string;
  role: string;
  url: string;
}): string {
  return wrap(
    "You're invited to a workspace",
    `<p style="margin:0 0 20px;line-height:1.5;">${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(workspaceName)}</strong> on Huddle as <strong>${escapeHtml(role)}</strong>.</p>
     <p style="margin:0 0 24px;"><a href="${escapeHtml(url)}" style="background:#18181b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Accept invitation</a></p>
     <p style="margin:0;font-size:13px;color:#71717a;">If the button does not work, copy this link into your browser:<br>${escapeHtml(url)}</p>`,
  );
}

export function taskNotificationEmail({
  recipientName,
  title,
  taskTitle,
  workspaceName,
  url,
}: {
  recipientName: string;
  title: string;
  taskTitle?: string | null;
  workspaceName: string;
  url: string;
}): string {
  return wrap(
    title,
    `<p style="margin:0 0 16px;line-height:1.5;">Hi ${escapeHtml(recipientName)},</p>
     <p style="margin:0 0 20px;line-height:1.5;">${escapeHtml(title)} in <strong>${escapeHtml(workspaceName)}</strong>.</p>
     ${taskTitle ? `<p style="margin:0 0 24px;padding:12px 16px;background:#f4f4f5;border-radius:8px;font-weight:600;">${escapeHtml(taskTitle)}</p>` : ""}
     <p style="margin:0 0 24px;"><a href="${escapeHtml(url)}" style="background:#18181b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Open Huddle</a></p>`,
  );
}
