# TRD — Agencies

> Technical Requirements Document for the Agencies admin module.
>
> - **Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/agencies/`
> - **Next.js destination:** `oscar.portal/src/app/(app)/agencies/`, `oscar.portal/src/app/api/agencies/`
> - **Source of truth for fields:** `oscar.cloud/apps/oscar-app/src/app/features/admin/agencies/common/agency.model.ts` + `address.model.ts`

---

## 1. Functional Requirements

### Data Model

#### `Agency` (Angular `common/agency.model.ts`)
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `id` | `number` | yes (on update) | — | Server-assigned on create; new agencies are submitted with no `id` |
| `name` | `string` | yes | — | `Validators.required` |
| `active` | `boolean` | yes | `true` for new records | `new` form defaults via `{ active: true } as Agency` |
| `address` | `Address` | yes (sub-form required) | — | Reactive `FormGroup` — see below |
| `permissions` | `number[]` | optional | `[]` | Many-to-many to permissions; managed in dedicated child component |
| `counties` | `number[]` | optional | `[]` | Many-to-many to counties; managed in `CountiesComponent` |
| `insurers` | `number[]` | optional | `[]` | Many-to-many to insurers; managed in `InsurancesComponent` |
| `healthyLivingResources` | `number[]` | optional | `[]` | Many-to-many to HLR; managed in `HealthyLivingResourcesComponent` |
| `medicalResources` | `number[]` | optional | `[]` | Many-to-many to medical resources; managed in `MedicalResourcesComponent` |
| `directorId` | `number` | optional | — | FK to `StaffMember`; dropdown sourced from `AdminStaffMembersService.query()` |

#### `Address` (Angular `common/address.model.ts`)
| Field | Type | Required | Notes |
|---|---|---|---|
| `street` | `string` | yes | `Validators.required` |
| `city` | `string` | yes | `Validators.required` |
| `state` | `string` | yes | `Validators.required`; defaults to `ConfigService.config.defaults.state` for new addresses |
| `zipCode` | `string` | yes | `Validators.required, Validators.minLength(5)` |
| `latitude` | `number` | — | Not in form; populated server-side via geocoding |
| `longitude` | `number` | — | Same |

#### `Agency` (Next.js `src/lib/types.ts`)
| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` (string) | **Schema mismatch:** Angular uses `number`, portal uses UUID string |
| `organizationId` | `UUID` | New — multi-tenant scoping not modelled in Angular |
| `name` | `string` | Matches Angular |
| `shortName` | `string \| null` | New — not in Angular `agency.model.ts` |
| `status` | `AgencyStatus` (`'active' \| 'inactive' \| 'pending'`) | New — replaces Angular's boolean `active`. `pending` is portal-only |
| `active` | `boolean?` | Legacy field kept for backward compatibility with the boolean form path; convergence pending |
| `address` | `Address \| null` | Same shape, optional fields |
| `primaryLocation` | `string \| null` | New — UI-only convenience |
| `staffCount` | `number` | New — denormalised count, server-computed |
| `directorId` | `UUID \| null` | UUID instead of `number` |
| `directorName` | `string \| null` | New — denormalised, server-supplied |
| `permissions / counties / insurers / healthyLivingResources / medicalResources` | `UUID[]?` | UUID strings instead of `number[]` |
| `createdAt`, `updatedAt` | `string` (ISO) | New — audit fields surfaced |

Related types in `src/lib/types.ts`:
- `AgencyFilterOptions { states: string[]; counties: {id, name}[]; insurers: {id, name}[] }`
- `AgencySummary { total, active, newInPeriod, newInPreviousPeriod, sparkline7d }`
- `AgencyDetail extends Agency` with `email`, `phone`, `website`, `description`
- `AgencyCohort`, `AgencyLocation` for the detail-page tabs

### Business Logic & Validation

#### Angular `AdminAgencyComponent` form (`buildForm`)
- `name`: `Validators.required`
- `address.street`: `Validators.required`
- `address.city`: `Validators.required`
- `address.state`: `Validators.required` + defaults to `ConfigService.config.defaults.state`
- `address.zipCode`: `Validators.required, Validators.minLength(5)`
- `active`, `directorId`, child many-to-many arrays: no validators
- Save action: `if (!this.form.valid) { markFormTouched(this.form); return }`. Only after validation passes does `update(id, agency)` or `create(agency)` fire.

#### Next.js `agency-form.tsx` (Zod schema)
```ts
z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  // address sub-object validated separately; required street/city/state/zipCode
})
```
- Schema matches the Angular reactive form's intent: `name` required, `address.*` required, `status` is the boolean-equivalent.
- Empty optional fields are serialized as `null` on save.

### API Intersections

All requests flow through the bearer-token-cookie path. The Next.js client never calls the backend directly — mutations go through `/api/agencies/*` route handlers which proxy to the .NET API.

#### Angular (`AdminAgenciesService`)
| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/agencies` | — | `Agency[]` |
| GET | `/agencies/search` | — | `PaginatedResponse<Agency>` — params: `page`, `pageSize`, `search`, `sortBy`, `sortDescending`, `active`, `state`, `countyIds[]`, `insurerIds[]` |
| GET | `/agencies/filter-options` | — | `AgencyFilterOptions { states, counties, insurers }` |
| GET | `/agencies/{id}` | — | `Agency` |
| POST | `/agencies` | `Agency` (no `id`) | `Agency` (with id) |
| PUT | `/agencies/{id}` | `Agency` (full object) | `void` |
| DELETE | `/agencies/{id}` | — | `void` |
| GET | `/class-locations?agencyId={id}` | — | `AgencyLocation[]` |
| GET | `/cohorts?agencyId={id}` | — | `AgencyCohort[]` |
| `getByIds(ids)` | _client-side filter over `/agencies`_ | — | `Agency[]` |

#### Next.js (`/api/agencies/*` → backend)
| Method | Route Handler | Backend Call | Body | Response |
|---|---|---|---|---|
| GET | _Direct `api.get` in `page.tsx`_ | `GET /agencies` | — | `Agency[]` or `{ items: Agency[] }` |
| GET | _Direct in `page.tsx`_ | `GET /agencies/filter-options` | — | `AgencyFilterOptions` |
| GET | _Direct in `page.tsx`_ | `GET /agencies/summary` | — | `AgencySummary` |
| POST | `POST /api/agencies` | `POST /agencies` | `Agency` (no `id`) | `Agency` |
| PUT | `PUT /api/agencies/{id}` | `PUT /agencies/{id}` | `Agency` | `Agency` |
| DELETE | `DELETE /api/agencies/{id}` | `DELETE /agencies/{id}` | — | `{ ok: true }` |
| POST | `POST /api/agencies/{id}/sync` | `POST /agencies/{id}/sync` | — | `{ ok: true, result }` — **New in Next.js**; no Angular equivalent |

### User Actions

#### Angular `admin-agencies.component.html`
- 1 KPI card bound to `dashboardOverviewStore.entitySummaries().find(e => e.key === 'agencies')` (Total / Active / New in period / sparkline).
- Server-paged PrimeNG `<p-table>` with `[lazy]="true"`, `[rows]="25"`, `rowsPerPageOptions=[10, 25, 50]`.
- Global search input (icon `pi pi-search`), debounced **300ms** through `Subject<string>` + `debounceTime` + `distinctUntilChanged`.
- Status filter `<p-selectButton>` with `[All, Active, Inactive]`.
- State filter PrimeNG `<p-multiSelect>` populated from `filterOptions.states`.
- County filter `<p-multiSelect>` populated from `filterOptions.counties` (id-name pairs).
- Insurer filter `<p-multiSelect>` populated from `filterOptions.insurers` (id-name pairs).
- Clear filters button visible when `hasActiveFilters() === true`.
- "New agency" button (icon `pi pi-plus`) routes to `/admin/agencies/new`.
- Row click navigates to `/admin/agencies/{id}` (detail drawer).
- Per-row PrimeNG `<p-menu>` kebab: View / Edit / Delete (Delete styled as `p-menuitem--danger`).
- Delete confirmation via `ConfirmationService.confirm` with message `Confirmation_delete` (interpolates agency name).
- 8-row skeleton placeholder while `loading()` is true.
- Error banner via `<p-message>` when `errored()` is true.

#### Angular `admin-agency.component.html` (edit / create)
- Wrapped in `app-form-wrapper` controls for inline validation hints.
- Name input (required).
- Address fieldset: Street / City / State (dropdown sourced from `StatesService.query()`) / Zip (min 5).
- Active toggle (`<p-inputSwitch>`).
- Director dropdown sourced from `AdminStaffMembersService.query()`.
- Permissions, Insurances, Counties, Healthy-Living Resources, Medical Resources — each is a dedicated child component managing its own `number[]` slice.
- Save button (`pi pi-save`), shows loading spinner from `isBusy$`.
- Cancel button — returns to `/admin/agencies/{id}` (edit) or `/admin/agencies` (new).
- Delete button (`pi pi-trash`, danger) visible only when `item.id` is set (edit mode).
- Delete triggers `confirmDeleteAgency` → PrimeNG `<p-confirmDialog />` with message `Confirmation_Delete_Agency`; accept runs `remove(id)`, reject toasts `Action_cancelled`.
- Save success: toast `Confirmation_update_agency` (edit) / `Confirmation_create_agency` (new); list refresh + navigate.

#### Next.js `agencies-table.tsx`
- Status filter `<Select>`: `[All, Active, Inactive]`.
- State / County / Insurer multi-select chip groups (`MultiSelect` component) sourced from `loadFilterOptions()`.
- `X` icon to clear an individual chip filter; clear-all button when any filter active.
- TanStack `DataTable` with built-in global search.
- Status badge column using `STATUS_VARIANTS` map (`active → default`, `inactive → secondary`, `pending → outline`).
- Address column built via `formatAddress(agency)` — concatenates street / city / state+zip with `", "` separators.
- Row link navigates to `/(app)/agencies/{id}`.
- `New agency` button (lucide `Plus`) navigates to `/(app)/agencies/new`.
- Detail page `/(app)/agencies/[id]` exposes a "Force sync" button (`force-sync-button.tsx`) wired to `POST /api/agencies/{id}/sync` — no Angular equivalent.

#### Next.js `agency-form.tsx`
- Name input (required), shortName (optional).
- Status dropdown: Active / Inactive / Pending.
- Address sub-form: street / city / state / zip (zip min 5 — same as Angular).
- Director dropdown sourced from a `/api/staff` lookup (or null).
- Save → `POST /api/agencies` (new) or `PUT /api/agencies/{id}` (edit); `router.refresh()` after success; toast on success / error.
- Cancel → `router.back()`.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- `AdminAgenciesComponent`: signal-based state — `agencies`, `totalCount`, `loading`, `errored`, `searchTerm`, `statusFilter`, `stateFilter`, `countyFilter`, `insurerFilter`, `filterOptions`, `drawerOpen`.
- `hasActiveFilters` is a `computed()` of the five filter signals.
- `agencySummary` is a `computed()` over `DashboardOverviewStore.entitySummaries()`.
- `ChangeDetectionStrategy.OnPush` with explicit `cdr.markForCheck()` after `fetch()` completes.
- Search debounced with `Subject<string>` + `debounceTime(300)` + `distinctUntilChanged`, subscribed in `ngOnInit`, unsubscribed via `takeUntilDestroyed(destroyRef)`.
- Drawer state synced from `route.firstChild` on every `NavigationEnd` event.
- Row menu uses a one-slot `rowMenuItem` signal so a single shared `<p-menu>` can be reused per row click.

#### Next.js
- Server component `page.tsx` does the initial `loadAgencies()` + `loadFilterOptions()` + `loadSummary()` on every render.
- Client `agencies-table.tsx` keeps filter state with `useState` (`statusFilter`, `stateFilter`, `countyFilter`, `insurerFilter`); filtered list computed via `useMemo`.
- Pagination is currently client-side via TanStack DataTable — **does not yet use `/agencies/search`**. (See Gap Analysis §4.)
- `agency-form.tsx` uses `react-hook-form` + `zodResolver`; toast feedback via `sonner`.
- `router.refresh()` after a mutation triggers the server component to re-fetch.

### Permissions
- **Angular admin app:** `/admin/agencies` routes are guarded at the staff-portal level (logged-in admin only). The kebab Delete entry is shown to all admins; `AdminPermission.AGENCY_MANAGE` is enforced for the Add Agency quick action on the dashboard but not re-checked here.
- **Next.js portal:** `(app)/agencies/*` route group is wrapped by `requireSession()` in `(app)/layout.tsx`; only authenticated super-admin sessions can access. No per-action gating inside the page.

### Error Handling

#### Angular
- All async calls (`service.search`, `service.delete`, `service.getFilterOptions`) wrapped in try/catch. On failure the component sets `errored.set(true)` and clears the list.
- Filter-options failure is non-fatal — dropdowns stay empty.
- Delete failure → `messageService.add({ severity: 'error', detail: 'Error' })`.
- Form-validation failure → `markFormTouched(form)` to surface inline `app-form-wrapper` errors.

#### Next.js
- `api.ts` throws `ApiError(status, body)` on non-2xx.
- Server `loadAgencies()` catches `ApiError`, logs to console, returns `[]` so the page still renders.
- `loadFilterOptions()` returns `{ states: [], counties: [], insurers: [] }` on failure (no crash, no toast).
- `loadSummary()` returns `null` on failure; KPI card hides.
- Route handlers wrap calls in try/catch and return `{ message, body? }` with the backend status code.
- Client mutations surface errors as `sonner` toasts (`body.message ?? "Save failed"`).

---

## 3. Migration Checklist

Definition of Done for the Agencies Next.js port:

- [x] `Agency` interface in `src/lib/types.ts` covers all Angular fields (+ portal-only `organizationId`, `shortName`, `status`, `staffCount`, `createdAt`, `updatedAt`).
- [x] `Address` interface with `street`, `city`, `state`, `zipCode`, `latitude`, `longitude`.
- [x] `AgencyFilterOptions`, `AgencySummary`, `AgencyDetail`, `AgencyCohort`, `AgencyLocation` types defined.
- [x] List page (`/agencies`) renders all agencies from `GET /agencies`.
- [x] Status filter (`All / Active / Inactive` — `pending` portal-only).
- [x] State / County / Insurer multi-select chip group filters.
- [x] Clear-filters affordance.
- [x] Address column with concatenated formatting.
- [x] `New agency` button → `/agencies/new`.
- [x] Row link → `/agencies/{id}`.
- [x] Agency detail page (`/agencies/[id]`) with `Force sync` button (portal-only feature).
- [x] Create / Edit form: Name required, Address sub-form with state/zip validation, Status dropdown, Director dropdown.
- [x] `POST /api/agencies` → `POST /agencies`.
- [x] `PUT /api/agencies/{id}` → `PUT /agencies/{id}`.
- [x] `DELETE /api/agencies/{id}` → `DELETE /agencies/{id}`.
- [x] `POST /api/agencies/{id}/sync` (portal-only).
- [x] Success/error toasts via `sonner`.
- [x] Page wrapped by `requireSession()` via `(app)` group layout.
- [x] Build passes `next build` type-check.
- [ ] **Server-side `/agencies/search` pagination** wired (currently client-side TanStack). See Gap Analysis §4.
- [ ] Per-row kebab menu with View / Edit / Delete (parity with Angular).
- [ ] Delete confirmation dialog at the list level (parity with Angular).
- [ ] KPI card bound to `/agencies/summary` (currently fetched but not surfaced consistently).

---

## 4. Gap Analysis

### In Angular but missing in Next.js
- **Server-side pagination via `/agencies/search`.** Angular uses `[lazy]="true"` with `page`/`pageSize`/`sortBy`/`sortDescending` query params and merges results with all filter dimensions. Next.js loads all agencies via `/agencies` and paginates in the browser. For large tenants this won't scale.
- **300ms search debounce.** Angular debounces typed input through an RxJS `Subject`. Next.js `DataTable` filters on each keystroke.
- **Per-row kebab menu.** Angular exposes View / Edit / Delete on each row; Next.js requires opening the detail page to delete.
- **Delete confirmation at list level.** Angular's `ConfirmationService.confirm` fires from the kebab. Next.js delete only exists on the detail page.
- **i18n / Transloco.** Every Angular label is `*transloco`-piped (`Confirm`, `Cancelled`, `Action_cancelled`, `Confirmation_delete`, `Status_all`, etc.). Next.js uses hard-coded English.
- **Skeleton rows during load.** Angular shows 8 PrimeNG skeleton rows. Next.js shows `loading.tsx` route fallback only on initial render.
- **Error banner.** Angular renders a `<p-message>` when `errored()` is true. Next.js silently shows an empty list on `loadAgencies` failure.
- **`rowsPerPageOptions=[10, 25, 50]`.** Angular lets the user change page size. Next.js uses DataTable's fixed default.
- **Permissions-managed many-to-many child components** in the edit form: dedicated PermissionsComponent / InsurancesComponent / CountiesComponent / HealthyLivingResourcesComponent / MedicalResourcesComponent. Next.js form is flat — these collections aren't editable today.
- **`getByIds(ids)` helper** on the Angular service. Not present in Next.js.
- **Drawer-style detail layout.** Angular uses a `<p-sidebar>` that slides over the list when navigating to `/admin/agencies/{id}`. Next.js uses a full-page navigation.

### New in Next.js (not in Angular)
- **`organizationId` field** — multi-tenant scoping not modelled in Angular.
- **`shortName` field** — agency display abbreviation.
- **`status: 'pending'`** — a third status state not in Angular (which is a boolean `active`).
- **`staffCount`, `directorName` denormalised fields** surfaced for UI convenience.
- **`createdAt` / `updatedAt`** audit timestamps surfaced.
- **`AgencySummary`** type and `/agencies/summary` endpoint — Angular reaches the same data through the dashboard overview store; Next.js calls the dedicated summary endpoint directly.
- **`AgencyDetail`** type extending `Agency` with `email`, `phone`, `website`, `description`.
- **`POST /api/agencies/{id}/sync`** — force-sync action exposed on the agency detail page. No Angular equivalent.
- **UUID identifiers** throughout — the portal moved from `number` to UUID `string` IDs.
- **List envelope flexibility** — Next.js loader accepts either `Agency[]` or `{ items: Agency[] }`. Angular only handles the bare array.
- **`router.refresh()` after mutation** uses Next.js App Router cache invalidation. Angular re-calls `fetch()` imperatively.
