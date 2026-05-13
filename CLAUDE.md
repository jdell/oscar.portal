# CLAUDE.md — oscar.admin

> Online-only admin panel for organization admins of the Oscar platform.
> Single-org scoped: an admin only sees their own organization's data.

## ⚠️ This is Next.js 16

The Next.js installed here has breaking changes from earlier major versions. Before writing routing/middleware/server code, check `node_modules/next/dist/docs/` for the canonical reference. Notable differences from your training data:

- `middleware.ts` is renamed to **`proxy.ts`** (same functionality, exported as `proxy` instead of `middleware`). Lives at `src/proxy.ts`.
- `cookies()` from `next/headers` is **async** — always `await cookies()`.
- Page props `params` and `searchParams` are **Promises** in App Router. Always `await` them.
- React 19 is in use.

## Stack

- Next.js 16 (App Router, `src/` layout, route groups)
- React 19, TypeScript 5
- Tailwind CSS v4 + `tw-animate-css`
- shadcn/ui (Radix-free, on `@base-ui/react`)
- `@tanstack/react-table` for tables
- `react-hook-form` + `zod` for forms
- `sonner` for toasts
- `lucide-react` for icons

## Architecture

### Routing & layout

```
src/
  proxy.ts                 — auth guard (redirects to /login when no session cookie)
  app/
    layout.tsx             — root layout (fonts, toaster)
    login/                  — public; reads session and redirects if already in
    api/
      auth/login/          — POST email+password → sets httpOnly session cookie
      auth/logout/         — POST clears session cookie
      agencies/            — server-side proxy to oscar.apii with bearer token
    (app)/                  — authenticated route group; wraps with AppShell
      layout.tsx           — calls requireSession(), renders AppShell
      page.tsx             — redirects to /agencies
      agencies/            — list, new, [id] detail (reference implementation)
      staff/                — list, new, [id]
      resources/            — combined medical + healthy living
      providers/, insurers/, locations/, permissions/, reports/, settings/
```

### Auth

- Login: client form posts to `/api/auth/login` → server calls oscar.apii `POST /accounts/token` → token + user info are JSON-encoded into an httpOnly cookie (`oscar_admin_session`).
- `src/proxy.ts` checks for the cookie on every non-public path and redirects to `/login?from=…`.
- `src/lib/auth.ts` exposes `getSession()`, `requireSession()`, `setSession()`, `clearSession()` — all async because `cookies()` is async.
- Server components read the session and pass it to client components via props.

### API access

- `src/lib/api.ts` — server-only fetch wrapper. Pulls the bearer token from the session cookie automatically. Throws `ApiError(status, body)` on non-2xx.
- `API_BASE_URL` is read from `process.env.API_BASE_URL` (server-only).
- For mutations from client components, POST to a Next.js Route Handler under `/api/*` which then calls `api.post(...)` server-side. This keeps the token off the client.

### Pages pattern

Each resource follows this shape (see `agencies/` for the reference):

1. **List page** (`page.tsx`) — server component. Fetches via `api.get(...)` in a try/catch that logs ApiError and falls back to `[]`. Renders a client `*-Table` component.
2. **Table** (`*-table.tsx`) — `"use client"`. Uses `DataTable` (from `src/components/data-table.tsx`) with TanStack columns. Filters live in this component.
3. **New page** (`new/page.tsx`) — wraps a shared `*-form.tsx`.
4. **Form** (`*-form.tsx`) — `"use client"`. React Hook Form + Zod, posts to a Route Handler.
5. **Detail page** (`[id]/page.tsx`) — server component, `params: Promise<{ id: string }>`, calls `notFound()` on 404.

When stubbing a new resource, copy `agencies/` as the template.

### Styling

- Brand color is sky-600/700 (matches oscar.cloud).
- The sidebar uses `bg-sidebar` / `text-sidebar-foreground` tokens defined in shadcn's globals; the active item uses sky-600.
- Mobile: sidebar collapses to a `Sheet` triggered from the topbar `Menu` button.

## Commands

```bash
npm run dev           # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Environment

Copy `.env.local.example` → `.env.local`:

```
API_BASE_URL=https://cpc-oscar-api-staging.azurewebsites.net
NEXT_PUBLIC_APP_NAME=Oscar Admin
```

## Related projects

- `../oscar.apii` — .NET API (source of truth for endpoints, DTOs)
- `../oscar.cloud` — Angular admin/participant apps (existing frontend)
- `../oscar.backoffice` — Flutter superuser/back-office app
