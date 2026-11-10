CREATE TABLE "workspace_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"messageId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_comment" ADD CONSTRAINT "workspace_comment_messageId_message_id_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_comment" ADD CONSTRAINT "workspace_comment_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;