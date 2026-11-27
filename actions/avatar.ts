"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user, userAvatars } from "@/db/schema";
import { getCurrentUser } from "@/actions/auth";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  avatarUrl,
} from "@/lib/avatar";
import { avatarKey, deleteObject, putObject } from "@/lib/storage";

export async function uploadAvatar(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Unauthorized" };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Choose an image to upload" };
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
      return {
        success: false,
        message: "Use a PNG, JPEG, WebP, or GIF image",
      };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { success: false, message: "Images must be 2 MB or smaller" };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = avatarKey(currentUser.id);

    await putObject({
      key,
      body: bytes,
      contentType: file.type,
      cacheControl: "private, max-age=3600",
    });

    await db
      .insert(userAvatars)
      .values({
        userId: currentUser.id,
        mimeType: file.type,
        size: bytes.length,
        objectKey: key,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userAvatars.userId,
        set: {
          mimeType: file.type,
          size: bytes.length,
          objectKey: key,
          updatedAt: new Date(),
        },
      });

    const imageUrl = avatarUrl(currentUser.id);
    await db
      .update(user)
      .set({ image: imageUrl })
      .where(eq(user.id, currentUser.id));

    return { success: true, message: "Profile picture updated", imageUrl };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not upload the image" };
  }
}

export async function removeAvatar() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Unauthorized" };
    }

    await db.delete(userAvatars).where(eq(userAvatars.userId, currentUser.id));
    await db
      .update(user)
      .set({ image: null })
      .where(eq(user.id, currentUser.id));

    // The DB row is gone first, so a failed object delete only leaves an
    // unreferenced object rather than a broken avatar.
    try {
      await deleteObject(avatarKey(currentUser.id));
    } catch (error) {
      console.error("[storage] Could not delete avatar object:", error);
    }

    return { success: true, message: "Profile picture removed" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not remove the image" };
  }
}
