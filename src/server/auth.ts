import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSecretText } from "@/lib/env";
import { connectDB, User, type UserDoc } from "./db";
import { UnauthorizedError } from "./api-utils";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "cashbook_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

async function key() {
  return new TextEncoder().encode(`session:${await getSecretText()}`);
}

export const toSessionUser = (u: Pick<UserDoc, "id" | "name" | "email" | "businessName" | "picture">): SessionUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  businessName: u.businessName ?? "",
  photoUrl: u.picture ?? null,
});

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserWithPassword(email: string) {
  await connectDB();
  return User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
}

export async function createUser(input: { name?: string; businessName?: string; email: string; passwordHash?: string }) {
  await connectDB();
  const email = input.email.toLowerCase().trim();
  return User.create({
    id: "u" + Date.now() + Math.floor(Math.random() * 1000), // string id, same style as existing Cashbook accounts
    name: input.name?.trim() || email.split("@")[0],
    businessName: input.businessName?.trim() || "",
    email,
    ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
  });
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(await key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await key());
    if (!payload.sub) return null;
    await connectDB();
    const user = await User.findOne({ id: payload.sub }).lean();
    return user ? toSessionUser(user) : null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
