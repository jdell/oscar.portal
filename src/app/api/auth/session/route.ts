import { NextResponse } from "next/server";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/types";

const schema = z.object({
  access: z.string().min(1),
});

interface StaffClaim {
  name?: string;
  emailAddress?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const claims = decodeJwtPayload(parsed.data.access);

  const staff = (() => {
    try {
      return JSON.parse(claims["staff"] as string) as StaffClaim;
    } catch {
      return {} as StaffClaim;
    }
  })();

  const role = claims["role"] as string | undefined;

  const session: AuthSession = {
    token: parsed.data.access,
    user: {
      id: String(claims["id"] ?? ""),
      email: (claims["username"] as string | undefined) ?? "",
      displayName: staff.name ?? staff.emailAddress ?? "",
      organizationId: String(claims["organizationId"] ?? ""),
      organizationName: (claims["organizationName"] as string | undefined) ?? "",
      roles: role ? [role] : [],
    },
  };

  await setSession(session);
  return NextResponse.json({ ok: true });
}
