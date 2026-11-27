import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userAvatars } from "@/db/schema";
import { requireUser } from "@/lib/authguard";
import { idSchema } from "@/lib/validation";
import { getObjectUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const parsedId = idSchema.safeParse((await params).userId);
  if (!parsedId.success) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await requireUser();

    const avatar = await db.query.userAvatars.findFirst({
      where: eq(userAvatars.userId, parsedId.data),
    });
    if (!avatar) {
      return new Response("Not found", { status: 404 });
    }

    const url = await getObjectUrl(avatar.objectKey, {
      expiresIn: 3600,
      contentType: avatar.mimeType,
      contentDisposition: `inline; filename="avatar"`,
    });

    return Response.redirect(url, 302);
  } catch (error) {
    console.error(error);
    return new Response("Not found", { status: 404 });
  }
}
