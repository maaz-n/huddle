import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userAvatars } from "@/db/schema";
import { requireUser } from "@/lib/authguard";
import { idSchema } from "@/lib/validation";

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

    const bytes = Buffer.from(avatar.data, "base64");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": avatar.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="avatar"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Not found", { status: 404 });
  }
}
