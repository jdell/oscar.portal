# TRD — Permissions

> Technical Requirements Document for the Permissions admin module.
>
> ⚠️ **Conceptual mismatch warning:** The Angular admin app does NOT have a standalone Permissions admin page. The Next.js `/permissions` route is a portal-level invention. This TRD documents both sides honestly.
>
> - **Angular sources:**
>   - `oscar.cloud/apps/oscar-app/src/app/features/admin/agencies/permissions/` — a reusable `ControlValueAccessor` component that wraps a PrimeNG listbox of permissions for selection inside *other* forms.
>   - `oscar.cloud/apps/oscar-app/src/app/features/admin/staff-members/services/admin-roles.service.ts` — list-only `/roles` API service.
> - **Next.js destination:** `oscar.portal/src/app/(app)/permissions/`, `oscar.portal/src/app/api/roles/`

---

## 1. Functional Requirements

### Data Model

#### `Role` (Angular `@oscar/models/role.model.ts`)
```ts
interface Role {
  id: number;
  name: string;
}
```
- That's it. No `description`, no embedded `permissions[]`.

#### `Permission` (Angular `features/admin/agencies/permissions/permission.model.ts`)
```ts
interface Permission {
  id: number;
  code: string;
  description: string;
}
```
- Note the field name is **`code`** in Angular.

#### `Role` (Next.js `src/lib/types.ts`)
```ts
interface Role {
  id: UUID;            // string, NOT number
  name: string;
  description?: string | null;   // new in Next
  permissions: string[];         // new in Next: list of permission keys
}
```

#### `Permission` (Next.js `src/lib/types.ts`)
```ts
interface Permission {
  id: UUID;            // string, NOT number
  key: string;         // renamed from Angular `code`
  description: string;
  category: string;    // new in Next
}
```

### Business Logic & Validation

#### Angular
- **There is no validation layer for permissions on the admin side**, because there is no admin form for roles or permissions in Angular.
- The `PermissionsComponent` (`features/admin/agencies/permissions/permissions/permissions.component.ts`) is a `ControlValueAccessor` that exposes a PrimeNG `<p-listbox>` with `[multiple]="true" [checkbox]="true"`. It is consumed inside agency- or staff-form parent components.
- `writeValue(val)` accepts `number[] | null` and copies the array; `onChange(selectedPermissions ?? [])` reports the selection back to the form.
- `setDisabledState(isDisabled)` toggles the listbox's `[disabled]` binding.

#### Next.js `permissions/roles-editor.tsx`
- No Zod schema; the editor maintains a `Map<roleId, Set<permissionKey>>` (`draftByRole`) initialized from each role's `permissions: string[]`.
- "Dirty" detection compares `selected.size` and per-element membership against `originalSet`.
- `reset()` rebuilds the role's draft set from the original `active.permissions`.
- `save()` sends the role with its updated `permissions: string[]` to the backend; no client-side schema validation.
- Filter input matches against `p.key`, `p.description`, and `p.category` (case-insensitive `includes`).
- Permissions are grouped by `p.category`, sorted alphabetically, with category falling back to `"Other"` when empty.

### API Intersections

#### Angular
| Method | Endpoint | Where | Notes |
|---|---|---|---|
| GET | `/roles` | `AdminRolesService.query()` in `staff-members/services/admin-roles.service.ts` | List-only, returns `Role[]` with `{ id, name }` |
| GET | `/permissions` | `PermissionsService.query()` in `admin/agencies/permissions/permissions.service.ts` | Returns `Permission[]` with `{ id, code, description }` |
| `getByIds(ids)` | _client-side filter over `/permissions`_ | `PermissionsService` helper | Used by agency/staff forms to render currently-selected permissions |
| **PUT /roles/{id}** | **Not present in the Angular admin app** | — | Angular does not expose role mutation |
| **POST/DELETE /roles** | **Not present** | — | — |

#### Next.js (`/api/roles/*` → backend)
| Method | Route Handler | Backend Call | Body | Response |
|---|---|---|---|---|
| GET | _Direct `api.get` in `permissions/page.tsx`_ | `GET /roles` | — | `Role[]` or `{ items: Role[] }` |
| GET | _Direct `api.get` in `permissions/page.tsx`_ | `GET /permissions` | — | `Permission[]` or `{ items: Permission[] }` |
| PUT | `PUT /api/roles/{id}` | `PUT /roles/{id}` | `{ ...active, permissions: [...selected] }` | `Role` |

Both the GET endpoints and the PUT endpoint live on the .NET API. The PUT contract is **defined by the Next.js portal**, not present in the Angular admin code.

### User Actions

#### Angular `PermissionsComponent`
- A standalone listbox component, not a full page.
- Rendered inside parent forms (agency edit, staff edit) via `<app-permissions formControlName="permissions" />`.
- User selects/unselects permissions in a multi-select listbox with checkboxes.
- `onSelectionChange()` reports `selectedPermissions` to the parent form's `FormControl`.
- `onBlur` event triggers `markTouched()`.
- No add/edit/delete of roles or permissions themselves.

#### Next.js `permissions/page.tsx` (server)
- Loads both `/roles` and `/permissions` in parallel.
- If `roles.length === 0`, renders an empty `<Card>` saying "No roles configured for this organization."
- Otherwise, renders `<RolesEditor roles={roles} permissions={permissions} />`.

#### Next.js `RolesEditor` (client)
- Two-column layout: roles list on the left (260px), permission editor on the right.
- **Roles list:**
  - Each entry shows the role name with a `Lock` icon, a permission-count `Badge`, and an amber dot if the role's draft has unsaved changes.
  - Clicking selects the role (`setActiveId(r.id)`).
- **Permission editor (right column):**
  - Header: active role name + optional description.
  - Reset and Save buttons (Save uses sky-600 styling, disabled when `!dirty || saving`).
  - Filter `<Input>` that matches against permission key/description/category.
  - Permissions grouped by category (sorted by name); each rendered as a `<label>` wrapping a checkbox.
  - Permission card highlights with sky border + tinted bg when checked.
  - Empty filter result: "No permissions match the filter."
  - No active role: "Pick a role on the left to edit its permissions."
- Save sends PUT `/api/roles/{active.id}` with `{ ...active, permissions: [...selected] }`. Success toast: `"Updated permissions for {role.name}"`. Failure toast: `body.message ?? "Save failed"`.
- `router.refresh()` re-runs the server component after a successful save.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- `PermissionsComponent` is a `ControlValueAccessor` (`NG_VALUE_ACCESSOR` multi-provider via `forwardRef`).
- Internal state: `selectedPermissions: number[]`, `disabled: boolean`, `permissions$: Promise<Permission[]>` (fetched once in `ngOnInit`).
- Reactive form integration: `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`.
- No global store, no caching beyond the per-component promise.

#### Next.js
- Server component (`page.tsx`) fetches roles + permissions in parallel via `Promise.all`.
- Client component `RolesEditor` holds:
  - `activeId: string` — currently selected role.
  - `draftByRole: Record<string, Set<string>>` — per-role draft selection; initialized from each role's `permissions` array on first render only.
  - `filter: string` — text filter.
  - `saving: boolean`.
- `active` derived via `roles.find(...)`.
- `selected`, `originalSet`, `dirty`, `grouped` computed via `useMemo`.
- `toggle(key)` mutates the active role's draft Set immutably (new Set per change).
- `reset()` resets the active role's draft to its original `permissions`.
- `router.refresh()` re-runs the server load after save.

### Permissions
- **Angular:** No standalone admin page → no route-level guard for "permissions admin". The `PermissionsComponent` listbox is gated implicitly by whichever parent form's route guard applies (e.g. agency-edit, staff-edit).
- **Next.js:** `/(app)/permissions` is wrapped by `requireSession()` in `app/(app)/layout.tsx`. Super-admin only. No per-permission gating inside the page (i.e. there is no `roles:write` permission check on the editor itself).

### Error Handling

#### Angular
- The reusable listbox component has no error handling — failures bubble up to the parent form.
- `PermissionsService.query()` does not catch; rejection propagates to the consuming `Promise`/await.

#### Next.js
- `api.ts` throws `ApiError(status, body)`.
- Server `loadRoles()` and `loadPermissions()` both catch `ApiError`, log to console, return `[]`.
- Empty roles → render the "No roles configured" empty Card instead of the editor.
- `save()` on a failed PUT shows a `sonner` toast (`body.message ?? "Save failed"`).
- The save button is disabled while the request is in flight (`!dirty || saving`).
- The `reset` button is similarly disabled when there is nothing to reset (`!dirty || saving`).

---

## 3. Migration Checklist

⚠️ The Next.js implementation is **not a direct migration** of an existing Angular page — it is a new portal feature.

For "parity with what the Angular admin app exposes," Definition of Done is:

- [x] `Role` and `Permission` interfaces declared in `src/lib/types.ts`.
- [x] `GET /roles` returns the role list to the portal page.
- [x] `GET /permissions` returns the permission catalog to the portal page.
- [x] The reusable listbox pattern (multi-select with checkboxes) is replicated by the per-role permission editor.

For the portal-only **extensions** beyond Angular's surface, Definition of Done is:

- [x] `/permissions` standalone page renders without a parent form.
- [x] Roles list with active-state highlight and unsaved-change indicator.
- [x] Per-role permission checkbox matrix with category grouping.
- [x] Filter input (matches key/description/category).
- [x] Save and Reset buttons gated by a dirty check.
- [x] `PUT /api/roles/{id}` route handler proxying to `PUT /roles/{id}`.
- [x] Sonner toasts on success/failure.
- [x] Build passes `next build` type-check.

---

## 4. Gap Analysis

### In Angular but missing in Next.js
- **Standalone reusable `<app-permissions>` listbox component**: Angular exposes `PermissionsComponent` as a `ControlValueAccessor` that any other reactive form can drop in via `<app-permissions formControlName="permissions" />`. Next.js has no equivalent embeddable component — the only permission UI is the dedicated `/permissions` page.
- **`getByIds(ids)` helper** on `PermissionsService` for resolving selected permission IDs back to objects. Not present in Next.js (no consumer needs it yet).
- **`PrimeNG p-listbox` features**: native `metaKeySelection`, `[disabled]` propagation from Angular form state, automatic blur handling.

### New in Next.js (not in Angular)
- **`/permissions` standalone admin page** — entirely a portal invention. The Angular admin app has no equivalent route.
- **`PUT /roles/{id}` endpoint contract** — defined by the Next.js portal (`/api/roles/[id]/route.ts`). The Angular `AdminRolesService` is read-only (`query()` only).
- **`Role.description: string` field** — not in Angular `Role` (which has only `id` and `name`).
- **`Role.permissions: string[]` field** — Angular `Role` does not embed permissions at all. The Next.js model carries the role↔permission mapping inside the role object itself.
- **`Permission.key`** field name — Angular uses **`Permission.code`**.
- **`Permission.category: string`** field — not in Angular's `Permission` (which has only `id`, `code`, `description`).
- **Permission grouping by `category`** in the editor.
- **Category-aware text filter** matching `key/description/category`.
- **Per-role "dirty" indicator** (amber dot) in the role list.
- **Reset button** to revert per-role draft changes.
- **`Role.id` as `UUID` (string)** in Next.js types vs `number` in Angular.
- **`Permission.id` as `UUID` (string)** in Next.js types vs `number` in Angular.
- **Sky-themed selected-card styling** for checked permissions (`border-sky-300 bg-sky-50/50`).
- **List envelope flexibility**: accept `Role[] / Permission[]` or `{ items: ... }`.
- **`router.refresh()`** after save instead of imperative re-fetch.

### Compatibility notes for backend implementation
If the backend was designed to match the **Angular** model, it returns:
- `Permission { id: number, code: string, description: string }` — not `{ key, category }`.
- `Role { id: number, name: string }` — no `permissions[]` array.

The Next.js portal cannot succeed against that contract as written. Either:
1. The backend must be extended to return the richer Next.js shape (adds `key`/`category`/`description`/`permissions[]`), or
2. The Next.js loader needs an adapter that maps `code → key`, supplies a default `category`, and resolves a role's permissions via a separate `GET /roles/{id}/permissions` (or similar) call.

This is a true blocker, not a cosmetic gap, and is documented here for visibility.
