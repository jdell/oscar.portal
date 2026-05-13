import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AuthSession } from "@/lib/types";

const SESSION_COOKIE = "oscar_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/auth/refresh",
]);

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://cpc-oscar-api-staging.azurewebsites.net";

function getTokenExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionRaw = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionRaw) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  let session: AuthSession;
  try {
    session = JSON.parse(sessionRaw) as AuthSession;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Pre-emptively refresh the access token when it has < 2 minutes left.
  // The current request can still use the (still-valid) old token; the
  // updated cookie is set on the response so the next request gets a fresh one.
  if (session.refreshToken) {
    const exp = getTokenExp(session.token);
    const msLeft = exp !== null ? exp * 1000 - Date.now() : null;

    if (msLeft !== null && msLeft < 2 * 60 * 1000) {
      try {
        const refreshRes = await fetch(`${apiBaseUrl}/accounts/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as {
            access: string;
            refreshToken?: string;
            refreshTokenExpiry?: string;
          };

          const newExp = getTokenExp(data.access);
          const updated: AuthSession = {
            ...session,
            token: data.access,
            refreshToken: data.refreshToken ?? session.refreshToken,
            expiresAt: data.refreshTokenExpiry ?? session.expiresAt,
            tokenExpiresAt:
              newExp !== null
                ? new Date(newExp * 1000).toISOString()
                : session.tokenExpiresAt,
          };

          const response = NextResponse.next();
          response.cookies.set(SESSION_COOKIE, JSON.stringify(updated), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_MAX_AGE_SECONDS,
          });
          return response;
        } else {
          // Refresh rejected (token revoked / user disabled) — force login
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.cookies.delete(SESSION_COOKIE);
          return response;
        }
      } catch {
        // API unreachable — let the request through; server components will
        // surface a 401 error rather than a silent redirect
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
