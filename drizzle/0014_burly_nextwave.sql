ALTER TABLE "task_attachments" ADD COLUMN "object_key" text;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD COLUMN "object_key" text;--> statement-breakpoint
-- Existing base64 blobs have no object-storage counterpart, so their metadata
-- is dropped rather than left pointing at a missing object.
DELETE FROM "task_attachments";--> statement-breakpoint
DELETE FROM "user_avatars";--> statement-breakpoint
ALTER TABLE "task_attachments" ALTER COLUMN "object_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_avatars" ALTER COLUMN "object_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_attachments" DROP COLUMN "data";--> statement-breakpoint
ALTER TABLE "user_avatars" DROP COLUMN "data";
