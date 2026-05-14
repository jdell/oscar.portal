# TRD — Providers

**Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/providers/`
**Next.js destination:** `oscar.portal/src/app/(app)/providers/`

---

## 1. Functional Requirements

### Data Model

**`Provider`** (`libs/models/src/lib/entities/provider.model.ts`)

| Field                        | Type      | Default (new) | Notes                                |
| ---------------------------- | --------- | ------------- | ------------------------------------ |
| `id`                         | `number`  | —             | Server-assigned                      |
| `name`                       | `string`  | —             | Required (single string, not first/last) |
| `emailAddress`               | `string`  | `''`          | Trimmed; optional with email format  |
| `medicalResourceId`          | `number`  | —             | Required; FK to `MedicalResource`    |
| `providerParticipationTypeId`| `number`  | —             | Required; FK to `ProviderParticipationType` |
| `active`                     | `boolean` | `true`        | InputSwitch                          |

**`ProviderParticipationType`** — `{ id: number, name: string }` (sourced from `/participation-types`).
**`MedicalResource`** — referenced by id; loaded from `/medical-resources` and joined client-side.

**`EnhancedProvider`** (in-app aggregate, `data/models/enhanced.model.ts`) extends `Provider` with:
- `medicalResource: MedicalResource` (joined from `/medical-resources` by `medicalResourceId`)
- `participationType: ProviderParticipationType` (joined from `/participation-types` by `providerParticipationTypeId`)

**Derived row shape** (`admin-providers.component.ts`, `ProviderRow`) extends `EnhancedProvider` with:
- `firstName`, `lastName` from `splitProviderName(name)` (whitespace split — first token & last token)
- `specialtyKey`: lowercase trimmed participationType name; `'__unknown__'` when missing
- `specialtyLabel`: trimmed participationType name; `''` when missing
- `specialtySeverity`: hashed key → one of `['info','success','warning','danger','primary','secondary']` for deterministic colour

**Derived summary** (`ProviderSummary`) computed by `computeProviderSummary`:
- `total`, `active`, `inactive`, `bySpecialty: ProviderSpecialtyBreakdown[]`
- `ProviderSpecialtyBreakdown` = `{ key, label, count }`; sorted desc by `count`

### Business Logic & Validation

**Form** (`admin-provider.component.ts`, `buildForm`):

| Field                          | Validators                                |
| ------------------------------ | ----------------------------------------- |
| `name`                         | `Validators.required`                     |
| `emailAddress`                 | `Validators.email` only (NOT required); pre-trimmed via `item.emailAddress?.trim() || ''` |
| `medicalResourceId`            | `Validators.required`                     |
| `providerParticipationTypeId`  | `Validators.required`                     |
| `active`                       | none (InputSwitch)                        |

**On submit (`save()`):**
- If `form.invalid` → `markFormTouched(form)`, abort.
- `getRawValue()` → `Provider`.
- If `!value.id` → `POST /providers`; else → `PUT /providers/{id}`.
- On success → `dynamicDialogRef.close(value)` (parent reloads list and toasts).
- On error → `errorHandlerService.handleError(error)`.

**Delete (`confirmRemove`):**
- `p-confirmDialog` with message `Confirmation_delete_provider`, header `Confirm`.
- Accept → `remove()` → `DELETE /providers/{id}` → close dialog with `item` → toast severity success, summary `Confirmation`, detail `Provider_deleted_successfully`.
- Reject → toast info, summary `Cancelled`, detail `Action_cancelled`.

### API Intersections

| Method | Path                       | Request Body | Response                          | Caller                              |
| ------ | -------------------------- | ------------ | --------------------------------- | ----------------------------------- |
| GET    | `/providers`               | —            | `Provider[]`                      | List page (called inside `query()`) |
| GET    | `/medical-resources`       | —            | `MedicalResource[]`               | List page (join) + provider form    |
| GET    | `/participation-types`     | —            | `ProviderParticipationType[]`     | List page (join) + provider form    |
| POST   | `/providers`               | `Provider`   | `Provider`                        | Dialog save (new)                   |
| PUT    | `/providers/{id}`          | `Provider`   | `void`                            | Dialog save (edit)                  |
| DELETE | `/providers/{id}`          | —            | `void`                            | Dialog delete (confirmed)           |

`AdminProvidersService.query()` performs all three GETs in `Promise.all` then joins by `medicalResourceId` and `providerParticipationTypeId`.

### User Actions

**List page** (`admin-providers.component.html`):

| Element                                       | Action                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| 3 KPI cards (`<app-kpi-card>`):                |                                                        |
| — Total providers (`pi pi-globe`, accent `#8E24AA`) | `summary.total`                                  |
| — Active (`pi pi-check-circle`, accent `#16A34A`)   | `summary.active`                                 |
| — Inactive (`pi pi-pause-circle`, accent `#6B7280`) | `summary.inactive`                               |
| Specialty legend (`p-tag` per entry)          | Shown when `summary.bySpecialty.length > 0`; severity = `specialtySeverity(entry.key)`; value = `"{label} · {count}"` |
| Search input (`#providerSearch`)              | `filterGlobal(value, 'contains')` over `['name','emailAddress','specialtyLabel','medicalResource.name']` |
| Specialty dropdown                            | options = `[{Specialty_all}, …summary.bySpecialty]`; `onSpecialtyChange` → applyFilters |
| Status dropdown                               | options = `[Status_all, Status_active, Status_inactive]`; `onStatusChange` → applyFilters |
| "Add new" button (`pi pi-plus`)               | `add()` → opens edit dialog with `{ active: true }`   |
| Row click / Enter / Space                     | `edit(item)` → opens dialog                           |
| Columns: avatar (initials) + name+email, specialty tag, email, medicalResource card (with city/state or primaryContact subtitle), status tag | — |
| Pagination                                    | rows = 10, `rowsPerPageOptions=[10,25,50]`, `currentPageReportTemplate=PaginationTemplate` |
| Empty state                                   | Icon `pi pi-briefcase` + title `EmptyState_noProviders_title` + body `EmptyState_noProviders_body` + "Add Provider" button `EmptyState_addProvider` |
| Loading                                       | `[loading]="loading"`; KPI cards show loading state too |

**Provider dialog** (`admin-provider.component.html`):

| Element                              | Action                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Dialog header                        | "Provider"; width 50%                                 |
| Name input                           | `name` (required)                                     |
| Email input                          | `emailAddress` (email-format only)                    |
| Medical Resource Dropdown            | `medicalResourceId` (required) — options from `medicalResources$` |
| Participation Type Dropdown          | `providerParticipationTypeId` (required) — options from `participationTypes$` |
| Active InputSwitch                   | `active`                                              |
| "Delete" button (only when `item.id`)| `confirmRemove($event)` → `p-confirmDialog` → DELETE → close with item + toast `Provider_deleted_successfully` |
| "Cancel" button                      | `dynamicDialogRef.close()`                            |
| "Save" button                        | `save()`; loading=`isBusy$`; on close, parent component toasts `Provider {name} saved` and reloads |

---

## 2. Non-Functional Requirements

### State Management

- **Component-level only.** List uses plain class fields: `rows`, `filteredRows`, `loading`, `statusFilter`, `specialtyFilter`, `statusOptions`, `specialtyOptions`, `summary`.
- Dialog uses `isBusy$: Subject<boolean>` + two Promises (`participationTypes$`, `medicalResources$`) consumed with `| async`.
- **Change detection:** `ChangeDetectionStrategy.OnPush`. `cdr.markForCheck()` called explicitly after `loadProviders()` toggles `loading`, and in filter change handlers.
- **Dialog wiring:** opened via `DialogService.open(AdminProviderComponent, { header:'Provider', width:'50%', data: item })`; result observed via `ref.onClose.pipe(untilDestroyed(this))`.
- **No resolver** — list pulls everything in `ngOnInit`; there is no `/admin/providers/:id` route in the routing module.

### Permissions

- Inherits gating from `/admin` parent. Module defines a single route at `''` with no guards.
- Form does not branch on user role.

### Error Handling

- All HTTP failures (`save`, `remove`, list `query()`) → `ErrorHandlerService.handleError(error)`.
- `getByIds([])` short-circuits to `[]`.
- `loadProviders` wraps the call in try/finally only — failures bubble unhandled to whatever global Angular error handler is wired (the list will keep `loading=false` but no toast emitted from this component).
- No client-side retry, no offline cache.

### Performance

- `query()` issues 3 parallel GETs each time the list reloads (after every save/delete) — no caching.
- `getByIds(ids)` for downstream callers (used by Medical Resource detail) re-issues all 3 parallel GETs to filter in-memory.

---

## 3. Migration Checklist (Definition of Done)

| #   | Item                                                                                       | Angular | Next.js (`oscar.portal`) |
| --- | ------------------------------------------------------------------------------------------ | :-----: | :----------------------: |
| 1   | Single list route `/providers` (no detail / edit sub-routes)                               | ✅      | ❌ Portal has `/providers/{id}` detail and `/providers/{id}/edit` separate routes |
| 2   | 3 KPI cards: Total, Active, Inactive                                                       | ✅      | ✅                       |
| 3   | KPI cards render loading state                                                              | ✅      | ⚠️ Renders but skeleton state is inline |
| 4   | Specialty legend chips (`label · count` with stable severity)                              | ✅      | ✅                       |
| 5   | Global search over `name + emailAddress + specialtyLabel + medicalResource.name`           | ✅      | ⚠️ Searches `name` only via DataTable's default filter |
| 6   | Specialty dropdown filter                                                                   | ✅      | ✅                       |
| 7   | Status dropdown filter (all / active / inactive)                                           | ✅      | ✅                       |
| 8   | Add new button → open dialog                                                                | ✅      | ❌ Portal navigates to `/providers/new` route |
| 9   | Row click → open dialog                                                                     | ✅      | ❌ Portal navigates to `/providers/{id}/edit` route |
| 10  | Columns: avatar (firstName+lastName), name+email, specialty tag, email, medicalResource card (with city/state/primaryContact subtitle), status tag | ✅      | ⚠️ Avatar + name+email merged in one cell; specialty colour from `specialty-key`; resource card present; subtitle uses city/state OR primaryContact |
| 11  | Empty state with icon + title + body + Add Provider button                                  | ✅      | ⚠️ Generic "No providers found." (DataTable default) |
| 12  | Pagination 10/25/50 + current-page report                                                  | ✅      | ⚠️ Prev/next, no rows-per-page picker |
| 13  | Provider form rendered inside a `DynamicDialog`                                            | ✅      | ❌ Portal renders the form on a full page route |
| 14  | Form fields: name (req), emailAddress (email only), medicalResourceId (req), participationType (req), active switch | ✅      | ✅                       |
| 15  | Email validator is **email-format only** (not required)                                     | ✅      | ❌ Portal uses `z.string().email("Invalid email").optional().or(z.literal(""))` — same effect, but renders error for malformed email + accepts empty |
| 16  | medicalResourceId / participationTypeId required validators                                | ✅      | ✅ (via `.positive()` after coerce on the portal Zod schema) |
| 17  | Delete button visible in dialog only when `item.id` exists                                  | ✅      | ✅ (on the edit form)    |
| 18  | Delete confirmation via dialog (`Confirmation_delete_provider`)                            | ✅ (`p-confirmDialog`) | ⚠️ Uses native `confirm()` |
| 19  | Save success toast `Provider {name} saved` (from parent after dialog close)                | ✅      | ✅                       |
| 20  | Delete success toast `Provider_deleted_successfully`                                         | ✅      | ✅ ("Provider deleted")  |
| 21  | Translations EN/ES via Transloco                                                            | ✅      | ❌ English-only           |
| 22  | Pre-trim email on load (`item.emailAddress?.trim() || ''`)                                  | ✅      | ⚠️ Portal does not trim; uses raw value |
| 23  | List-page `query()` joins providers + medicalResources + participation-types in one round-trip Promise.all | ✅ | ⚠️ Portal does the same in `loadProviders` |
| 24  | Reload list after dialog save                                                              | ✅      | ⚠️ Portal calls `router.refresh()` after redirect to list |

---

## 4. Gap Analysis

### Present in Angular, missing or differing in Next.js

1. **Dialog vs route.** Angular: provider create/edit are a modal `DynamicDialog`. Portal: full-page routes (`/providers/new`, `/providers/{id}`, `/providers/{id}/edit`).
2. **Single list route.** Angular's routing module declares only `path: ''`. Portal added `[id]/`, `[id]/edit/`, and `new/`.
3. **Confirm dialog vs `confirm()`.** Angular uses `p-confirmDialog` with styled accept/reject buttons and translated strings. Portal uses the browser-native `window.confirm()`.
4. **Global search over 4 fields.** Angular searches `name + emailAddress + specialtyLabel + medicalResource.name`. Portal only filters the `name` column.
5. **Specialty severity palette.** Angular: hash → `['info','success','warning','danger','primary','secondary']` PrimeNG tokens. Portal: hash → custom Tailwind `bg-*-100 text-*-800` class strings. Visually different.
6. **Pre-trim email on load.** Angular trims `item.emailAddress` when building the form. Portal stores whatever the API returned verbatim.
7. **Empty state with CTA.** Angular: icon + translated title/body + "Add Provider" button. Portal: plain "No providers found.".
8. **Loading state.** Angular passes `[loading]="loading"` down to the table AND the KPI cards. Portal renders cards immediately (no skeleton).
9. **Pagination.** Angular `p-table`: rows-per-page picker `[10,25,50]` + current-page report. Portal: prev/next only.
10. **i18n.** Angular Transloco EN/ES; portal English-only.
11. **Avatar wiring.** Angular passes `firstName` + `lastName` (split from `name`) to `<app-avatar-initials>`. Portal passes `name` to a generic `initials()` helper. Functionally equivalent for two-word names; diverges for single-word or 3+ word names.
12. **Medical Resource cell subtitle.** Angular: `address.city, address.state` if present, else `primaryContact`. Portal: identical logic via `provider.medicalResource.address?.city / .state || primaryContact`.
13. **Save error path.** Angular routes errors through `ErrorHandlerService.handleError`. Portal shows a toast with `body.message ?? "Save failed"` and otherwise "Network error — try again".
14. **`computeProviderSummary` ordering.** Angular sorts `bySpecialty` desc by `count`. Portal sorts identically (function copied — see `provider-summary.ts`).
15. **No `/providers/:id` GET endpoint.** Angular never calls a single-record endpoint — it pulls the whole list. Portal's `/providers/{id}` page calls `GET /providers/{id}` server-side, which may or may not exist on the API.

### New in Next.js, not in Angular

1. **Detail page** at `/providers/{id}` rendering an info card layout with separate "Contact" and "Medical resource" sections. Angular has no read-only detail view — clicking a row opens the edit dialog directly.
2. **`/providers/new` and `/providers/{id}/edit` routes** with the form inline (not in a dialog).
3. **Provider-summary helpers extracted to a portal-local file** (`src/app/(app)/providers/provider-summary.ts`) — Angular keeps these inside `admin-providers.service.ts`.
4. **Number coercion in form schema.** Portal uses `z.coerce.number().int().positive("…required")` on `medicalResourceId` and `providerParticipationTypeId` to translate Select string values to numbers. Angular form fields are typed as `number` directly via PrimeNG Dropdown `optionValue` binding.
5. **`GET /providers/{id}` server-side fetch** in the detail page (Angular only ever lists then opens dialog).
6. **API proxy via Next route handlers** (`/api/providers*`) — keeps bearer token server-side. Angular uses HttpClient + interceptor directly.
7. **Specialty filter optionLabel translation** is hard-coded in Angular (`'Specialty_unknown'` etc.). Portal hard-codes "Unknown" inline.
