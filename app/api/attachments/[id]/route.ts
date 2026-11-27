import { eq } from "drizzle-orm";

import { db } from "@/db";
import { taskAttachments } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { getObjectUrl } from "@/lib/storage";
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

    const asciiName =
      attachment.fileName
        .replace(/[^\x20-\x7e]/g, "_")
        .replace(/"/g, "'")
        .slice(0, 150) || "attachment";

    const url = await getObjectUrl(attachment.objectKey, {
      expiresIn: 60,
      contentType: attachment.mimeType,
      contentDisposition: `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    });

    return Response.redirect(url, 302);
  } catch (error) {
    console.error(error);
    return new Response("Not found", { status: 404 });
  }
}
