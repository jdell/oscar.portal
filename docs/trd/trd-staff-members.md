# TRD — Staff Members

**Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/staff-members/`
**Next.js destination:** `oscar.portal/src/app/(app)/staff/`

---

## 1. Functional Requirements

### Data Model

**`StaffMember`** (`libs/models/src/lib/entities/staff-member.model.ts`)

| Field             | Type            | Default            | Notes                                 |
| ----------------- | --------------- | ------------------ | ------------------------------------- |
| `id`              | `number`        | —                  | Server-assigned                       |
| `name`            | `string`        | —                  | Required                              |
| `emailAddress`    | `string`        | —                  | Required, email format                |
| `active`          | `boolean`       | `true` (for new)   | InputSwitch                           |
| `address`         | `Address`       | empty `{}`         | Sub-form                              |
| `phoneNumbers`    | `PhoneNumber[]` | `[]`               | FormArray                             |
| `supervisorId`    | `number`        | —                  | Dropdown of other StaffMembers        |
| `medicalLiasonId` | `number`        | —                  | Dropdown of other StaffMembers (sic)  |
| `agencies`        | `AgencyRole[]`  | `[]`               | FormArray of `{agencyId, roleId}`     |
| `isSurveyEnabled` | `boolean`       | —                  | InputSwitch (form) and inline (list)  |

**`Address`** — `address1`, `address2`, `street?`, `city`, `state`, `zipCode`.
**`PhoneNumber`** — `number: string`, `type: number` (FK to `PhoneNumberType.id`).
**`PhoneNumberType`** — `{ id: number, name: string }` (loaded from API).
**`AgencyRole`** — `{ agencyId: number, roleId: number }`.
**`Role`** — `{ id: number, name: string }`.
**`User`** — `{ id: number, staffMemberId: number, username: string, isAdmin: boolean }`.

**`EnhancedStaffMember`** (in-app aggregate, `apps/oscar-app/src/app/data/models/enhanced.model.ts`):
- Extends `StaffMember` with `user?: User` (joined client-side from `GET /users`).

### Business Logic & Validation

**Staff form** (`admin-staff-member.component.ts`, `buildForm`):

| Field                          | Validators                                |
| ------------------------------ | ----------------------------------------- |
| `name`                         | `Validators.required`                     |
| `address.address1`             | `Validators.required`                     |
| `address.address2`             | none                                      |
| `address.city`                 | `Validators.required`                     |
| `address.state`                | `Validators.required`; default = `configService.config.defaults.state` |
| `address.zipCode`              | `Validators.required`, `minLength(5)`     |
| `emailAddress`                 | `Validators.required`, `Validators.email` |
| `phoneNumbers[i].number`       | `Validators.required`, `phoneValidator()` |
| `phoneNumbers[i].type`         | `Validators.required`                     |
| `agencies[i].agencyId`         | `Validators.required`                     |
| `agencies[i].roleId`           | `Validators.required`                     |
| `active`, `isSurveyEnabled`    | InputSwitch (boolean), no validators      |
| `supervisorId`, `medicalLiasonId` | no validators                          |

**On submit (`save()`):**
- If `form.invalid` → `markFormTouched(form)`, abort.
- Filter `value.phoneNumbers` to only those with `phone.number?.trim()` AND `isValidPhoneType(type)` where `validTypes = [0,1,2,3,4,5]`.
- If `value.id` → `PUT /staff-members/{id}`; else → `POST /staff-members`.
- On HTTP 409 → toast `'A staff member with this email already exists.'` (severity error).
- On other error → `errorHandlerService.handleError(error)`.
- On success → navigate to `/admin/staff-members`.

**Credentials dialog form** (`admin-user.component.ts`, `buildForm`):

| Field            | Validators                                 |
| ---------------- | ------------------------------------------ |
| `staffMemberId`  | `Validators.required` (hidden, pre-filled) |
| `username`       | `Validators.required`; disabled when `item.id` exists |
| `isAdmin`        | none (binary checkbox)                     |

- `form.getRawValue()` used on save (to include disabled username).
- New user (`!formValue.id`) → `POST /users`; else → `PUT /users/{id}`.
- Delete (`confirmRemove`) → `p-confirmDialog`, accept → `DELETE /users/{id}`; emits `{action:'deleted', user}`.

### API Intersections

| Method | Path                                  | Request Body                                      | Response          | Caller / Trigger                    |
| ------ | ------------------------------------- | ------------------------------------------------- | ----------------- | ----------------------------------- |
| GET    | `/staff-members`                      | —                                                 | `StaffMember[]`   | List page load (parallel with `/users`) |
| GET    | `/users`                              | —                                                 | `User[]`          | List page load — joined to staff by `staffMemberId` |
| GET    | `/staff-members/{id}`                 | —                                                 | `StaffMember`     | Resolver for edit route             |
| POST   | `/staff-members`                      | `StaffMember`                                     | `StaffMember`     | Form save (new)                     |
| PUT    | `/staff-members/{id}`                 | `StaffMember`                                     | `void`            | Form save (edit) + inline survey toggle |
| POST   | `/staff-members/{id}/force-sync`      | `{}`                                              | `void`            | Force Full Sync button (edit only)  |
| GET    | `/users/{id}`                         | —                                                 | `User`            | (Available, unused in current flows)|
| POST   | `/users`                              | `User`                                            | `User`            | Credentials dialog save (new)       |
| PUT    | `/users/{id}`                         | `User`                                            | `void`            | Credentials dialog save (edit)      |
| DELETE | `/users/{id}`                         | —                                                 | `void`            | Credentials dialog delete (confirm) |
| GET    | `/roles`                              | —                                                 | `Role[]`          | Form load (agency role picker)      |

API base URL injected from `ConfigService.config.apiUrl`.

### User Actions

**List page** (`admin-staff-members.component.html`):

| Element                                       | Action                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Search input                                  | `filterGlobal(value, 'contains')` over `['name','active']` |
| "Add new" button (`[routerLink]="['new']"`)   | → `/admin/staff-members/new`                          |
| Row click (`[routerLink]="[…,id,'edition']"`) | → `/admin/staff-members/{id}/edition`                 |
| Avatar (initials)                             | Decorative                                            |
| Credentials cell: `{username}` link button    | Opens `AdminUserComponent` dialog (existing user)     |
| Credentials cell: "Add" button (hidden until row hover) | Opens `AdminUserComponent` dialog (new user)|
| Survey `p-inputSwitch` (`[(ngModel)]`)        | On change → `onToggleSurvey(item)` → `PUT /staff-members/{id}` with current item; on success toast `Survey_status_updated`; on failure toast `Survey_status_update_failed` AND reverts `item.isSurveyEnabled = !item.isSurveyEnabled` |
| Empty state                                   | Icon `pi pi-id-card`, title `EmptyState_noStaff_title`, body `EmptyState_noStaff_body`, "Add Staff" button → `/new` |
| Pagination                                    | rows = 10, `rowsPerPageOptions=[10, 25, 50]`, `currentPageReportTemplate=PaginationTemplate` |

**Form page** (`admin-staff-member.component.html`):

| Element                              | Action                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Basic info: Name, Active switch, Survey switch | Form fields                                  |
| Address: Address1, Address2, City, State (Dropdown), ZipCode | Form fields                          |
| Contact: Email, "+ phoneNumber" button (`addPhoneNumber`)    | Adds an empty row to `phoneNumbers` FormArray |
| Per phone row: number input, type Dropdown, trash button     | `removePhoneNumber(i)`                |
| Organization: Supervisor Dropdown, Medical Liaison Dropdown  | Form fields (optionLabel=name, optionValue=id) |
| Agencies: per-row Agency Dropdown + Role Dropdown + trash    | `removeAgencyRole(i)`                 |
| "Add Agency" button                  | `addAgencyRole()` → pushes `{agencyId:null, roleId:null}` with `Validators.required` |
| "Back" button (`pi pi-arrow-left`)   | `cancel()` → `router.navigate(['/admin/staff-members'])` |
| "Force Full Sync" button (`pi pi-refresh`, warning, only when `item?.id`) | `forceSync()` → POST; loading=`isForceSyncing$`; toast `Force_Sync_Queued` / `Force_Sync_Failed` |
| "Save" button (`pi pi-save`)         | `save()`; loading=`isBusy$`; toasts `Confirmation_Update_Staff_Member` / `Confirmation_Create_Staff_Member` |

**Credentials dialog** (`admin-user.component.html`):

| Element                              | Action                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Username input                       | Disabled when `item.id` present                       |
| Administrator checkbox (`[binary]`)  | Binds `isAdmin`                                       |
| "Delete" button (only when `item.id`) | `confirmRemove($event)` → `p-confirmDialog` → `DELETE /users/{id}` → close with `{action:'deleted', user}`; toast `User_deleted` (from list component) |
| "Cancel" button                      | `dynamicDialogRef.close()`                            |
| "Save" button                        | `save()` → POST/PUT → close with `{action:'saved', user}`; toast `User_saved` (from list component) |

---

## 2. Non-Functional Requirements

### State Management

- **Component-level only.** No NGXS state slice for staff. Each component uses local fields + `BehaviorSubject` for busy flags:
  - `isBusy$: Subject<boolean>` (save in progress)
  - `isForceSyncing$: Subject<boolean>` (force sync in progress)
- **Dropdown data** loaded as `Promise<T>` on `ngOnInit` and rendered with `| async`:
  - `states$`, `phoneTypes$`, `staffMembers$`, `agencies$`, `roles$`.
- **Resolver** (`adminStaffMembersResolver`) fetches `StaffMember` for edit route; on failure navigates to `/admin/staff-members`.
- **Dialog** opened via `DialogService.open(AdminUserComponent, { header, width:'40%', data: user })`; result handled by `ref.onClose.pipe(untilDestroyed(this)).subscribe(…)`.
- **Change detection:** `ChangeDetectionStrategy.OnPush` on both components; `cdr.markForCheck()` is not used (form-driven).
- **Translations** via Transloco (`*transloco="let t"` and `| transloco` pipe).

### Permissions

- The Angular admin module (`admin.module.ts`) is loaded behind whatever guard the application configures for `/admin`. The staff-members feature itself defines **no** route-level guards in `admin-staff-members-routing.module.ts` — gating is inherited from the parent.
- The User model's `isAdmin` flag controls credentials within the system; the staff-members feature does not enforce role checks on its own buttons.

### Error Handling

- All HTTP failures (except the explicit 409 on save) flow through `ErrorHandlerService.handleError(error)` which presents toasts.
- HTTP **409** on `POST/PUT /staff-members` → toast severity=error, summary=`Error`, detail=`A staff member with this email already exists.`
- Survey toggle failure → toast `Survey_status_update_failed` AND optimistic flag is reverted on the local item.
- Edit-route resolver: any error → `router.navigate(['/admin/staff-members'])`, returns `null`.
- No offline / retry logic.
- No global empty-state for connectivity failures — list simply renders empty.

---

## 3. Migration Checklist (Definition of Done)

| #   | Item                                                                                       | Angular | Next.js (`oscar.portal`) |
| --- | ------------------------------------------------------------------------------------------ | :-----: | :----------------------: |
| 1   | List page at `/staff` with global search                                                   | ✅      | ✅                       |
| 2   | List columns: avatar (initials), name, phone numbers, email, status tag, credentials, survey toggle | ✅      | ✅                       |
| 3   | Status filter (active / inactive / all)                                                    | ❌ (search-on-name+active only) | ✅ (additional) |
| 4   | Pagination 10/25/50                                                                        | ✅      | ✅ (via DataTable defaults) |
| 5   | Empty state with "Add staff" CTA                                                           | ✅      | ⚠️ Generic "No staff members found." (no icon/CTA) |
| 6   | Row click → edit                                                                           | ✅ (`/:id/edition`) | ⚠️ goes to `/staff/{id}` detail; edit is one more click |
| 7   | Survey inline toggle with optimistic revert on failure                                     | ✅      | ✅                       |
| 8   | Credentials column: opens user dialog (Add when none / username link when present)         | ✅      | ✅                       |
| 9   | Create form route `/new`                                                                    | ✅      | ✅                       |
| 10  | Edit form route `/:id/edition`                                                             | ✅      | ⚠️ uses `/staff/{id}/edit` |
| 11  | Form fields: name, emailAddress, active, isSurveyEnabled                                   | ✅      | ✅                       |
| 12  | Form sub-form: address (address1, address2, city, state, zipCode)                          | ✅      | ⚠️ Uses `street`/`city`/`state`/`zipCode`; missing `address1`/`address2` distinction |
| 13  | State Dropdown sourced from `StatesService.query()` with tenant default                    | ✅      | ❌ Free-text Input (no dropdown, no tenant default) |
| 14  | ZipCode `minLength(5)` validator                                                           | ✅      | ❌ No validator           |
| 15  | Required validators on address1, city, state, zipCode                                      | ✅      | ❌ All address fields optional in Zod schema |
| 16  | Phone numbers FormArray with required `phoneValidator()` and `type` from `PhoneNumberTypeService` | ✅ | ⚠️ FormArray present; type uses hard-coded string enum (mobile/home/work/fax/other) instead of API-loaded IDs; no phone format validator |
| 17  | Submission filters phones via `isValidPhoneType([0..5])`                                   | ✅      | ⚠️ Filters by truthy `number` only; type filter not applicable to string enum |
| 18  | Supervisor + Medical Liaison Dropdowns sourced from `/staff-members`                       | ✅      | ✅                       |
| 19  | Agencies FormArray (agencyId + roleId required); add / remove rows                         | ✅      | ✅                       |
| 20  | Force Full Sync button on edit (orange-warning style, loading state)                       | ✅      | ✅ (no warning colour)   |
| 21  | Save button → PUT/POST; success toast + redirect to list                                   | ✅      | ⚠️ Redirects to `/staff/{id}` detail, not list |
| 22  | 409 → "staff with this email already exists" toast                                          | ✅      | ❌ Generic body.message fallback |
| 23  | Credentials dialog: username required, isAdmin checkbox                                    | ✅      | ✅                       |
| 24  | Credentials dialog: username disabled in edit mode                                          | ✅      | ✅                       |
| 25  | Credentials dialog: Delete (with confirm) → DELETE /users/{id}                              | ✅      | ✅ (confirm via native `confirm()`) |
| 26  | Translations EN / ES via Transloco                                                          | ✅      | ❌ Hard-coded English     |
| 27  | API endpoints `/staff-members`, `/staff-members/{id}`, `/staff-members/{id}/force-sync`, `/users`, `/users/{id}`, `/roles` | ✅ | ✅ (via Next route handlers `/api/staff*`, `/api/users*`) |

---

## 4. Gap Analysis

### Present in Angular, missing or differing in Next.js

1. **Address field shape.** Angular uses `address1` + `address2` (Address model has both, plus optional `street`). Portal Zod schema uses a single `street` field; no `address2`.
2. **State dropdown.** Angular pulls valid US states from `StatesService.query()` and defaults to `configService.config.defaults.state` (tenant-aware). Portal uses a free-text input.
3. **ZipCode minLength(5).** Required in Angular. Not enforced in portal.
4. **Required address fields.** Angular: `address1`, `city`, `state`, `zipCode` are required. Portal: all address subfields optional.
5. **Phone type catalog.** Angular reads `PhoneNumberType[]` from API and binds via `optionValue="id"`. Portal hard-codes a string enum `mobile/home/work/fax/other` and never calls a phone-type endpoint.
6. **Phone number validator.** Angular uses `phoneValidator()` regex (`@oscar/common/validators`). Portal uses no format validator.
7. **Phone validity filter on submit.** Angular drops rows where `!isValidPhoneType(type)`. Portal drops only rows where `!number?.trim()`.
8. **409 email-conflict toast.** Angular shows a specific "A staff member with this email already exists." message. Portal falls back to `body.message ?? "Save failed"`.
9. **Save success navigation.** Angular returns to list (`/admin/staff-members`). Portal navigates to detail (`/staff/{id}`).
10. **Edit-route URL.** Angular: `/:id/edition`. Portal: `/{id}/edit`.
11. **Row-click target.** Angular row click → edit. Portal row click → detail.
12. **Empty state.** Angular has icon + title + body + "Add Staff" CTA. Portal: plain text.
13. **Force-sync button styling.** Angular uses `p-button-outlined p-button-warning` (orange). Portal uses default outline (no warning colour).
14. **i18n.** Angular ships EN + ES via Transloco. Portal is English-only.
15. **Pagination current-page report template** (`"Showing X to Y of N"`) — Angular shows it; portal `DataTable` shows simple "Page X of Y" with prev/next icons.
16. **Resolver pattern.** Angular pre-fetches the staff record via route resolver; portal fetches in the server component (functionally equivalent, but the URL is hit only after navigation in Next.js).

### New in Next.js, not in Angular

1. **Detail page** (`/staff/{id}`) — Angular routes `/:id/edition` directly to the form. Portal has a read-only detail page with profile/affiliation/permissions cards before an Edit button.
2. **Status filter** (all / active / inactive) on the list.
3. **Auth session cookie + Next route handlers.** Portal proxies the API through `/api/staff*` and `/api/users*` to keep the bearer token server-side. Angular relies on the Angular HTTP interceptor that attaches credentials directly.
4. **Optimistic UI for survey toggle** uses a separate `optimistic: Record<string, boolean>` map keyed by id; Angular mutates the array item directly.
5. **Permissions tab on detail page** — surfaces `staff.permissionsDetail`, which the Angular flow does not expose.
6. **`firstName` / `lastName` legacy fields** on the StaffMember type for backward-compat with earlier portal scaffold (not used in current form, kept on the type).
