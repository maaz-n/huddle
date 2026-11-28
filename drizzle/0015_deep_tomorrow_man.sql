ALTER TABLE "user" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;