import { cookies } from "next/headers";
import { signToken, verifyToken } from "./jwt";
import { UserSession } from "@/types/auth.types";

export const AUTH_COOKIE_NAME = "auto_owner_session";

/**
 * Creates and sets an HTTP-only authentication cookie for the owner
 */
export async function createSessionCookie(session: UserSession): Promise<string> {
  const token = await signToken(session);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

/**
 * Retrieves and verifies current owner session from HTTP-only cookie
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "owner") {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

/**
 * Clears the owner session cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
