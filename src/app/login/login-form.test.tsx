import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("firebase/auth", () => ({ signInWithEmailAndPassword: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ firebaseAuth: {} }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginForm } from "./login-form";

const API_BASE = "https://api.test.com";

describe("LoginForm", () => {
  let mockPush: ReturnType<typeof vi.fn>;
  let mockRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = API_BASE;
    mockPush = vi.fn();
    mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: mockRefresh } as never);
    global.fetch = vi.fn();
  });

  // ─── helpers ───────────────────────────────────────────────────────────────

  function mockFirebaseSuccess(idToken = "fb-token") {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue(idToken) },
    } as never);
  }

  function mockFirebaseError(code: string) {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      Object.assign(new Error(code), { code }),
    );
  }

  function mockFetch({ apiOk = true, sessionOk = true, access = "oscar-jwt" } = {}) {
    vi.mocked(global.fetch).mockImplementation((url) => {
      if (String(url).includes("/accounts/token")) {
        return Promise.resolve({
          ok: apiOk,
          json: () => Promise.resolve({ access }),
        } as Response);
      }
      return Promise.resolve({
        ok: sessionOk,
        json: () => Promise.resolve({ ok: true }),
      } as Response);
    });
  }

  async function fillAndSubmit(email = "jane@example.com", password = "secret") {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText("Password"), password);
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    return user;
  }

  // ─── rendering ─────────────────────────────────────────────────────────────

  it("renders email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the Sign in button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("password input defaults to type=password", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  // ─── password toggle ───────────────────────────────────────────────────────

  it("toggles password visibility on/off", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const input = screen.getByLabelText("Password");
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  // ─── validation ────────────────────────────────────────────────────────────

  it("shows an error for an invalid email after submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument(),
    );
  });

  it("shows an error when the password is empty after submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "valid@email.com");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    );
  });

  // ─── happy path ────────────────────────────────────────────────────────────

  it("calls signInWithEmailAndPassword with the entered credentials", async () => {
    mockFirebaseSuccess();
    mockFetch();
    await fillAndSubmit("jane@example.com", "secret");
    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "jane@example.com",
        "secret",
      ),
    );
  });

  it("calls the oscar API with the Firebase ID token", async () => {
    mockFirebaseSuccess("my-fb-token");
    mockFetch();
    await fillAndSubmit();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/accounts/token`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "my-fb-token" }),
        }),
      ),
    );
  });

  it("calls /api/auth/session with the access token", async () => {
    mockFirebaseSuccess();
    mockFetch({ access: "jwt-from-api" });
    await fillAndSubmit();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/session",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ access: "jwt-from-api" }),
        }),
      ),
    );
  });

  it("navigates to /agencies on success when no redirectTo prop", async () => {
    mockFirebaseSuccess();
    mockFetch();
    await fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/agencies"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("navigates to the redirectTo path on success", async () => {
    mockFirebaseSuccess();
    mockFetch();
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/settings" />);
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/settings"));
  });

  it("falls back to /agencies when redirectTo does not start with /", async () => {
    mockFirebaseSuccess();
    mockFetch();
    const user = userEvent.setup();
    render(<LoginForm redirectTo="http://evil.com" />);
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/agencies"));
  });

  // ─── Firebase error mapping ────────────────────────────────────────────────

  const firebaseCases = [
    { code: "auth/invalid-credential", msg: "Invalid email or password" },
    { code: "auth/user-not-found",     msg: "Invalid email or password" },
    { code: "auth/wrong-password",     msg: "Invalid email or password" },
    { code: "auth/too-many-requests",  msg: "Too many failed attempts — try again later" },
    { code: "auth/user-disabled",      msg: "This account has been disabled" },
    { code: "auth/other-error",        msg: "Sign-in failed — try again" },
  ] as const;

  for (const { code, msg } of firebaseCases) {
    it(`shows toast "${msg}" for Firebase code ${code}`, async () => {
      mockFirebaseError(code);
      await fillAndSubmit();
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(msg),
      );
    });
  }

  // ─── API / session errors ──────────────────────────────────────────────────

  it("shows 'Invalid credentials' toast when the oscar API returns non-ok", async () => {
    mockFirebaseSuccess();
    mockFetch({ apiOk: false });
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials"),
    );
  });

  it("shows 'Login failed' toast when the session endpoint returns non-ok", async () => {
    mockFirebaseSuccess();
    mockFetch({ sessionOk: false });
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Login failed"),
    );
  });

  it("shows 'Network error' toast on a non-Firebase exception", async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error("net error"));
    await fillAndSubmit();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Network error — try again"),
    );
  });

  // ─── loading state ─────────────────────────────────────────────────────────

  it("disables the button and shows 'Signing in…' while submitting", async () => {
    vi.mocked(signInWithEmailAndPassword).mockReturnValue(new Promise(() => {}) as never);
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "pw");
    // fire without awaiting so the pending promise keeps the form in loading state
    user.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled(),
    );
  });
});
