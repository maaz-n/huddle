import { eq } from "drizzle-orm";

import { db } from "@/db";
import { taskAttachments } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { idSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const attachment = await db.query.taskAttachments.findFirst({
      where: eq(taskAttachments.id, parsedId.data),
    });
    if (!attachment) {
      return new Response("Not found", { status: 404 });
    }

    // Only members of the attachment's workspace may download it.
    await requireWorkspaceAccess(attachment.workspaceId, "member");

    const bytes = Buffer.from(attachment.data, "base64");
    const asciiName =
      attachment.fileName
        .replace(/[^\x20-\x7e]/g, "_")
        .replace(/"/g, "'")
        .slice(0, 150) || "attachment";

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Not found", { status: 404 });
  }
}
