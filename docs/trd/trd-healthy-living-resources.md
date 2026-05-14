# TRD — Healthy Living Resources

**Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/healthy-living-resources/`
**Next.js destination:** `oscar.portal/src/app/(app)/resources/` (unified medical + healthy-living page)

---

## 1. Functional Requirements

### Data Model

**`HealthyLivingResource`** (`libs/models/src/lib/entities/healthy-living-resource.model.ts`)

| Field                      | Type            | Default (new) | Notes                                  |
| -------------------------- | --------------- | ------------- | -------------------------------------- |
| `id`                       | `number`        | —             | Server-assigned                        |
| `name`                     | `string`        | —             | Required                               |
| `primaryContact`           | `string`        | —             | Required                               |
| `emailAddress`             | `string`        | —             | Required (no `.email` validator)       |
| `url`                      | `string`        | —             | Required                               |
| `hours`                    | `string`        | —             | Required                               |
| `active`                   | `boolean`       | `true`        | InputSwitch                            |
| `acceptingNewClients`      | `boolean`       | `false`       | Checkbox                               |
| `eligibilityRequirements`  | `boolean`       | `false`       | Checkbox                               |
| `applicationProcess`       | `boolean`       | `false`       | Checkbox                               |
| `feesAssociated`           | `boolean`       | `false`       | Checkbox                               |
| `publicTransportation`     | `boolean`       | `false`       | Checkbox                               |
| `bilingualStaff`           | `boolean`       | `false`       | Checkbox                               |
| `targetAudience`           | `string`        | —             | Required                               |
| `services`                 | `string`        | —             | Required                               |
| `notes`                    | `string`        | —             | Optional                               |
| `phoneNumbers`             | `PhoneNumber[]` | `[]`          | FormArray                              |
| `address`                  | `Address`       | `{}`          | Sub-form                               |
| `insurers`                 | `number[]`      | `[]`          | ID array — listbox                     |
| `partnerTypes`             | `number[]`      | `[]`          | ID array — listbox                     |
| `programTypes`             | `number[]`      | `[]`          | ID array — listbox                     |
| `agencies`                 | `number[]`      | `[]`          | ID array — listbox                     |

**`PartnerType`** — `{ id: number, name: string }` (`/partner-types`).
**`ProgramType`** — `{ id: number, name: string }`. **Note:** the program-types endpoint is `/healthy-living-resource-types` (not `/program-types` — see `admin-program-types.service.ts`).
**`Address`** — `address1`, `address2`, `street?`, `city`, `state`, `zipCode`.
**`PhoneNumber`** — `{ number: string, type: number }`.

### Business Logic & Validation

**Form** (`admin-healthy-living-resource.component.ts`, `buildForm`):

| Field                          | Validators                                |
| ------------------------------ | ----------------------------------------- |
| `name`                         | `Validators.required`                     |
| `primaryContact`               | `Validators.required`                     |
| `emailAddress`                 | `Validators.required` (no email check)    |
| `url`                          | `Validators.required`                     |
| `services`                     | `Validators.required`                     |
| `targetAudience`               | `Validators.required`                     |
| `hours`                        | `Validators.required`                     |
| `notes`                        | none                                      |
| `address.address1`             | `Validators.required`                     |
| `address.address2`             | none                                      |
| `address.city`                 | `Validators.required`                     |
| `address.state`                | `Validators.required`; default = `configService.config.defaults.state` |
| `address.zipCode`              | `Validators.required`                     |
| `phoneNumbers[i].number`       | `Validators.required`, `phoneValidator()` |
| `phoneNumbers[i].type`         | `Validators.required`                     |
| `active`                       | none (default `true` for new)             |
| `acceptingNewClients`, `eligibilityRequirements`, `applicationProcess`, `feesAssociated`, `publicTransportation`, `bilingualStaff` | binary checkboxes, default `false` |
| `partnerTypes`, `programTypes`, `agencies`, `insurers` | none (free-form ID arrays) |

**On submit (`save()`):**
- If `form.invalid` → `markFormTouched(form)`, abort.
- `getRawValue()` then `phoneNumbers.filter(p => p.number?.trim() && isValidPhoneType(p.type))` where `validTypes = [0,1,2,3,4,5]`.
- If `value.id` → `PUT /healthy-living-resources/{id}` → toast `Confirmation_Update_Healthy_Living_Resource` → navigate to `/admin/healthy-living-resources/{id}`.
- Else → `POST /healthy-living-resources` → toast `Confirmation_Create_Healthy_Living_Resource` → navigate to `/admin/healthy-living-resources`.
- On error → `errorHandlerService.handleError(error)`.

**Cancel (`cancel()`):** if `item?.id` → detail; else → list.

### API Intersections

| Method | Path                                         | Request Body            | Response                  | Caller                              |
| ------ | -------------------------------------------- | ----------------------- | ------------------------- | ----------------------------------- |
| GET    | `/healthy-living-resources`                  | —                       | `HealthyLivingResource[]` | List page; `getByIds` helper        |
| GET    | `/healthy-living-resources/{id}`             | —                       | `HealthyLivingResource`   | Resolver (detail + edit + breadcrumb) |
| POST   | `/healthy-living-resources`                  | `HealthyLivingResource` | `HealthyLivingResource`   | Save (new)                          |
| PUT    | `/healthy-living-resources/{id}`             | `HealthyLivingResource` | `void`                    | Save (edit)                         |
| GET    | `/partner-types`                             | —                       | `PartnerType[]`           | Form, detail                        |
| GET    | `/healthy-living-resource-types` (= program types) | —                 | `ProgramType[]`           | List program-types-names join; form; detail |
| GET    | `/agencies`                                  | —                       | `Agency[]`                | Form, detail                        |
| GET    | `/insurers`                                  | —                       | `Insurer[]`               | Form, detail                        |

No delete endpoint.

### User Actions

**List page** (`admin-healthy-living-resources.component.html`):

| Element                                       | Action                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Global search input                           | `filterGlobal(value, 'contains')` over `['name','services']` |
| Add new button (`pi pi-plus`)                 | → `/admin/healthy-living-resources/new`               |
| Row click                                     | → `/admin/healthy-living-resources/{id}` (detail)     |
| Columns                                       | Name, Phone (`<app-phone-numbers-info>`), Primary Contact, Email, Program Types (joined names string), Status tag |
| Pagination                                    | rows = 10, `rowsPerPageOptions=[10,25,50]`            |
| Status sort column                            | `pSortableColumn="active"`                            |
| Empty state                                   | (default `p-table` empty template — list has no custom message) |

`ProgramType` names are pre-computed on load via `getProgramTypesNames(programTypeIds)` and stored on each row as `programTypeNames`.

**Detail page** (`admin-healhty-living-resource-detail.component.html` — note typo in filename):

| Element                                       | Action                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| Header card: name, active tag (only when active), address line | Decorative                          |
| Edit button (`pi pi-pencil`)                  | `routerLink=['/admin/healthy-living-resources', id, 'edition']` |
| `p-tabView` with 5 tabs:                      |                                                        |
| — Information                                  | `<app-healthy-living-resource-info>` (read-only render) |
| — Agencies                                     | `p-table` of names; sort on `name`; pagination 10/25/50 |
| — Insurances                                   | `p-table` of names; sort on `name`                    |
| — Partner Types                                | `p-table` of names; sort on `name`                    |
| — Program Types                                | `p-table` of names; sort on `name`                    |
| Each tab's empty message                      | "No_agency_for_hlr", "No_insurance_for_hlr", "No_partner_type_for_hlr", "No_program_type_for_hlr" |

**Form page** (`admin-healthy-living-resource.component.html`):

| Element                              | Action                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Basic info: Name, Primary Contact, Email, Hours, URL, Target Audience, Services (textarea), Notes, Active switch | Form fields |
| 6 feature checkboxes: acceptingNewClients, eligibilityRequirements, applicationProcess, feesAssociated, publicTransportation, bilingualStaff | binary checkboxes |
| Address: Address1, Address2, City, State (Dropdown), ZipCode | Sub-form                              |
| Phone numbers FormArray: add/remove rows  | `addPhoneNumber()`, `removePhoneNumber(i)`            |
| 4 `<app-admin-listbox-select>` selectors: Partner Types, Program Types, Agencies, Insurances | CVAs bound to ID arrays |
| Back / Cancel button                 | `cancel()`                                            |
| Save button                          | `save()`; loading=`isBusy$`                           |

---

## 2. Non-Functional Requirements

### State Management

- **Component-level only.** List uses `healthyLivingResources` and `programTypes` arrays loaded sequentially (program types first, then resources).
- Form: `isBusy$` `Subject<boolean>` + several `Promise<T[]>` selectors (`states$`, `phoneTypes$`, `partnerTypes$`, `programTypes$`, `agencies$`, `insurances$`).
- Detail: every section is `Promise<T[]>` via `getByIds(ids)` on the corresponding admin service, consumed with `| async`.
- **Change detection:** `ChangeDetectionStrategy.OnPush` everywhere.
- **Resolver** (`adminHealthyLivingResourcesResolver`) used for `:id`, `:id/edition`, and re-invoked separately for the breadcrumb (acknowledged TODO duplication).

### Permissions

- Inherits gating from `/admin` parent. No route-level guards in this module.
- Form does not branch on user role.

### Error Handling

- All HTTP failures except save → `ErrorHandlerService.handleError(error)`.
- Save (POST/PUT) failure → same handler; no domain-specific messages (unlike Staff's 409 case).
- Resolver failure → `router.navigate(['/admin/healthy-living-resources'])`.
- `getByIds([])` short-circuits to `[]`.

### Performance

- Per detail page render: 5 separate `query()` round-trips (one for each section's `getByIds`), no client cache.
- List uses one `programTypes` query + one resources query, joined client-side.

---

## 3. Migration Checklist (Definition of Done)

| #   | Item                                                                                       | Angular | Next.js (`oscar.portal/resources` unified) |
| --- | ------------------------------------------------------------------------------------------ | :-----: | :----------------------------------------: |
| 1   | List columns: Name, Phone, Primary Contact, Email, Program Types, Status                   | ✅      | ⚠️ Unified table shows Name, Category, Types (incl. program-type chips on HL rows), Primary Contact, Location, Status — no Phone column |
| 2   | Global search over `name + services`                                                       | ✅      | ⚠️ Searches `name` only                    |
| 3   | Add new button                                                                              | ✅      | ✅                                         |
| 4   | Status sort                                                                                 | ✅      | ⚠️ Status filter only, not sort            |
| 5   | Pagination 10/25/50                                                                        | ✅      | ⚠️ Prev/next, no rows-per-page picker      |
| 6   | Row click → detail                                                                          | ✅      | ✅                                         |
| 7   | Detail header: name + active tag (only when active) + address line                          | ✅      | ⚠️ Shows both active & inactive badges     |
| 8   | Detail `p-tabView`: Information, Agencies, Insurances, Partner Types, Program Types         | ✅      | ⚠️ Tabs: Resource Types, Insurances, Agencies, Partner types, Program types — no "Information" tab (info inlined into header cards) |
| 9   | Detail tab empty messages per section                                                       | ✅      | ✅                                         |
| 10  | Tab tables: name column with sort + pagination                                              | ✅      | ❌ Flat lists, no table/sort/pagination    |
| 11  | Edit route `/:id/edition`                                                                   | ✅      | ⚠️ `/{id}/edit`                            |
| 12  | Form: Basic info — name (req), primaryContact (req), email (req), url (req), hours (req), targetAudience (req), services (req), notes, active switch | ✅      | ❌ Form lacks primaryContact, url, hours, targetAudience, services, notes; uses category/type/activityType fields not in HL model |
| 13  | Form: 6 boolean feature checkboxes                                                          | ✅      | ❌ None                                    |
| 14  | Form: Address (required address1/city/state/zipCode + state Dropdown)                       | ✅      | ❌ Single free-text `location` field      |
| 15  | Form: Phone numbers FormArray with required + `phoneValidator`                              | ✅      | ❌ Single optional `phone` Input          |
| 16  | Form: Partner Types listbox CVA (number[] IDs)                                              | ✅      | ❌ Read-only on detail only               |
| 17  | Form: Program Types listbox CVA (number[] IDs)                                              | ✅      | ❌ Read-only on detail only               |
| 18  | Form: Agencies listbox CVA                                                                  | ✅      | ❌ Read-only on detail only               |
| 19  | Form: Insurers listbox CVA                                                                  | ✅      | ❌ Read-only on detail only               |
| 20  | Save → POST/PUT, then redirect (new → list, edit → detail)                                   | ✅      | ⚠️ Always navigates to detail              |
| 21  | Save success toast `Confirmation_*` in EN/ES                                                | ✅      | ✅ EN only                                 |
| 22  | API endpoint `/healthy-living-resources`                                                    | ✅      | ✅ (via `/api/resources/healthy-living*`)  |
| 23  | API endpoint `/partner-types`                                                               | ✅      | ⚠️ Called only from list-page server loader; no portal admin UI |
| 24  | API endpoint `/healthy-living-resource-types` as Program Types                              | ✅      | ⚠️ Portal `page.tsx` calls `/program-types` (different URL) |

---

## 4. Gap Analysis

### Present in Angular, missing or differing in Next.js

1. **Form scope.** Angular form has 27 fields: 8 required string fields, 6 boolean feature checkboxes, full `Address` with validators, `phoneNumbers` FormArray, and 4 ID-array listboxes (`partnerTypes`, `programTypes`, `agencies`, `insurers`). Portal form has 11 fields, none of the HL-specific ones (`primaryContact`, `url`, `hours`, `targetAudience`, `services`, `notes`, the 6 feature flags, the listboxes).
2. **Address.** Angular: 4 required subfields + state Dropdown with tenant default. Portal: single optional `location` free text.
3. **Phone numbers.** Angular: FormArray with regex + required type. Portal: single optional `phone` string.
4. **`targetAudience`.** Required HL-only field — completely absent from portal.
5. **6 feature booleans** (`acceptingNewClients`, `eligibilityRequirements`, `applicationProcess`, `feesAssociated`, `publicTransportation`, `bilingualStaff`) — absent.
6. **Listbox CVAs for partner / program / agency / insurer IDs in the form** — absent (read-only on detail page).
7. **Information tab on detail.** Angular renders `<app-healthy-living-resource-info>` as the first tab — a structured key/value display of all fields. Portal inlines limited info as header description + contact/location/description cards.
8. **Sortable, paginated tab tables.** Angular renders each linked-entity tab as a `p-table` with `pSortableColumn="name"` + pagination 10/25/50. Portal shows flat lists/Badge clouds.
9. **Global search fields.** Angular searches `name + services`. Portal searches `name` only.
10. **Phone column on list** + `<app-phone-numbers-info>` rendering — not in portal.
11. **Status sort.** Angular `pSortableColumn="active"`. Portal exposes status filter, not sort.
12. **Program-type name join on list.** Angular eagerly joins `programTypeNames` (comma-joined string) onto each row. Portal renders program-type chips dynamically from the `programMap` lookup.
13. **Edit URL.** Angular: `/:id/edition`. Portal: `/{id}/edit`.
14. **Save redirect target on create.** Angular goes to list. Portal goes to detail.
15. **Active tag display.** Angular renders the active tag only when `active === true`. Portal renders both active and inactive badges.
16. **i18n.** Angular EN + ES via Transloco. Portal English-only.
17. **Breadcrumb resolver.** Angular has a dedicated breadcrumb resolver that fetches the resource label (acknowledged duplicate call). Portal has no breadcrumb system.
18. **Program Types endpoint path quirk.** Angular's `AdminProgramTypesService` calls `GET /healthy-living-resource-types` (not `/program-types`). Portal's resources page server loader calls `GET /program-types` — a different URL the .NET API may or may not expose.

### New in Next.js, not in Angular

1. **Unified list page** combining Medical + Healthy Living with a `category` selector. Angular keeps them as two separate feature modules and routes.
2. **Multi-select Partner Types and Program Types filters** on the unified list (visible when category is HL). Angular's HL list has no filter UI.
3. **KPI summary cards** (Total, Active, Inactive, Medical/HL split) on the unified list. Angular HL list has no KPIs.
4. **"By type" clickable chip row** below the filter bar.
5. **Category locked in edit form** — portal-specific because category determines target endpoint.
6. **Server-component loader fetches `/partner-types` and `/program-types`** to provide the multi-select option lists for the unified page.
7. **API proxy via Next route handlers** (`/api/resources/healthy-living*`) — keeps bearer token server-side. Angular uses HttpClient + interceptor directly.
8. **HL detail page tabs include "Resource Types"** drawn from `resourceTypesDetail`. Angular HL detail does **not** have a Resource Types tab — that concept belongs to Medical Resources (HL uses `partnerTypes` + `programTypes` instead). The portal's unified detail page reuses one tab set across both kinds.
