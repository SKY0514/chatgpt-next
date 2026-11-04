-- 유니크 제약을 걸기 전에, 혹시 남아있을 수 있는 중복 멤버십(같은 워크스페이스에
-- 같은 사람이 두 번 들어간 행)을 먼저 정리합니다 — 가장 먼저 생긴 행만 남깁니다.
DELETE FROM "workspace_member"
WHERE id IN (
	SELECT id FROM (
		SELECT id, ROW_NUMBER() OVER (
			PARTITION BY "workspaceId", "userId"
			ORDER BY created_at ASC, id ASC
		) AS rn
		FROM "workspace_member"
	) ranked
	WHERE rn > 1
);--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_user_key" UNIQUE("workspaceId","userId");
