import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ setSession: vi.fn() }));

import { setSession } from "@/lib/auth";
import { POST } from "./route";

// Build a JWT-shaped token whose payload can be decoded by decodeJwtPayload
function makeToken(payload: object): string {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${enc({ alg: "HS256" })}.${enc(payload)}.sig`;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fullPayload = {
  id: "42",
  staffId: "7",
  staff: JSON.stringify({ id: 7, name: "Jane Doe", emailAddress: "jane@example.com" }),
  username: "jane@example.com",
  organizationId: "99",
  organizationName: "Health Org",
  role: "administrator",
};

const validToken = makeToken(fullPayload);

describe("POST /api/auth/session", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(setSession).mockResolvedValue(undefined);
  });

  // ─── success ───────────────────────────────────────────────────────────────

  it("returns 200 with { ok: true } for a valid token", async () => {
    const res = await POST(makeRequest({ access: validToken }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("calls setSession with data decoded from the JWT claims", async () => {
    await POST(makeRequest({ access: validToken }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        token: validToken,
        user: expect.objectContaining({
          id: "42",
          email: "jane@example.com",
          displayName: "Jane Doe",
          organizationId: "99",
          organizationName: "Health Org",
          roles: ["administrator"],
        }),
      }),
    );
  });

  // ─── validation errors ─────────────────────────────────────────────────────

  it("returns 400 when the `access` field is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when `access` is an empty string", async () => {
    const res = await POST(makeRequest({ access: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when the token has no payload segment (malformed JWT)", async () => {
    const res = await POST(makeRequest({ access: "notajwt" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the payload segment is not valid base64-JSON", async () => {
    const res = await POST(makeRequest({ access: "header.!!!.sig" }));
    expect(res.status).toBe(400);
  });

  // ─── graceful claim defaults ───────────────────────────────────────────────

  it("falls back to empty displayName when the staff claim is absent", async () => {
    await POST(makeRequest({ access: makeToken({ ...fullPayload, staff: undefined }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ displayName: "" }) }),
    );
  });

  it("falls back to empty displayName when staff JSON is invalid", async () => {
    await POST(makeRequest({ access: makeToken({ ...fullPayload, staff: "broken{" }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ displayName: "" }) }),
    );
  });

  it("uses staff.emailAddress as displayName when staff.name is absent", async () => {
    const staffWithoutName = JSON.stringify({ emailAddress: "fallback@example.com" });
    await POST(makeRequest({ access: makeToken({ ...fullPayload, staff: staffWithoutName }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ displayName: "fallback@example.com" }) }),
    );
  });

  it("sets an empty roles array when the role claim is absent", async () => {
    await POST(makeRequest({ access: makeToken({ ...fullPayload, role: undefined }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ roles: [] }) }),
    );
  });

  it("sets empty organizationName when the claim is absent", async () => {
    await POST(makeRequest({ access: makeToken({ ...fullPayload, organizationName: undefined }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ organizationName: "" }) }),
    );
  });

  it("sets empty id string when the id claim is absent", async () => {
    await POST(makeRequest({ access: makeToken({ ...fullPayload, id: undefined }) }));
    expect(setSession).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ id: "" }) }),
    );
  });
});
