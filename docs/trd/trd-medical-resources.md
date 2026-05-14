# TRD — Medical Resources

**Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/medical-resources/`
**Next.js destination:** `oscar.portal/src/app/(app)/resources/` (unified medical + healthy-living page)

---

## 1. Functional Requirements

### Data Model

**`MedicalResource`** (`libs/models/src/lib/entities/medical-resource.model.ts`)

| Field                  | Type            | Default (new)   | Notes                                |
| ---------------------- | --------------- | --------------- | ------------------------------------ |
| `id`                   | `number`        | —               | Server-assigned                      |
| `name`                 | `string`        | —               | Required                             |
| `primaryContact`       | `string`        | —               | Required                             |
| `active`               | `boolean`       | `true`          | InputSwitch                          |
| `hours`                | `string`        | —               | Required                             |
| `url`                  | `string`        | —               | Required                             |
| `acceptingNewClients`  | `boolean`       | `false`         | Checkbox                             |
| `indigentCare`         | `boolean`       | `false`         | Checkbox                             |
| `bilingualStaff`       | `boolean`       | `false`         | Checkbox                             |
| `publicTransportation` | `boolean`       | `false`         | Checkbox                             |
| `interviewCheck`       | `boolean`       | `false`         | Checkbox                             |
| `slidingFeeScale`      | `boolean`       | `false`         | Checkbox                             |
| `address`              | `Address`       | `{}`            | Sub-form                             |
| `emailAddress`         | `string`        | —               | Required                             |
| `services`             | `string`        | —               | Required (free text)                 |
| `notes`                | `string`        | —               | Optional                             |
| `phoneNumbers`         | `PhoneNumber[]` | `[]`            | FormArray                            |
| `insurers`             | `number[]`      | `[]`            | IDs only                             |
| `providers`            | `number[]`      | `[]`            | IDs only (managed elsewhere)         |
| `agencies`             | `number[]`      | `[]`            | IDs only                             |
| `resourceTypes`        | `number[]`      | `[]`            | IDs only — ListBox CVA               |
| `reasons`              | `number[]`      | `[]`            | IDs only (referral reasons)          |

**`MedicalResourceType`** — `{ id: number, name: string }`.
**`Address`** — `address1`, `address2`, `street?`, `city`, `state`, `zipCode`.
**`PhoneNumber`** — `{ number: string, type: number }`.

### Business Logic & Validation

**Form** (`admin-medical-resource.component.ts`, `buildForm`):

| Field                          | Validators                                |
| ------------------------------ | ----------------------------------------- |
| `name`                         | `Validators.required`                     |
| `primaryContact`               | `Validators.required`                     |
| `emailAddress`                 | `Validators.required` (note: no `.email`) |
| `services`                     | `Validators.required`                     |
| `hours`                        | `Validators.required`                     |
| `url`                          | `Validators.required`                     |
| `address.address1`             | `Validators.required`                     |
| `address.address2`             | none                                      |
| `address.city`                 | `Validators.required`                     |
| `address.state`                | `Validators.required`; default = `configService.config.defaults.state` |
| `address.zipCode`              | `Validators.required`                     |
| `phoneNumbers[i].number`       | `Validators.required`, `phoneValidator()` |
| `phoneNumbers[i].type`         | `Validators.required`                     |
| All ID-array fields            | none (free-form lists)                    |

**On submit (`save()`):**
- If `form.invalid` → `markFormTouched(form)`, abort.
- `getRawValue()` then `phoneNumbers.filter(p => p.number?.trim() && isValidPhoneType(p.type))` where `validTypes = [0,1,2,3,4,5]`.
- If `value.id` → `PUT /medical-resources/{id}` → toast `Confirmation_Update_Medical_Resource` → navigate to `/admin/medical-resources/{id}`.
- Else → `POST /medical-resources` → toast `Confirmation_Create_Medical_Resource` → navigate to `/admin/medical-resources`.
- On any error → `errorHandlerService.handleError(error)`.

**Cancel (`cancel()`):** if `item?.id` → back to detail; else → list.

### API Intersections

| Method | Path                            | Request Body       | Response               | Caller                              |
| ------ | ------------------------------- | ------------------ | ---------------------- | ----------------------------------- |
| GET    | `/medical-resources`            | —                  | `MedicalResource[]`    | List page, getByIds helper          |
| GET    | `/medical-resources/{id}`       | —                  | `MedicalResource`      | Resolver (detail + edit routes)     |
| POST   | `/medical-resources`            | `MedicalResource`  | `MedicalResource`      | Save (new)                          |
| PUT    | `/medical-resources/{id}`       | `MedicalResource`  | `void`                 | Save (edit)                         |
| GET    | `/medical-resource-types`       | —                  | `MedicalResourceType[]`| Form, list filters, type chips      |
| GET    | `/agencies`                     | —                  | `Agency[]`             | List filter, detail expansion       |
| GET    | `/insurers`                     | —                  | `Insurer[]`            | Detail expansion                    |
| GET    | `/referral-reasons`             | —                  | `ReferralReason[]`     | Detail expansion                    |
| GET    | `/providers`                    | —                  | `Provider[]`           | Detail (linked providers)           |

No delete endpoint — soft delete via `active = false`.

### User Actions

**List page** (`admin-medical-resources.component.html`):

| Element                                         | Action                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| 4 summary cards (Total, Active, Inactive, By type) | Counts computed from current `medicalResources`; "By type" lists `p-tag` per `MedicalResourceType` with count |
| Global search input                             | `filterGlobal(value, 'contains')` over `['name','primaryContact','emailAddress']` |
| Multi-select: Type filter                       | `selectedTypeIds` → `applyFilters()` → keeps rows where any `r.resourceTypes` intersects |
| Multi-select: Agency filter                     | `selectedAgencyIds` → `applyFilters()` → keeps rows where any `r.agencies` intersects |
| Clear filters button (visible when filters set) | `resetFilters()` empties both ID arrays + re-applies  |
| Add new button (`pi pi-plus`)                   | → `/admin/medical-resources/new`                      |
| Row click                                       | → `/admin/medical-resources/{id}` (detail)            |
| Columns                                         | Name, Type (chips with `getTypeSeverity` modulo cycle), Phone (`<app-phone-numbers-info>`), Primary contact, Email, Status tag |
| Empty state                                     | Icon `pi pi-briefcase` + adaptive copy + CTA:<br>• filtered → "No results" + Clear filters btn<br>• `totalCount === 0` → "No resources yet" + Add new btn<br>• generic → "No resources found" |
| Pagination                                      | rows = 10, `rowsPerPageOptions=[10,25,50]`            |

**Detail page** (`admin-medical-resource-detail.component.html`):

| Element                                         | Action                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| Header card: name, active/inactive tag, address line (with `pi pi-map-marker`), type chips | Decorative |
| Edit button (`pi pi-pencil`)                    | `routerLink=['/admin/medical-resources', id, 'edition']` |
| Section: Information                            | `<app-medical-resource-info>` (read-only render)      |
| Section: Map                                    | `<app-map [address]="…">` — Google-Maps-style embed; empty state when no address |
| Section: Resource Types (chips)                 | Resolved by `MedicalResourceTypesService.getByIds`     |
| Section: Insurances (list `pi pi-shield`)       | Resolved by `AdminInsurersService.getByIds`            |
| Section: Reasons for Referral (list)            | Resolved by `AdminReferralReasonsService.getByIds`     |
| Section: Agencies (list `pi pi-building`)       | Resolved by `AdminAgenciesService.getByIds`            |
| Section: Providers (3-col grid `pi pi-user-plus`)| Resolved by `AdminProvidersService.getByIds`           |
| Empty-section template                          | Icon + secondary copy per section                     |

**Form page** (`admin-medical-resource.component.html`):

| Element                                         | Action                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| Basic info card: Name, primary contact, email, active switch | Form fields                          |
| Description card: services textarea, notes, hours, url       | Form fields                          |
| Features card: 6 checkboxes (acceptingNewClients, indigentCare, slidingFeeScale, interviewCheck, publicTransportation, bilingualStaff) | binary checkboxes |
| Address card: address1, address2, city, state (Dropdown), zipCode | Form fields                          |
| Phones FormArray: add/remove rows               | `addPhoneNumber()`, `removePhoneNumber(i)`            |
| Selectors (CVA listboxes): Resource Types, Insurances, Agencies, Reasons | bind `number[]` ID arrays   |
| Back button                                     | `cancel()` → detail or list                           |
| Save button                                     | `save()`; loading=`isBusy$`; toasts on success/failure |

---

## 2. Non-Functional Requirements

### State Management

- **Component-level**. List uses plain class fields: `medicalResources`, `resourceTypes`, `agencies`, `filteredResources`, `selectedTypeIds`, `selectedAgencyIds`, `totalCount`, `activeCount`, `inactiveCount`, `typeSummaries`, `isLoading`.
- Form: `BehaviorSubject` `isBusy$` for save spinner; `states$`, `phoneTypes$` as Promises consumed with `| async`.
- Detail: each section is its own `Promise<T[]>` consumed with `| async`, populated from `*.getByIds(ids)` helpers.
- **Change detection:** `ChangeDetectionStrategy.OnPush` everywhere; `cdr.markForCheck()` after `ngOnInit` parallel fetch settles.
- **Resolver** (`adminMedicalResourcesResolver`) fetches `MedicalResource` for `:id` and `:id/edition`; on failure navigates to list.

### Permissions

- Inherits gating from `/admin` parent module. The medical-resources feature defines no route-level guards.
- Form does not branch on roles; any admin who can reach the route can mutate.

### Error Handling

- All HTTP failures except save flow through `ErrorHandlerService.handleError(error)`.
- Save (POST/PUT) failures hit the same `errorHandlerService.handleError`.
- Resolver failure (404 or other) → `router.navigate(['/admin/medical-resources'])`, returns `null`.
- `getByIds([])` short-circuits to `[]` — empty IDs never trigger an API call.
- No client-side retry, no offline support.

### Performance

- `getByIds` calls `query()` then filters in memory — every detail page triggers a full list fetch per selector (5 sections × 1 full list call). No client-side cache.

---

## 3. Migration Checklist (Definition of Done)

| #   | Item                                                                                       | Angular | Next.js (`oscar.portal/resources` unified) |
| --- | ------------------------------------------------------------------------------------------ | :-----: | :----------------------------------------: |
| 1   | Summary cards: Total, Active, Inactive, By Type chips                                      | ✅      | ⚠️ KPI cards present (Total, Active, Inactive, Medical/HL split); no per-type chips card |
| 2   | List columns: Name, Type chips, Phone, Primary Contact, Email, Status                      | ✅      | ⚠️ Columns: Name, Category, Types, Primary contact, Location, Status (no Phone column) |
| 3   | Global search over `name + primaryContact + emailAddress`                                  | ✅      | ⚠️ Searches `name` only via DataTable     |
| 4   | Multi-select Type filter                                                                   | ✅      | ✅                                         |
| 5   | Multi-select Agency filter                                                                 | ✅      | ✅                                         |
| 6   | Clear filters button                                                                       | ✅      | ✅                                         |
| 7   | Adaptive empty state (filtered / first-time / generic) with CTAs                            | ✅      | ❌ Single message                          |
| 8   | Pagination 10/25/50                                                                        | ✅      | ⚠️ DataTable prev/next, no rows-per-page picker |
| 9   | Row click → detail at `/{id}`                                                              | ✅      | ✅                                         |
| 10  | Detail header: name + status tag + address line + type chips + Edit button                 | ✅      | ✅                                         |
| 11  | Detail: Information card                                                                   | ✅      | ✅ (contact card + location card + description card) |
| 12  | Detail: Map embed                                                                          | ✅ (`<app-map>` component) | ❌ "Open in Maps" external link only |
| 13  | Detail: Resource Types tab/section (chips)                                                 | ✅      | ✅ (Tab)                                   |
| 14  | Detail: Insurances section                                                                 | ✅      | ✅ (Tab)                                   |
| 15  | Detail: Referral Reasons section                                                           | ✅      | ✅ (Tab)                                   |
| 16  | Detail: Agencies section                                                                   | ✅      | ✅ (Tab)                                   |
| 17  | Detail: Providers section (grid)                                                           | ✅      | ✅ (Tab; flat list, not grid)              |
| 18  | Edit URL `/:id/edition`                                                                    | ✅      | ⚠️ `/{id}/edit`                            |
| 19  | Form: Basic — name, primaryContact, emailAddress, active                                   | ✅      | ❌ Form lacks `primaryContact` field; uses `isActive` Select instead of Switch |
| 20  | Form: services (required), notes, hours (required), url (required)                         | ✅      | ❌ None of these fields exist in portal form |
| 21  | Form: 6 boolean feature checkboxes                                                         | ✅      | ❌ None present                            |
| 22  | Form: Address (address1, address2, city, state Dropdown, zipCode) with required validators | ✅      | ❌ Single free-text `location` field      |
| 23  | Form: Phone numbers FormArray with required+phoneValidator                                 | ✅      | ❌ Single optional `phone` Input          |
| 24  | Form: Resource Types listbox CVA bound to ID array                                          | ✅      | ❌ Single `resourceTypeName` text field   |
| 25  | Form: Insurances, Agencies, Reasons listbox CVAs                                            | ✅      | ❌ Not in form (read-only on detail)      |
| 26  | Form: `medical/healthy_living` category locked on edit                                      | n/a (separate routes) | ✅ (portal-specific behaviour) |
| 27  | Save → POST/PUT then navigate (new → list, edit → detail)                                  | ✅      | ⚠️ Always navigates to detail              |
| 28  | Save success toast `Confirmation_*`                                                         | ✅      | ✅ (English-only)                          |
| 29  | EN/ES via Transloco                                                                         | ✅      | ❌ Hard-coded English                       |
| 30  | Type tag severity by `id % 6`                                                              | ✅      | ⚠️ Uses string-hash colour cycle (6 tones), different palette |

---

## 4. Gap Analysis

### Present in Angular, missing or differing in Next.js

1. **Form scope.** Angular form covers 26 fields including `primaryContact`, `hours`, `url`, `services`, `notes`, 6 feature booleans, full `Address` sub-form, `phoneNumbers` FormArray, and four ListBox-CVA ID-array selectors (`resourceTypes`, `insurers`, `agencies`, `reasons`). Portal form has 11 fields and treats the resource as a thin "name + category + freeform location + phone" record.
2. **Address fields and validators.** Angular: 4 required subfields + dropdown state + tenant default. Portal: single optional `location` free text.
3. **Phone numbers.** Angular: FormArray with regex-validated number and required type from `PhoneNumberTypeService`. Portal: optional `phone` single string.
4. **Required fields.** Angular requires `services`, `hours`, `url`, `primaryContact`, `emailAddress` (no email-format check), plus the address+phone validators. Portal requires only `name`.
5. **Feature booleans.** Six checkboxes (`acceptingNewClients`, `indigentCare`, `slidingFeeScale`, `interviewCheck`, `publicTransportation`, `bilingualStaff`) are entirely absent in the portal form and detail.
6. **Linked-entity editors.** Angular ships custom CVAs (`<app-medical-resource-types>`, `<app-medical-resources-insurances>`, `<app-medical-resources-agencies>`, `<app-medical-resources-reasons>`) for managing the ID arrays from the form. Portal exposes these as read-only tabs on the detail page only.
7. **"By type" summary card.** Angular renders a 4th KPI tile containing per-type counts as PrimeNG `p-tag` chips. Portal has a separate "By type" clickable chip row but no dedicated KPI card.
8. **Phone column on list.** Angular shows `<app-phone-numbers-info>` per row. Portal does not surface phone numbers in the list at all.
9. **Global filter fields.** Angular searches `name + primaryContact + emailAddress`. Portal searches only `name` (TanStack default column filter).
10. **Adaptive empty state.** Angular branches the empty message and CTA between filtered / first-time / generic. Portal renders one static message.
11. **Pagination.** Angular's `p-table` ships `rowsPerPageOptions=[10,25,50]` + current-page report. Portal `DataTable` provides only prev/next.
12. **Map embed.** Angular renders an actual map (`<app-map>` with optional lat/lng). Portal renders only an "Open in Maps" hyperlink.
13. **Edit-route URL.** Angular: `/:id/edition`. Portal: `/{id}/edit`.
14. **Save redirect target on create.** Angular goes to list. Portal goes to detail.
15. **i18n.** Angular EN + ES via Transloco. Portal English-only.
16. **`<app-medical-resource-info>` shared widget.** Angular shows it on detail with structured render; portal renders three ad-hoc cards instead.

### New in Next.js, not in Angular

1. **Unified medical + healthy-living list.** Portal merges both `/medical-resources` and `/healthy-living-resources` into a single `/resources` page with a Category filter and an internal `category: 'medical' | 'healthy_living'` discriminator on the row. Angular keeps them as two routes / two feature modules.
2. **Partner & Program type filters surfaced.** Portal multi-selects for HL-specific entities show on the unified list; this concept doesn't exist on the Angular MR list.
3. **"By type" inline chip row** (clickable to set the type filter) sits below the filter bar. Angular only shows chips inside a static KPI card.
4. **Category cannot be changed in edit.** Portal form locks `category` after creation. Angular has no parallel because the two resource kinds use separate routes/services.
5. **Category-specific fields in form** (`npi`, `specialty` when medical; `activityType` when healthy living). These names do not appear in `MedicalResource` model; they are portal extensions.
6. **API proxied through Next route handlers** (`/api/resources/medical*`, `/api/resources/healthy-living*`) — keeps bearer token server-side. Angular uses HttpClient directly with token interceptor.
