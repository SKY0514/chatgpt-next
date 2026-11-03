import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "워크스페이스 이름을 입력해주세요." }),
  invites: z.array(
    z.object({
      email: z.email({ message: "올바른 이메일 형식을 입력해주세요." }),
      role: z.enum(["admin", "member"]),
    }),
  ),
});

export type TCreateWorkspaceForm = z.infer<typeof CreateWorkspaceSchema>;
