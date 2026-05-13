import { NextResponse } from "next/server";
import { z } from "zod";
import { apiFetch, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface TokenResponse {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  userId: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  roles?: string[];
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await apiFetch<TokenResponse>("/accounts/token", {
      method: "POST",
      body: parsed.data,
    });

    const session: AuthSession = {
      token: result.token,
      refreshToken: result.refreshToken ?? null,
      expiresAt: result.expiresAt ?? null,
      user: {
        id: result.userId,
        email: result.email,
        displayName: result.displayName,
        organizationId: result.organizationId,
        organizationName: result.organizationName,
        roles: result.roles ?? [],
      },
    };

    await setSession(session);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: error.status === 401 ? 401 : 400 },
      );
    }
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 },
    );
  }
}
