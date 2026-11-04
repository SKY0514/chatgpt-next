"use server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { SignUpSchema } from "@/schemas/auth";
import db from "@/db";
import { user } from "@/db/schema";
import { redirect } from "next/navigation";
import { isSafeRedirectPath } from "@/utils";

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
    await db
      .insert(user)
      .values({ name, email, password: hashedPassword })
      .returning({ id: user.id });
  } catch (error) {
    console.error("error", error);
    return { errorMessage: "문제가 발생했습니다." };
  }

  // 초대 링크(/invite/[token])를 통해 들어왔던 경우, 가입 후 로그인까지
  // 마치면 다시 그 링크로 돌아가도록 from을 이어서 전달합니다.
  const from = formData.get("from");
  const loginUrl = isSafeRedirectPath(from)
    ? `/login?from=${encodeURIComponent(from)}`
    : "/login";

  redirect(loginUrl);
};
