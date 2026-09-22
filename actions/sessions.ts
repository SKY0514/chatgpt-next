"use server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

type SessionPayload = {
  id: string;
  name: string;
  email: string;
};

export const encrypt = async (
  payload: SessionPayload,
  expiresIn: string = "30m",
) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
};

export const verify = async (session: string | undefined = "") => {
  try {
    const { payload } = await jwtVerify<SessionPayload>(session, encodedKey, {
      algorithms: ["HS256"],
    });

    return payload;
  } catch (error) {
    console.error("error:", error);
    console.log("토큰 검증에 실패하였습니다.");
  }
};

export const createSession = async (
  payload: SessionPayload,
  rememberMe: boolean = false,
) => {
  const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const expiresAt = new Date(Date.now() + maxAgeMs);
  const session = await encrypt(payload, rememberMe ? "30d" : "30m");
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
};

export const deleteSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("session");
};

export const verifySession = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await verify(cookie);

  if (!session?.id) {
    redirect("/login");
  }

  return session;
};
