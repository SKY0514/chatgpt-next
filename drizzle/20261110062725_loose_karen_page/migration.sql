ALTER TABLE "message" ADD COLUMN "userId" uuid;--> statement-breakpoint
-- 기존 메시지는 "누가 보냈는지" 기록이 없었으니, user 메시지는 일단 그
-- 대화를 만든 사람(conversation.userId)이 보낸 것으로 채웁니다 — 개인
-- 대화는 항상 맞고, 워크스페이스 대화도 지금까지는 작성자 구분이 없어서
-- 이게 가장 근접한 추정값입니다. assistant 메시지는 그대로 null.
UPDATE "message"
SET "userId" = "conversation"."userId"
FROM "conversation"
WHERE "message"."conversationId" = "conversation"."id"
  AND "message"."role" = 'user';--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;