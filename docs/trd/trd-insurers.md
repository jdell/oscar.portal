# TRD — Insurers

> Technical Requirements Document for the Insurers admin module.
>
> - **Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/insurers/`
> - **Next.js destination:** `oscar.portal/src/app/(app)/insurers/`, `oscar.portal/src/app/api/insurers/`
> - **Source of truth for fields:** `oscar.cloud/libs/models/src/lib/entities/insurer.model.ts`

---

## 1. Functional Requirements

### Data Model

#### `Insurer` (Angular `@oscar/models`)
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `id` | `number` | yes | — | Server-assigned on create |
| `name` | `string` | yes | — | Required (Angular `Validators.required`) |
| `type` | `InsurerType?` | optional | — | Union `'medicare' \| 'medicaid' \| 'private' \| 'other'` |
| `coverage` | `string?` | optional | — | Free-text description |

`INSURER_TYPES` constant in Angular: `['medicare', 'medicaid', 'private', 'other']`.

#### `Insurer` (Next.js `src/lib/types.ts`)
| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Matches Angular |
| `name` | `string` | Matches Angular |
| `type` | `InsurerType \| null` | Same union; nullable to match Angular `optional` |
| `coverage` | `string \| null` | Matches Angular |
| `shortName` | `string \| null` | **Deprecated** — kept for `agencies/[id]` and `resources/[id]` legacy consumer pages; not used in the admin form |

`INSURER_TYPES` constant exported from `src/lib/types.ts` (identical to Angular).

### Business Logic & Validation

#### Angular `admin-insurer.component.ts` form
- `name`: `Validators.required`
- `type`: no validators (nullable)
- `coverage`: no validators
- Save action only fires if `this.form.valid`; otherwise `markFormTouched()` is called.

#### Next.js `insurers-table.tsx` dialog form (Zod schema)
```ts
z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["medicare", "medicaid", "private", "other"]).nullable(),
  coverage: z.string().optional(),
})
```
- `name`: min length 1, message `"Name is required"`.
- `type`: nullable enum.
- `coverage`: optional, no min/max.
- Empty `coverage` is serialized as `null` in the POST/PUT payload.

### API Intersections

All requests go through the participant's bearer token cookie. The Next.js client never calls the backend directly — mutations go through `/api/insurers/*` route handlers which proxy to the .NET API.

#### Angular (`admin-insurers.service.ts`)
| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/insurers` | — | `Insurer[]` |
| POST | `/insurers` | `Insurer` (no `id`) | `Insurer` |
| PUT | `/insurers/{id}` | `Insurer` (full object) | `void` |
| DELETE | `/insurers/{id}` | — | `void` |
| `getByIds(ids)` | _client-side filter over `/insurers`_ | — | `Insurer[]` |

#### Next.js (`/api/insurers/*` → backend)
| Method | Route Handler | Backend Call | Body | Response |
|---|---|---|---|---|
| GET | _Direct `api.get` in `page.tsx`_ | `GET /insurers` | — | `Insurer[]` or `{ items: Insurer[] }` |
| POST | `POST /api/insurers` | `POST /insurers` | `{ id?, name, type, coverage }` | `Insurer` |
| PUT | `PUT /api/insurers/{id}` | `PUT /insurers/{id}` | `{ ...body, id: Number(id) }` (id coerced) | `Insurer` |
| DELETE | `DELETE /api/insurers/{id}` | `DELETE /insurers/{id}` | — | `{ ok: true }` |

The Next.js list page accepts both `Insurer[]` and `{ items: Insurer[] }` envelopes from the backend.

### User Actions

#### Angular `admin-insurers.component.html`
- 4 KPI cards: Total, Medicare, Medicaid, Private (icons: `pi pi-shield`, `pi pi-id-card`, `pi pi-heart`, `pi pi-briefcase`).
- Global search input (icon `pi pi-search`), debounced via PrimeNG `filterGlobal` on fields `['name', 'coverage']`.
- Type filter dropdown with options `[All, Medicare, Medicaid, Private, Other]`, `showClear` enabled.
- Add new button (icon `pi pi-plus`) opens the `AdminInsurerComponent` dialog (`width: '40%'`).
- Table rows: clickable to open edit dialog (`selectionMode="single"`, keyboard-accessible with Enter/Space).
- Pagination: 10 rows default, `rowsPerPageOptions=[10, 25, 50]`, `currentPageReportTemplate` from i18n.
- Type tag column uses PrimeNG `<p-tag>` with `[severity]` mapped per type (`info` / `success` / `warning` / `secondary`).
- Empty state: shows either `Insurer_empty.No_matches` (filter active) or `Insurer_empty.No_insurers` (none at all).

#### Angular `admin-insurer.component.html` (dialog)
- Name input (required-validated, dirty-touched error display).
- Type dropdown with `showClear`, placeholder `Insurer_type.Select_placeholder`.
- Coverage textarea, 3 rows, placeholder `Insurer_coverage_placeholder`.
- Cancel button (closes dialog without save).
- Save button (`pi pi-save`), shows loading spinner from `isBusy$`.
- Delete button (`pi pi-trash`, danger styling) appears **only when `item.id` is set** (edit mode).
- Delete triggers `confirmRemove($event)` → PrimeNG `ConfirmationService.confirm` with message `Confirmation_remove_insurer`, accept runs `delete()`, reject toasts `Action_cancelled`.
- Save success: list refresh + toast `Insurer ${name} saved`.
- Delete success: toast `Insurer_deleted_successfully`.

#### Next.js `insurers-table.tsx`
- 4 KPI cards: Total insurers, Medicare, Medicaid, Private (lucide icons: `Shield`, `IdCard`, `Heart`, `Briefcase`). Accents: indigo, sky, emerald, amber.
- DataTable (TanStack) with built-in global search on `searchKey="name"`, placeholder `"Search by name or coverage…"`.
- Type filter `<Select>`: `[All types, Medicare, Medicaid, Private, Other]`.
- `New insurer` button (lucide `Plus`) opens the in-page `InsurerDialog`.
- Type tag column: emerald/sky/amber/slate ring-1 rounded pill, derived from `TYPE_TAG_CLASS` map.
- Per-row `DropdownMenu` (kebab) with `Edit` and `Delete` actions.
- `Delete` opens a confirmation `Dialog` ("Delete insurer? This will permanently delete '{name}'. This cannot be undone."). Confirm runs DELETE → toast `"Insurer deleted"`.
- Edit/Create dialog: Name input, Type select (with `Unspecified` option mapping to `null`), Coverage textarea (4 rows), Cancel / Save buttons.
- Save success: toast `Insurer ${name} saved` (edit) or `Insurer created` (new); `router.refresh()`.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- Component-local state in `AdminInsurersComponent` (`insurers`, `filteredInsurers`, `selectedType`, `typeCounts`, `isLoading`).
- `ChangeDetectionStrategy.OnPush` everywhere; explicit `cdr.markForCheck()` after async loads.
- Edit dialog opened via `DialogService.open(AdminInsurerComponent, { data: item, width: '40%' })`; result delivered via `ref.onClose` observable (`untilDestroyed(this)`).
- `MessageService` from PrimeNG for success toasts.
- No global store; data is re-fetched after every save/delete.

#### Next.js
- Server component (`page.tsx`) fetches with `api.get("/insurers")` on every render.
- Client component `InsurersTable` keeps local UI state (`dialogOpen`, `editing`, `deletingId`, `confirmTarget`, `typeFilter`) with `useState`.
- KPI counts and filtered list computed via `useMemo`.
- `router.refresh()` re-runs the server component after a mutation succeeds.
- `react-hook-form` + `zodResolver` manage form state; `form.watch("type")` drives the controlled `<Select>`.
- `sonner` `toast.success` / `toast.error` for user feedback.

### Permissions
- **Angular admin app:** Route lives under `/admin/insurers` in the staff/admin app; access is gated by the staff-portal route guards (logged-in admin users).
- **Next.js portal:** Route lives at `/(app)/insurers`. The `(app)` route group is wrapped by `requireSession()` in `app/(app)/layout.tsx`; only authenticated super-admin sessions can access. No per-permission gating inside the page.

### Error Handling

#### Angular
- All async calls flow through `ErrorHandlerService.handleError(error)` in the component's `catch` block.
- The PrimeNG `<p-confirmDialog />` handles destructive confirmation.
- Form invalid → `markFormTouched(form)` so PrimeNG `app-form-wrapper` shows field-level errors.

#### Next.js
- `api.ts` throws `ApiError(status, body)` on non-2xx.
- Server component `loadInsurers()` catches `ApiError`, logs to console, returns `[]` so the page still renders.
- Route handlers wrap calls in try/catch, return `{ message, body? }` with the backend status code when an `ApiError` is caught.
- Client mutations show `sonner` toasts on error (`body.message ?? "Save failed" / "Delete failed"` or `"Network error — try again"` on thrown network errors).
- Dialog disables Cancel + Delete buttons while `deletingId !== null` to prevent double-clicks.

---

## 3. Migration Checklist

Definition of Done for the Insurers Next.js port:

- [x] `Insurer` interface in `src/lib/types.ts` matches the Angular `@oscar/models` `Insurer` (id, name, type, coverage).
- [x] `InsurerType` union and `INSURER_TYPES` constant exported, identical to Angular.
- [x] List page (`/insurers`) renders all insurers from `GET /insurers`.
- [x] 4 KPI cards: Total, Medicare, Medicaid, Private.
- [x] Type filter dropdown with `All / Medicare / Medicaid / Private / Other`.
- [x] Search by name + coverage.
- [x] Type tag column with severity-mapped colors.
- [x] Create dialog (Name required, Type dropdown with `Unspecified`, Coverage textarea).
- [x] Edit dialog reuses the create dialog with prefilled values.
- [x] Delete with confirmation dialog (matches Angular's `confirmRemove`).
- [x] `POST /api/insurers` proxies to `POST /insurers`.
- [x] `PUT /api/insurers/{id}` proxies to `PUT /insurers/{id}`.
- [x] `DELETE /api/insurers/{id}` proxies to `DELETE /insurers/{id}`.
- [x] Success/error toasts via `sonner`.
- [x] Page is wrapped by `requireSession()` via `(app)` group layout.
- [x] Build passes `next build` type-check.

---

## 4. Gap Analysis

### In Angular but missing in Next.js
- **i18n / Transloco**: All labels in Angular pull through `*transloco="let t"` and `transloco` pipe (keys `Insurer_type.Label`, `Insurer_coverage`, `Insurer_summary.Total`, `Insurer_empty.*`, `PaginationTemplate`, `Action_cancelled`, `Confirmation_remove_insurer`, etc.). Next.js uses hard-coded English strings.
- **PrimeNG `currentPageReportTemplate`**: "Showing X to Y of N" pagination footer. Next.js DataTable does not render a counts summary.
- **`rowsPerPageOptions=[10, 25, 50]`**: Angular lets the user change page size. Next.js DataTable uses a fixed default page size.
- **`responsiveLayout="scroll"`** on the PrimeNG table for narrow viewports. Next.js relies on default DataTable behaviour.
- **Loading skeleton on KPI cards** (`<app-kpi-card [loading]="isLoading" />`). Next.js KPI cards do not show a skeleton state.
- **`getByIds(ids)` helper** on the Angular service. Not implemented in the Next.js layer (no consumer needs it yet).
- **Per-tag PrimeNG severity tokens** (`info`, `success`, `warning`, `secondary`). Next.js uses Tailwind classes with the same color intent but no token system.
- **Empty-state distinction**: Angular shows `Insurer_empty.No_matches` vs `Insurer_empty.No_insurers` with full title + body. Next.js shows a single inline empty message inside the DataTable.

### New in Next.js (not in Angular)
- **Backend id coercion**: `PUT /api/insurers/{id}` spreads `{ ...body, id: Number(id) }` into the payload before forwarding (defensive — Angular sends the full client object).
- **`Insurer.shortName` field**: kept in `src/lib/types.ts` as a `@deprecated` optional for backward compatibility with `agencies/[id]` and `resources/[id]` legacy consumer pages that haven't been re-ported yet. Not surfaced in the admin form.
- **List envelope flexibility**: Next.js list loader accepts either `Insurer[]` or `{ items: Insurer[] }`. Angular only handles the bare array.
- **`Unspecified` option in type dropdown**: explicit `__none__` value that maps to `null` on submit. Angular uses `showClear` on PrimeNG dropdown to achieve the same null-out.
- **Kebab `DropdownMenu` per row**: Angular opens the edit dialog by clicking the row; delete is only inside the dialog. Next.js exposes Edit + Delete as a row-level dropdown menu, so delete is reachable without opening the dialog first.
- **Inline confirmation `<Dialog>`**: Next.js renders a custom confirmation dialog component. Angular uses PrimeNG `<p-confirmDialog />` triggered by `ConfirmationService`.
- **`router.refresh()` after mutation**: Next.js uses App Router cache-invalidation semantics. Angular re-calls `loadInsurers()` imperatively.
