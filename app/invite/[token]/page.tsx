import Link from "next/link";
import { Link2Off } from "lucide-react";
import { redirect } from "next/navigation";
import { joinWorkspaceByInviteToken } from "@/actions/workspaces";
import { BASE_URL, WORKSPACE_ROUTES } from "@/constants/routes";

// 로그인은 proxy.ts가 이미 강제합니다(비로그인이면 /login?from=/invite/[token]로
// 리다이렉트) — 여기 도달했다면 로그인된 상태입니다. 이미 멤버여도 중복
// 추가하지 않고 그대로 해당 워크스페이스로 보냅니다.
const InvitePage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;

  const result = await joinWorkspaceByInviteToken(token);

  if (!result) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#f1f5f9]">
          <Link2Off className="size-5 text-[#64748b]" />
        </div>
        <h1 className="text-base font-semibold text-[#0f172a]">
          유효하지 않은 초대 링크예요
        </h1>
        <p className="max-w-sm text-sm text-[#64748b]">
          링크가 만료되었거나, 오너가 새 링크로 재발급했을 수 있어요. 워크스페이스
          오너에게 최신 초대 링크를 다시 받아보세요.
        </p>
        <Link
          href={BASE_URL}
          className="mt-2 rounded-xl bg-[#6366f1] px-4 py-2 text-sm text-white hover:bg-[#4f46e5]"
        >
          홈으로 이동
        </Link>
      </div>
    );
  }

  redirect(WORKSPACE_ROUTES.NEW(result.workspaceId));
};

export default InvitePage;
