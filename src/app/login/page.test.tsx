import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AuthSession } from "@/lib/types";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

// Stub LoginForm so page tests don't need the full Firebase stack
vi.mock("./login-form", () => ({
  LoginForm: ({ redirectTo }: { redirectTo?: string }) => (
    <div data-testid="login-form" data-redirect={redirectTo ?? ""} />
  ),
}));

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPage from "./page";

const session: AuthSession = {
  token: "t",
  user: { id: "1", email: "a@b.com", displayName: "A", organizationId: "1", organizationName: "O", roles: [] },
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  // ─── authenticated user ────────────────────────────────────────────────────

  describe("when a session exists", () => {
    beforeEach(() => vi.mocked(getSession).mockResolvedValue(session));

    it("redirects to /agencies when `from` is absent", async () => {
      await expect(LoginPage({ searchParams: Promise.resolve({}) }))
        .rejects.toThrow("REDIRECT:/agencies");
      expect(redirect).toHaveBeenCalledWith("/agencies");
    });

    it("redirects to the `from` path when it starts with /", async () => {
      await expect(LoginPage({ searchParams: Promise.resolve({ from: "/dashboard" }) }))
        .rejects.toThrow("REDIRECT:/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("falls back to /agencies when `from` does not start with /", async () => {
      await expect(LoginPage({ searchParams: Promise.resolve({ from: "http://evil.com" }) }))
        .rejects.toThrow("REDIRECT:/agencies");
      expect(redirect).toHaveBeenCalledWith("/agencies");
    });
  });

  // ─── unauthenticated user ──────────────────────────────────────────────────

  describe("when no session exists", () => {
    beforeEach(() => vi.mocked(getSession).mockResolvedValue(null));

    it("renders the LoginForm", async () => {
      render(await LoginPage({ searchParams: Promise.resolve({}) }));
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });

    it("passes `from` as redirectTo to LoginForm", async () => {
      render(await LoginPage({ searchParams: Promise.resolve({ from: "/settings" }) }));
      expect(screen.getByTestId("login-form")).toHaveAttribute("data-redirect", "/settings");
    });

    it("passes an empty redirectTo when `from` is absent", async () => {
      render(await LoginPage({ searchParams: Promise.resolve({}) }));
      expect(screen.getByTestId("login-form")).toHaveAttribute("data-redirect", "");
    });

    it("does not call redirect", async () => {
      await LoginPage({ searchParams: Promise.resolve({}) });
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
