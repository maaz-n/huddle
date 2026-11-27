ALTER TABLE "tasks" ADD COLUMN "recurrence" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "series_id" text;--> statement-breakpoint
CREATE INDEX "tasks_seriesId_idx" ON "tasks" USING btree ("series_id");