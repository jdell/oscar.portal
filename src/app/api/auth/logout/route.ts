import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://cpc-oscar-api-staging.azurewebsites.net";

export async function POST() {
  const session = await getSession();

  // Revoke the refresh token server-side so it cannot be reused
  if (session?.refreshToken) {
    await fetch(`${apiBaseUrl}/accounts/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }).catch(() => {
      // Best-effort — don't block logout if the API is unreachable
    });
  }

  await clearSession();
  return NextResponse.json({ ok: true });
}
