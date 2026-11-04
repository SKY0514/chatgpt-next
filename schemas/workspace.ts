import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "워크스페이스 이름을 입력해주세요." }),
});

export type TCreateWorkspaceForm = z.infer<typeof CreateWorkspaceSchema>;

// STEP 2 이메일 입력 한 칸짜리 검증 — CreateWorkspaceSchema와 별개로,
// "추가" 버튼을 누를 때마다 단건으로 검사합니다.
export const WorkspaceInviteEmailSchema = z.email({
  message: "올바른 이메일 주소를 입력해 주세요.",
});
