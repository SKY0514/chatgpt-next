import { verifySession } from "@/actions/sessions";
import db from "@/db";
import { User } from "@/types/db";

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const existingUser = await db.query.user.findFirst({
      where: { email },
    });

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
        orderBy: (conversation, { desc }) => [desc(conversation.updatedAt)],
      },
    },
  });

  return response?.conversations || [];
};
