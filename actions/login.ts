"use server";

import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import { createSession } from "./sessions";
import { redirect } from "next/navigation";
export const login = async (_: any, formData: FormData) => {
  // 1. validate fields

  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errorMessage: "잘못된 값이 있습니다.",
    };
  }
  // 2. 이미 존재하는 사용자인지 체크

  const { email, password } = validatedFields.data;

  // 성공/실패처리

  try {
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return {
        errorMessage: "존재하지 않는 사용자입니다. 회원가입을 진행해주세요.",
      };
    }

    const { id, name, password: dbPassword } = existingUser;

    const passwordMatch = await bcrypt.compare(password, dbPassword);

    if (!passwordMatch) {
      return { errorMessage: "비밀번호가 일치하지 않습니다." };
    }

    // 세션 생성
    await createSession({ id, name });
  } catch (error) {
    console.error("error", error);
    return { errorMessage: "문제가 발생했습니다." };
  }

  redirect("/");
};
