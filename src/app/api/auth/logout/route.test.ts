import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ clearSession: vi.fn() }));

import { clearSession } from "@/lib/auth";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(clearSession).mockResolvedValue(undefined);
  });

  it("clears the session", async () => {
    await POST();
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("returns 200 with { ok: true }", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
