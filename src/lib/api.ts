import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://cpc-oscar-api-staging.azurewebsites.net";

export const SESSION_COOKIE = "oscar_admin_session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed (${status})`);
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
}

async function resolveToken(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token;
  } catch {
    return undefined;
  }
}

function buildUrl(
  path: string,
  searchParams?: FetchOptions["searchParams"],
): string {
  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    API_BASE_URL,
  );
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, token, searchParams, headers, ...rest } = options;
  const resolvedToken = await resolveToken(token);

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  };

  const response = await fetch(buildUrl(path, searchParams), init);

  if (!response.ok) {
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = await response.text();
    }
    throw new ApiError(response.status, parsed);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = void>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};
