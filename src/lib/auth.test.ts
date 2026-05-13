import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthSession } from "@/lib/types";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, setSession, clearSession, requireSession } from "@/lib/auth";

const COOKIE_NAME = "oscar_admin_session";

const sample: AuthSession = {
  token: "tok",
  user: {
    id: "1",
    email: "a@b.com",
    displayName: "A B",
    organizationId: "99",
    organizationName: "Org",
    roles: ["admin"],
  },
};

describe("auth utilities", () => {
  const store = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(cookies).mockResolvedValue(store as never);
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  // ─── getSession ────────────────────────────────────────────────────────────

  describe("getSession()", () => {
    it("returns null when the cookie is absent", async () => {
      store.get.mockReturnValue(undefined);
      expect(await getSession()).toBeNull();
    });

    it("returns null when the cookie value is not valid JSON", async () => {
      store.get.mockReturnValue({ value: "{{broken" });
      expect(await getSession()).toBeNull();
    });

    it("returns the parsed session when the cookie is present", async () => {
      store.get.mockReturnValue({ value: JSON.stringify(sample) });
      expect(await getSession()).toEqual(sample);
    });
  });

  // ─── setSession ────────────────────────────────────────────────────────────

  describe("setSession()", () => {
    it("stores the session as JSON with httpOnly, sameSite, path and 8-hour maxAge", async () => {
      await setSession(sample);
      expect(store.set).toHaveBeenCalledWith(
        COOKIE_NAME,
        JSON.stringify(sample),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8,
        }),
      );
    });

    it("sets the secure flag in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      await setSession(sample);
      expect(store.set).toHaveBeenCalledWith(
        COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({ secure: true }),
      );
      vi.unstubAllEnvs();
    });
  });

  // ─── clearSession ──────────────────────────────────────────────────────────

  describe("clearSession()", () => {
    it("deletes the session cookie", async () => {
      await clearSession();
      expect(store.delete).toHaveBeenCalledWith(COOKIE_NAME);
    });
  });

  // ─── requireSession ────────────────────────────────────────────────────────

  describe("requireSession()", () => {
    it("redirects to /login when there is no session", async () => {
      store.get.mockReturnValue(undefined);
      await expect(requireSession()).rejects.toThrow("REDIRECT:/login");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("returns the session when one exists", async () => {
      store.get.mockReturnValue({ value: JSON.stringify(sample) });
      expect(await requireSession()).toEqual(sample);
    });
  });
});
