import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./api";
import type { AuthSession } from "./types";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export async function getSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSession(session: AuthSession): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
