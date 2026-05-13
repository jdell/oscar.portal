import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://cpc-oscar-api-staging.azurewebsites.net";

function getTokenExpiresAt(token: string): string | null {
  try {
    const [, payload] = token.split(".");
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as {
      exp?: number;
    };
    return typeof decoded.exp === "number"
      ? new Date(decoded.exp * 1000).toISOString()
      : null;
  } catch {
    return null;
  }
}

export async function POST() {
  const session = await getSession();
  if (!session?.refreshToken) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = await fetch(`${apiBaseUrl}/accounts/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  }).catch(() => null);

  if (!res?.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const data = (await res.json()) as {
    access: string;
    refreshToken?: string;
    refreshTokenExpiry?: string;
  };

  const updated: AuthSession = {
    ...session,
    token: data.access,
    refreshToken: data.refreshToken ?? session.refreshToken,
    expiresAt: data.refreshTokenExpiry ?? session.expiresAt,
    tokenExpiresAt: getTokenExpiresAt(data.access),
  };

  await setSession(updated);
  return NextResponse.json({ ok: true });
}
