"use server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { SignUpSchema } from "@/schemas/auth";
import db from "@/db";
import { user } from "@/db/schema";
import { redirect } from "next/navigation";
import { joinPendingWorkspaceInvites } from "@/actions/workspaces";

export const signup = async (_: any, formData: FormData) => {
  // 1. validate fields

  const validatedFields = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errorMessage: "잘못된 값이 있습니다.",
    };
  }
  // 2. 이미 존재하는 사용자인지 체크

  const { name, email, password } = validatedFields.data;

  // 성공/실패처리

  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return { errorMessage: "이미 존재하는 사용자 입니다." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. insert db
    const [newUser] = await db
      .insert(user)
      .values({ name, email, password: hashedPassword })
      .returning({ id: user.id });

    // 이 이메일 앞으로 온 워크스페이스 초대가 있으면 가입과 동시에 합류시킵니다.
    await joinPendingWorkspaceInvites(newUser.id, email);
  } catch (error) {
    console.error("error", error);
    return { errorMessage: "문제가 발생했습니다." };
  }

  redirect("/login");
};
