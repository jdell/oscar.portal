# TRD — Admin Dashboard

> Technical Requirements Document for the Admin Dashboard.
>
> - **Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/dashboard/`
> - **Next.js destination:** `oscar.portal/src/app/(app)/dashboard/`, `oscar.portal/src/app/api/dashboard/` *(both currently missing — see Gap Analysis)*
> - **Source of truth for fields:** `oscar.cloud/apps/oscar-app/src/app/data/models/dashboard.model.ts`

---

## 1. Functional Requirements

### Data Model

#### Period selector (Angular `DashboardPeriodService`)
| Type | Values | Default |
|---|---|---|
| `DashboardPeriod` | `'7d' \| '30d' \| '90d' \| '365d'` | `'30d'` |

Held in a single `signal<DashboardPeriod>` exposed by `DashboardPeriodService`. Changing the period via `set(value)` cascades to all dashboard sub-components via `effect()` in the overview store and `effect()` in the trends component.

#### `DashboardKpi`
| Field | Type | Notes |
|---|---|---|
| `value` | `number` | Current-period count |
| `previousValue` | `number` | Previous-period count (same length, immediately prior) |
| `sparkline7d` | `number[]` | 7-bucket array for the inline trend sparkline |

#### `DashboardHeroKpis`
| Field | Type |
|---|---|
| `activeParticipants` | `DashboardKpi` |
| `activeStaff` | `DashboardKpi` |
| `newReferrals` | `DashboardKpi` |
| `openFollowUpsNext7Days` | `DashboardKpi` |

#### `DashboardEntityKey`
Discriminated union: `'agencies' | 'staff' | 'providers' | 'healthy-living-resources' | 'medical-resources' | 'referral-reasons'`.

#### `DashboardEntitySummary`
| Field | Type | Notes |
|---|---|---|
| `key` | `DashboardEntityKey` | Which catalog row this is |
| `total` | `number` | Total count of records of this type |
| `active` | `number` | Active count |
| `newInPeriod` | `number` | New records created in the selected period |
| `newInPreviousPeriod` | `number` | Same window immediately prior — used for delta arrows |
| `sparkline7d` | `number[]` | 7-bucket creation trend |

#### `DashboardOverview`
| Field | Type |
|---|---|
| `period` | `string` (echoed back from the request) |
| `hero` | `DashboardHeroKpis` |
| `entitySummaries` | `DashboardEntitySummary[]` |

#### `DashboardTrends`
| Field | Type | Notes |
|---|---|---|
| `period` | `string` | Echoed back |
| `granularity` | `'day' \| 'week' \| 'month'` (`DashboardTrendGranularity`) | Server picks granularity to suit period length |
| `points` | `DashboardTrendPoint[]` | Series points: `{ date, participantsEnrolled, referralsCreated }` |

#### `DashboardActivityEvent`
| Field | Type |
|---|---|
| `entityKey` | `DashboardEntityKey` |
| `entityId` | `number` |
| `displayName` | `string` |
| `createdAt` | `string` (ISO) |

### Business Logic & Validation

- **No user input on the dashboard** — it's a read-only surface, so there's no form / validation layer.
- **Period change** triggers exactly one refetch of overview + trends; recent-activity does not re-bind to period (fetched once on init via `limit` query).
- **Concurrent fetch guard:** `DashboardOverviewStore.refresh()` awaits the previous in-flight fetch before starting a new one. Each period change replaces the in-flight promise; on completion the store sets `_overview`, `_loading`, `_error`.
- **Permission gating** on quick actions only — each `QuickAction` declares a `permission` string (`AdminPermission.AGENCY_MANAGE`, `STAFF_MANAGE`, `RESOURCE_MANAGE`) and the template wraps the CTA in `*ngxPermissionsOnly`.

### API Intersections

All requests use the staff bearer-token cookie. .NET API root.

#### Angular (`AdminDashboardService`)
| Method | Endpoint | Params | Response |
|---|---|---|---|
| GET | `/admin/dashboard/overview` | `period` (`7d \| 30d \| 90d \| 365d`) | `DashboardOverview` |
| GET | `/admin/dashboard/trends` | `period` | `DashboardTrends` |
| GET | `/admin/dashboard/recent-activity` | `limit` (default `20`) | `DashboardActivityEvent[]` |
| GET | `/agencies/summary` | — | `EntitySummary` |
| GET | `/staff-members/summary` | — | `StaffMemberSummary` |
| GET | `/providers/summary` | — | `EntitySummary` |
| GET | `/healthy-living-resources/summary` | — | `EntitySummary` |
| GET | `/medical-resources/summary` | — | `EntitySummary` |
| GET | `/referral-reasons/summary` | — | `EntitySummary` |

The per-entity `/summary` endpoints are kept as legacy fallbacks but the new aggregated `/admin/dashboard/overview` is the canonical path. Once cutover completes the six individual calls can be removed.

#### Next.js (`/api/dashboard/*` → backend)
**Not yet implemented** — see Gap Analysis §4 for the migration spec.

Recommended route shape:
| Method | Route Handler | Backend Call |
|---|---|---|
| GET | `/api/dashboard/overview?period=…` | `GET /admin/dashboard/overview` |
| GET | `/api/dashboard/trends?period=…` | `GET /admin/dashboard/trends` |
| GET | `/api/dashboard/recent-activity?limit=…` | `GET /admin/dashboard/recent-activity` |

(Or — preferred for SSR — call the .NET API directly from server components via `api.get(…)` like the other portal modules.)

### User Actions

#### Angular `admin-dashboard.component.html`
Composed of five sub-components in this order:

1. **`<app-dashboard-hero-kpis>`** — 4 hero cards driven by `DashboardOverviewStore.hero()`:
   - `Active participants` (`pi pi-user`, accent `#1565C0`, link `/participants`)
   - `Active staff` (`pi pi-users`, `#2E7D32`, link `/admin/staff-members`)
   - `New referrals` (`pi pi-send`, `#6A1B9A`, link `/admin/client-referrals`)
   - `Open follow-ups (next 7 days)` (`pi pi-calendar-clock`, `#D84315`, link `/follow-ups`)
   - Each card renders value + delta-vs-previous + inline `sparkline7d` chart.
2. **`<app-dashboard-trends>`** — PrimeNG `<p-chart>` line chart of `participantsEnrolled` + `referralsCreated` over the selected period. Granularity (`day` / `week` / `month`) chosen server-side and rendered in the X-axis labels.
3. **`<app-dashboard-entity-catalog>`** — 6 KPI cards for the entity summaries (agencies, staff, providers, HLR, medical resources, referral reasons). Each card shows total / active / new-in-period + sparkline. Clicking a card routes to the corresponding admin list.
4. **`<app-dashboard-recent-activity>`** — PrimeNG-styled list of the 20 most recent creation events across all entity types, each clickable to the entity detail.
5. **`<app-dashboard-quick-actions>`** — 4 CTAs gated by `*ngxPermissionsOnly`:
   - `Add agency` (`pi pi-building`, `/admin/agencies/new`, requires `AGENCY_MANAGE`)
   - `Add staff` (`pi pi-user-plus`, `/admin/staff-members/new`, requires `STAFF_MANAGE`)
   - `Add provider` (`pi pi-globe`, `/admin/providers/new`, requires `RESOURCE_MANAGE`)
   - `Add survey` (`pi pi-file`, `/admin/surveys/new`, requires `STAFF_MANAGE`)

#### Header — period selector
A `<p-selectButton>` at the top of the dashboard (`7d / 30d / 90d / 365d`) bound to `DashboardPeriodService.period()`. Changing the selection cascades to:
- `DashboardOverviewStore.refresh(period)` → re-renders hero KPIs + entity catalog.
- `DashboardTrendsComponent` `effect()` → re-fetches trends.

Recent activity is independent of period.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- **`DashboardPeriodService`** (`providedIn: 'root'`): single `signal<DashboardPeriod>` source of truth for the currently selected period. Default `'30d'`.
- **`DashboardOverviewStore`** (`providedIn: 'root'`): wraps `AdminDashboardService.getOverview(period)`. Exposes:
  - `overview` (readonly signal)
  - `loading`, `error` (readonly signals)
  - `hero = computed(() => overview?.hero ?? null)`
  - `entitySummaries = computed(() => overview?.entitySummaries ?? [])`
  - In-flight de-duplication via a private `inFlight: Promise<void> | null`.
- **`DashboardTrendsComponent`** has its own local `_trends` signal + `effect()` on `periodService.period()` that calls `dashboardService.getTrends(period)` and stores the result.
- **`DashboardRecentActivityComponent`** fetches once in `ngOnInit` with `limit = 20`; not period-bound.
- All components use `ChangeDetectionStrategy.OnPush`. State change happens through signals, which auto-mark for check.
- Errors from any of the three fetchers route through `ErrorHandlerService.handleError(error)` (centralised toast + logging).

### Permissions
- **Angular admin app:** Dashboard is mounted under `/admin/dashboard` and gated by the admin-shell route guard (`canActivate: [AdminGuard]`-equivalent).
- Within the dashboard, only the **quick actions** declare explicit per-action permissions:
  - `Add agency` → `AdminPermission.AGENCY_MANAGE`
  - `Add staff` → `AdminPermission.STAFF_MANAGE`
  - `Add provider` → `AdminPermission.RESOURCE_MANAGE`
  - `Add survey` → `AdminPermission.STAFF_MANAGE` (yes, intentionally — survey creation is a staff-level action)
- Hero KPIs, trends, entity catalog, and recent activity are visible to any user who can reach the dashboard.

### Error Handling

#### Angular
- **`DashboardOverviewStore`** catches `getOverview` errors, stores in `_error`, and calls `errorHandler.handleError(error)` for the toast. The store stays at `overview = null` until the next successful fetch.
- **`DashboardTrendsComponent`** catches `getTrends` errors and shows an empty-state hint inside the chart panel (rather than a global toast).
- **`DashboardRecentActivityComponent`** swallows errors and shows an empty list — the dashboard does not fail just because activity is unavailable.
- Period selector remains responsive during a fetch (no debounce, no disabled state) — a fast user can queue multiple period changes; the store guarantees in-order resolution via `inFlight`.

---

## 3. Migration Checklist

Definition of Done for the Admin Dashboard Next.js port:

- [ ] `DashboardPeriod` type and `dashboardPeriodAtom` (or equivalent) in `src/lib/types.ts` / `src/lib/state/`.
- [ ] `DashboardKpi`, `DashboardHeroKpis`, `DashboardEntitySummary`, `DashboardOverview`, `DashboardTrendPoint`, `DashboardTrends`, `DashboardActivityEvent` types defined.
- [ ] Server-side fetchers: `loadOverview(period)`, `loadTrends(period)`, `loadRecentActivity(limit)` — called from the dashboard server component.
- [ ] Period selector (Tab / SegmentedButton component) with values `7d / 30d / 90d / 365d`, default `30d`, URL-persistent (`?period=`).
- [ ] Hero KPI row — 4 cards: Active Participants, Active Staff, New Referrals, Open Follow-ups. Each card: value + delta arrow vs `previousValue` + inline sparkline.
- [ ] Trends chart (line series, two metrics, granularity-aware X axis labels).
- [ ] Entity catalog grid — 6 cards, each linking to the corresponding admin list. Show total / active / newInPeriod + sparkline.
- [ ] Recent activity feed — 20 items, clickable per entity, "View all" link.
- [ ] Quick actions rail — 4 CTAs with permission-gated visibility (requires the permissions surface to land first).
- [ ] Loading skeletons for hero, trends, catalog (independent — they fetch in parallel).
- [ ] Empty states for: dashboard overview unavailable, trends unavailable, recent activity empty / unavailable.
- [ ] `(app)/dashboard/page.tsx` route created; `(app)/page.tsx` updated to redirect there (currently redirects to `/agencies`).
- [ ] Sidebar nav item added pointing at `/dashboard`.
- [ ] `requireSession()` gating via `(app)` layout (inherited).
- [ ] Build passes `next build` type-check.

---

## 4. Gap Analysis

### Status today
**The Next.js portal has no dashboard page.** `src/app/(app)/page.tsx` redirects `/` to `/agencies`. Every item in §3 is a fresh port.

### In Angular but missing in Next.js (everything)
- **Period selector + period state.** Angular's `DashboardPeriodService` is a global signal; the portal needs a portable equivalent (URL search param, server-component prop, or a small client-side store).
- **`DashboardOverviewStore` in-flight de-duplication.** A naive `useSWR` / server-component fetch on each period change is OK for v1; if users spam the selector, queue / cancel logic matches Angular's guarantee.
- **Hero KPI card with delta arrow + inline sparkline.** Portal has a `KpiCard` component (used on `/agencies`) but it does not yet render a sparkline or a previous-value delta. Either extend `KpiCard` or introduce a dedicated `HeroKpiCard`.
- **Trends chart.** Portal does not yet ship a chart library. Adding one means choosing between `recharts` (lightweight, idiomatic React), `chart.js` (matches Angular's PrimeNG `<p-chart>`), or `visx`. `recharts` is the lowest-friction choice given the Tailwind + shadcn stack.
- **Entity catalog grid.** Six summary cards routing to the corresponding admin lists. Half of these admin lists already exist in the portal (`/agencies`, `/staff`, `/providers`, `/resources`, `/locations`), the other two (`/healthy-living-resources` admin, `/referral-reasons`) need routing decisions.
- **Recent activity feed.** Needs a route handler for `/api/dashboard/recent-activity` (or direct server-component fetch) plus a list component with per-entity icons and relative timestamps.
- **Quick actions rail.** Trivial to render. Permission gating depends on whether the portal exposes a `usePermissions()` hook — if not, gating reduces to "show all four" until the permissions module lands (see `trd-permissions.md`).
- **Per-entity legacy summary endpoints.** Angular calls `/agencies/summary`, `/staff-members/summary`, `/providers/summary`, `/healthy-living-resources/summary`, `/medical-resources/summary`, `/referral-reasons/summary` as fallbacks. Portal already calls `/agencies/summary` directly (see `trd-agencies.md` §1 "API Intersections"). Decision needed: does the portal consume only the aggregated `/admin/dashboard/overview` or keep the per-entity summary endpoints as the primary source?
- **i18n / Transloco.** Every label on the Angular dashboard pulls through `transloco` (keys `Summary_dashboard.Hero_active_participants`, `Summary_dashboard.Quick_action_add_agency`, etc.). Portal uses hard-coded English.
- **OnPush change detection.** N/A — React's render model is closer to OnPush by default.
- **`ngxPermissionsOnly` directive** on quick actions. Replace with a `<HasPermission permission="…">` wrapper component once the portal's session/role data exposes the permission set.

### New in Next.js (would be net-new vs Angular)
- **URL-persistent period selector** — Angular keeps period in service-level state only, lost on hard reload. Portal can place it in `?period=`. (Recommended.)
- **Server-side initial render** of the hero/catalog blocks (Angular renders client-side after each XHR). This eliminates a perceived blank-card flash on first paint.
- **Direct `api.get(…)` from server components** — no `/api/dashboard/*` route handlers needed unless caching or rate-limiting layered in between. Other portal modules (`/agencies`, `/insurers`, …) take both shapes; the dashboard can prefer direct calls for the read-only path.

### Decisions to make before implementation
1. **Chart library** — `recharts` recommended.
2. **Period state location** — URL search param recommended over client store.
3. **Default landing route** — should `/(app)/page.tsx` redirect to `/dashboard` instead of `/agencies` once the dashboard exists? Suggested: yes.
4. **Per-entity `/summary` calls** — keep as fallback for resilience, or rely entirely on the aggregated `/admin/dashboard/overview`? Suggested: rely on the aggregated endpoint, but keep `/agencies/summary` because `/agencies` already calls it independently.
