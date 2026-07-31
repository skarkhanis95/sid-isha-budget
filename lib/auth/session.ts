import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but not set.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const COOKIE_NAME = "hfm_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export interface UserSessionPayload {
  userId: string;
  username: string;
  displayName: string;
  [key: string]: unknown;
}

export async function createSession(payload: UserSessionPayload): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function verifySession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
