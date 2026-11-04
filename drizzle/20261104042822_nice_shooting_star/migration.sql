DROP TABLE "workspace_invite";--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "invite_token" text;--> statement-breakpoint
UPDATE "workspace" SET "invite_token" = gen_random_uuid()::text WHERE "invite_token" IS NULL;--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "invite_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_invite_token_key" UNIQUE("invite_token");
