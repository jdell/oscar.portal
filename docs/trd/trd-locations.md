# TRD — Locations (Class Locations)

> Technical Requirements Document for the Class Locations admin module.
>
> - **Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/locations/` (note: lives outside `admin/`)
> - **Angular API service:** `oscar.cloud/apps/oscar-app/src/app/data/repositories/class-locations.repository.ts`
> - **Next.js destination:** `oscar.portal/src/app/(app)/locations/`, `oscar.portal/src/app/api/locations/`
> - **Source of truth for fields:** `oscar.cloud/libs/models/src/lib/entities/class-location.model.ts`

---

## 1. Functional Requirements

### Data Model

#### `ClassLocation` (Angular `@oscar/models`)
```ts
interface ClassLocation extends Syncable, Erasable {
  id: string;
  agencyId: number;
  name: string;
  description: string;
  address: Address;
  isArchived: boolean;
}

interface Address {
  address1: string;
  address2: string;
  street?: string;   // alias used by the class-location form
  city: string;
  state: string;
  zipCode: string;
}
```
- `Syncable` + `Erasable` are inherited mixins from `syncable.interface.ts` (offline-sync + soft-delete bookkeeping).
- Active/inactive is expressed as **`isArchived: boolean`** in Angular (inverse of Next.js `isActive`).

#### `Location` (Next.js `src/lib/types.ts`)
| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` (string) | Matches Angular `id: string` |
| `organizationId` | `UUID?` | Not in Angular model (denormalized for portal) |
| `agencyId` | `UUID? \| null` | Matches Angular `agencyId` (Next.js uses string, Angular number) |
| `name` | `string` | Matches Angular |
| `description` | `string? \| null` | Matches Angular `description: string` (optional in Next) |
| `address1` | `string? \| null` | Flat field (Angular nests under `address`) |
| `address2` | `string? \| null` | Flat field |
| `city` | `string? \| null` | Flat field |
| `state` | `string? \| null` | Flat field |
| `postalCode` | `string? \| null` | Renamed from Angular `zipCode` |
| `isActive` | `boolean` | **Inverse of Angular `isArchived`** |

### Business Logic & Validation

#### Angular `class-location.component.ts` (`buildForm`)
```ts
this.fb.group({
  id: [item.id],
  agencyId: [item.agencyId],
  name: [item.name, Validators.required],
  address: this.buildAddressForm(item.address || {}),
  description: [item.description],
  isActive: [!item.isArchived],
});

// address sub-form
this.fb.group({
  street:  [address.street,  [Validators.required]],
  city:    [address.city,    [Validators.required]],
  state:   [address.state,   [Validators.required]],
  zipCode: [address.zipCode, [Validators.required, Validators.minLength(5)]],
});
```
- On save: `location.isArchived = !this.form.value.isActive; location.agencyId = this.coreFacade.currentAgencyId;`
- Save guarded by `if (!this.form.valid) { markFormTouched(form); return; }`.

#### Next.js `location-form.tsx` (Zod schema)
```ts
z.object({
  name:        z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address1:    z.string().min(1, "Street is required"),
  address2:    z.string().optional(),
  city:        z.string().min(1, "City is required"),
  state:       z.string().min(1, "State is required"),
  postalCode:  z.string().min(5, "ZIP must be at least 5 characters").max(10, "ZIP is too long"),
  isActive:    z.boolean(),
})
```
- `address1` is the Next.js field that maps to Angular's `address.street`.
- ZIP has both a minimum (matches Angular's `minLength(5)`) and a Next-specific maximum of 10.
- Form sends the full Zod-validated object to the backend as a flat payload (no `address` nesting).

### API Intersections

#### Angular (`class-locations.repository.ts` → `ApiService` base class, `endpoint = 'class-locations'`)
| Method | Endpoint | Body | Response | Trigger |
|---|---|---|---|---|
| GET | `/class-locations` | — | `ClassLocation[]` | List page load (also via offline `DbService` cache) |
| POST | `/class-locations` | `ClassLocation` (no id) | `ClassLocation` | `classLocationsFacade.save(location)` when `!id` |
| PUT | `/class-locations/{id}` | `ClassLocation` | `ClassLocation` | `classLocationsFacade.save(location)` when `id` set |
| DELETE | `/class-locations/{id}` | — | `void` | Not used by the admin form (Angular relies on `isArchived` for soft delete) |

Angular also has an offline IndexedDB `ClassLocationsDbService` that mirrors the API service. Updates are persisted to both. The `class-locations-resolver.service.ts` pre-fetches data before navigation.

The `class-locations.component.ts` also branches on `params.status === 'unsynced'` to call `classLocationsFacade.queryUnsynced()` for an "unsynced records" view.

#### Next.js (`/api/locations/*` → backend)
| Method | Route Handler | Backend Call | Body |
|---|---|---|---|
| GET | _Direct `api.get` in `page.tsx` / `[id]/page.tsx` / `[id]/edit/page.tsx`_ | `GET /class-locations` and `GET /class-locations/{id}` | — |
| POST | `POST /api/locations` | `POST /class-locations` | Zod-validated flat object |
| PUT | `PUT /api/locations/{id}` | `PUT /class-locations/{id}` | Zod-validated flat object |
| DELETE | `DELETE /api/locations/{id}` | `DELETE /class-locations/{id}` | — |

Next.js list loader accepts both `Location[]` and `{ items: Location[] }` envelopes.

### User Actions

#### Angular `class-locations.component.html`
- 3 metrics via `<app-async-metric>`:
  - **Locations_total** (`pi pi-map-marker`, light `#42A5F5` / dark `#1E88E5`), routes to `/locations`.
  - **Locations_active** (`pi pi-check-circle`, light `#66BB6A` / dark `#388E3C`), counts `!isArchived`.
  - **Locations_byCity** (`pi pi-building`, light `#BA68C8` / dark `#8E24AA`), counts distinct `address.city` (case-trimmed).
- Global search via PrimeNG `filterGlobal`.
- Status filter dropdown: `[All_statuses, active, inactive]` (null/'active'/'inactive').
- City filter dropdown: `[All_cities, ...sorted distinct cities]`.
- `clearFilters()` resets both filters to null.
- `agencyName(agencyId)` resolves the agency label from `CoreFacade.agencies`.
- Add new button opens `ClassLocationComponent` dialog (`width: '40%'`, header from i18n `Location`).
- `sync()` button calls `classLocationsFacade.sync()` → re-loads list; returns a `Date` to update the sync timestamp.
- Empty `params.status === 'unsynced'` route variant loads unsynced records only.

#### Angular `class-location.component.html` (dialog)
- Name input (required).
- Description input (free text).
- Address sub-group: Street, City, State (PrimeNG dropdown of US states from `StatesService.query()`), ZIP code.
- `isActive` switch (inverse of `isArchived`).
- Cancel + Save buttons.
- Save success toast: `Confirmation_Update_ClassLocation` (edit) or `Confirmation_Create_ClassLocation` (create).
- Errors caught via `ErrorHandlerService.handleError(error)`.

#### Next.js `locations-table.tsx`
- 3 KPI cards (TanStack DataTable wrapping):
  - **Total** (lucide `MapPin`, sky accent).
  - **Active** (lucide `CheckCircle2`, emerald accent).
  - **Cities** (lucide `Building2`, violet accent) — counts distinct `city` (trimmed).
- Search by `name` only.
- Status filter: `All statuses / Active / Inactive`.
- City filter: `All cities / ...sorted distinct cities` built from data.
- `Clear filters` button appears when either filter is non-default.
- Rows are clickable (`rowHref={(l) => /locations/${l.id}`).
- Empty state copy switches based on whether filters are active.

#### Next.js `location-form.tsx` (full page form, not a dialog)
- Name input (required).
- Description textarea (2 rows).
- Street, Address line 2, City, State, ZIP inputs.
- `isActive` `<Switch>`.
- Cancel (goes back via `router.back()`) and Save buttons.
- Save POSTs/PUTs to `/api/locations[/id]` then `router.push(/locations/${id})`.
- Toasts: `"Location created"` / `"Location updated"` / `"Save failed"` / `"Network error — try again"`.

#### Next.js `[id]/page.tsx` (detail)
- Back-to-list button.
- Full address rendered as `address1`, `address2`, then `"city, state postalCode"` joined with newlines inside a `<pre>` block.
- Status badge (`Active`/`Inactive`).
- Edit button → `/locations/{id}/edit`.
- Linked agency row (if `agencyId`) clickable to `/agencies/{agencyId}`.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- Component-level state in `ClassLocationsComponent`: `locations`, `filteredLocations`, `metrics$`, `statusFilter`, `cityFilter`, `agencyId`, `status`, `cityOptions`, `statusOptions`.
- `ChangeDetectionStrategy.OnPush`; route param subscription via `activatedRoute.params.pipe(untilDestroyed(this), tap(...))`.
- Offline-first: `ClassLocationsDbService` caches in IndexedDB; `ClassLocationsFacade` arbitrates between API + cache, supports `queryUnsynced()` and `sync()`.
- `CoreFacade.currentAgencyId` injects the current agency context into every save.

#### Next.js
- Server component (`page.tsx`) fetches with `api.get("/class-locations")` per render.
- Client component `LocationsTable` holds filter state with `useState`; KPI/filtered/cities computed via `useMemo`.
- Form state via `react-hook-form` + `zodResolver`.
- No offline cache; no `agencyId` injection (the backend handles per-org scoping via the bearer token).

### Permissions
- **Angular:** Route group within the staff-facing app. Logged-in staff with the appropriate agency context.
- **Next.js:** `/(app)/locations` is wrapped by `requireSession()` in `app/(app)/layout.tsx`. Super-admin only (the portal app gates the entire `(app)` group). No per-permission gating inside the page.

### Error Handling

#### Angular
- `ErrorHandlerService.handleError(error)` in the form's `catch`.
- Form invalid → `markFormTouched(form)` so PrimeNG `app-form-wrapper` shows field errors.
- `address.zipCode` shows a minLength error when < 5 chars.

#### Next.js
- `api.ts` throws `ApiError(status, body)`.
- Server loaders catch `ApiError` (404 returns `null` → `notFound()`; others log and return `[]`).
- Route handlers wrap calls in try/catch and pass through the backend status with `{ message, body? }`.
- Form: per-field Zod messages render under each input.
- Mutation failures show `sonner` toasts with `body.message ?? "Save failed"`.

---

## 3. Migration Checklist

Definition of Done:

- [x] `Location` interface in `src/lib/types.ts` covers id, agencyId, name, description, address (flat), isActive.
- [x] List page (`/locations`) renders all locations from `GET /class-locations`.
- [x] 3 KPI cards: Total, Active, Cities.
- [x] Status filter (`All / Active / Inactive`).
- [x] City filter built dynamically from data.
- [x] Clear filters button.
- [x] Detail page (`/locations/{id}`) shows formatted address + agency link.
- [x] Create form (`/locations/new`).
- [x] Edit form (`/locations/{id}/edit`).
- [x] Required validation matches Angular: name, street, city, state, ZIP (min 5).
- [x] `POST /api/locations` → `POST /class-locations`.
- [x] `PUT /api/locations/{id}` → `PUT /class-locations/{id}`.
- [x] `DELETE /api/locations/{id}` → `DELETE /class-locations/{id}`.
- [x] Build passes `next build` type-check.

---

## 4. Gap Analysis

### In Angular but missing in Next.js
- **Offline / sync support**: Angular has `ClassLocationsDbService` (IndexedDB), `ClassLocationsFacade.sync()`, and an `/locations/unsynced` route. Next.js has no offline cache and no unsynced view.
- **Sync button** (`<app-sync>`) and the `sync()` action that returns a `Date`. Not ported.
- **Resolver pre-fetch**: Angular uses `class-locations-resolver.service.ts` to load before route activation. Next.js loads in-page.
- **Nested `address` object** in the payload: Angular sends `address: { street, city, state, zipCode }`. Next.js sends flat `address1, address2, city, state, postalCode`. **Field renames**: `street` → `address1`, `zipCode` → `postalCode`.
- **`isArchived` (Angular) vs `isActive` (Next.js)**: inverse boolean semantics. Backend likely accepts `isActive` per the portal contract but the Angular model declares `isArchived`. The mapping is implicit.
- **State dropdown with `StatesService.query()`**: Angular renders a PrimeNG dropdown of US states. Next.js uses a plain text input.
- **Agency-aware save**: Angular injects `coreFacade.currentAgencyId` into every save. Next.js does not (relies on the bearer-token org scoping).
- **i18n / Transloco** everywhere (e.g. `Locations_total`, `Cities`, `All_statuses`, `Confirmation_Update_ClassLocation`). Next.js uses hard-coded English.
- **`agencyName(agencyId)` column** in the list resolved from `CoreFacade.agencies`. Next.js doesn't render an agency column.
- **Description as a single-line `<input>`** in Angular's form. Next.js uses a 2-row `<textarea>` (intentional UX upgrade).
- **`<app-async-metric>` cards with light/dark gradient hex colors**. Next.js uses static Tailwind ring/bg accent classes.

### New in Next.js (not in Angular)
- **Dedicated `/locations/new` and `/locations/{id}/edit` route pages**. Angular uses a modal dialog (`ClassLocationComponent`) opened over the list.
- **`/locations/{id}` detail page** with formatted address card + agency link. Angular has no standalone detail view (edit-in-dialog only).
- **ZIP max length validation** (`max(10, "ZIP is too long")`). Angular only validates min length.
- **`Address line 2` field** as a distinct input. Angular `Address` has `address2: string` but the form does not render it.
- **List envelope flexibility**: accept `Location[]` or `{ items: Location[] }`.
- **`router.refresh()`** after mutations for cache invalidation. Angular re-fetches imperatively.
- **`postalCode` field name** (Next) instead of `zipCode` (Angular).
- **`description` as optional**. Angular declares it `string` (non-optional).
- **Per-row click navigation** to detail page. Angular row click opens the dialog directly.
