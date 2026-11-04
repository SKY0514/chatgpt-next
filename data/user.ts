import { verifySession } from "@/actions/sessions";
import db from "@/db";
import { User } from "@/types/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";

// 대소문자/앞뒤 공백 차이로 "가입했는데 미가입으로 오판"하는 걸 막기 위해
// 대소문자를 구분하지 않고 비교합니다 (가입 시 저장되는 값 자체는 그대로
// 두고, 비교할 때만 소문자로 맞춥니다).
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const normalized = email.trim().toLowerCase();

    const [existingUser] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.email}) = ${normalized}`)
      .limit(1);

    return existingUser ?? null;
  } catch (error) {
    console.error("error", error);
    throw new Error("문제가 발생했습니다.");
  }
};

export const getConversationsByUser = async () => {
  const session = await verifySession();

  const response = await db.query.user.findFirst({
    where: { id: session.id },
    with: {
      conversations: {
        where: { workspaceId: { isNull: true } },
        orderBy: (conversation, { desc }) => [desc(conversation.updatedAt)],
      },
    },
  });

  return response?.conversations || [];
};
