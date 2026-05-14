# TRD — Surveys

> Technical Requirements Document for the Surveys admin module.
>
> - **Angular source:** `oscar.cloud/apps/oscar-app/src/app/features/admin/surveys/`
> - **Next.js destination:** `oscar.portal/src/app/(app)/surveys/`, `oscar.portal/src/app/api/surveys/`
> - **Source of truth for fields:** `oscar.cloud/libs/models/src/lib/entities/survey.model.ts`

---

## 1. Functional Requirements

### Data Model

#### `Survey` and friends (Angular `@oscar/models`)
```ts
interface Survey {
  id: number;
  name: string;
  description: string;
  active: boolean;
  organizationId: number;
  updatedAt: string;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: number;
  surveyId: number;
  text: string;
  type: number;          // 0=Radio, 1=Checkbox, 2=Text, 3=Info
  answers: SurveyAnswer[];
  translations: SurveyQuestionTranslation[];
}

interface SurveyAnswer {
  id: number;
  surveyQuestionId: number;
  value: number;
  text: string;
  translations: SurveyAnswerTranslation[];
}

interface SurveyQuestionTranslation {
  id: number;
  surveyQuestionId: number;
  languageId: number;    // hardcoded: 2=English, 3=Spanish
  text: string;
}

interface SurveyAnswerTranslation {
  id: number;
  surveyAnswerId: number;
  languageId: number;
  text: string;
}
```

#### Language enum (Angular `survey-detail.component.ts`)
```ts
enum LanguageEnum { Spanish = 3, English = 2 }
```

#### Question types (Angular `questionTypes` array)
```ts
[
  { label: 'Radio',    value: 0 },
  { label: 'Checkbox', value: 1 },
  { label: 'Text',     value: 2 },
  { label: 'Info',     value: 3 },
]
```
- Answers panel is **hidden** when `type === 2` (Text) or `type === 3` (Info).

#### Next.js `src/lib/types.ts`
```ts
enum SurveyLanguage { English = 2, Spanish = 3 }
enum SurveyQuestionType { Radio = 0, Checkbox = 1, Text = 2, Info = 3 }

interface Survey {
  id: number;
  name: string;
  description: string;
  active: boolean;
  organizationId?: number;
  updatedAt?: string;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: number;
  surveyId: number;
  text: string;
  type: number;
  answers: SurveyAnswer[];
  translations: SurveyQuestionTranslation[];
}

interface SurveyAnswer {
  id: number;
  surveyQuestionId: number;
  value: number;
  text: string;
  translations: SurveyAnswerTranslation[];
}

interface SurveyQuestionTranslation {
  id: number;
  surveyQuestionId: number;
  languageId: number;
  text: string;
}

interface SurveyAnswerTranslation {
  id: number;
  surveyAnswerId: number;
  languageId: number;
  text: string;
}
```
- Identical to Angular except `organizationId` and `updatedAt` are optional in the Next.js type.

### Business Logic & Validation

#### Angular `survey-detail.component.ts`
- Form built with `FormBuilder` + `FormArray` for `questions` and nested `answers`.
- Top-level `Validators.required` on `name`.
- Question `text`: `Validators.required`.
- Answer `text`: `Validators.required`.
- `submitted` boolean gates inline error display (`*ngIf="submitted && !surveyForm.get('name').value"`).
- Save guards: `if (this.surveyForm.invalid) return;`.
- Save transforms each question's `trans_es` into a `translations[]` array with `languageId: 3 (Spanish)`. English text lives directly on `question.text` / `answer.text`.
- Empty `trans_es` produces an empty `translations[]` array.
- Each new translation submitted with `id: 0` (server decides).

#### Next.js `survey-builder.tsx` (Zod schema)
```ts
const answerSchema = z.object({
  id:       z.coerce.number().int().default(0),
  text:     z.string().min(1, "Answer text required"),
  value:    z.coerce.number().int().default(0),
  trans_es: z.string().optional(),
});

const questionSchema = z.object({
  id:       z.coerce.number().int().default(0),
  text:     z.string().min(1, "Question text required"),
  type:     z.coerce.number().int().min(0).max(3),
  trans_es: z.string().optional(),
  answers:  z.array(answerSchema),
});

const schema = z.object({
  id:          z.coerce.number().int().default(0),
  name:        z.string().min(1, "Name is required"),
  description: z.string().optional(),
  active:      z.boolean(),
  questions:   z.array(questionSchema),
});
```
- Uses the **3-generic `useForm<z.input, unknown, z.output>`** pattern (Zod 4 coerce-vs-resolver workaround).
- Same translation-flattening as Angular: `trans_es` becomes a single `SurveyQuestionTranslation` with `languageId: 3` (skipped if empty/whitespace).

### API Intersections

#### Angular `surveys.service.ts`
| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/surveys` | — | `Survey[]` |
| GET | `/surveys/{id}` | — | `Survey` |
| POST | `/surveys` | `Survey` (id=0) | `Survey` |
| PUT | `/surveys/{id}` | `Survey` (full object) | `void` |
| DELETE | `/surveys/{id}` | — | `void` |

#### Next.js (`/api/surveys/*` → backend)
| Method | Route Handler | Backend Call | Body |
|---|---|---|---|
| GET | _Direct `api.get` in `page.tsx` + `[id]/page.tsx`_ | `GET /surveys`, `GET /surveys/{id}` | — |
| POST | `POST /api/surveys` | `POST /surveys` | Survey object |
| PUT | `PUT /api/surveys/{id}` | `PUT /surveys/{id}` | Survey object |
| DELETE | `DELETE /api/surveys/{id}` | `DELETE /surveys/{id}` | — |

PUT response is discarded (`api.put(...)`); both Angular and Next treat it as `void`.

### User Actions

#### Angular `survey-list.component.html`
- PrimeNG `<p-toolbar>` with a `New` button (success severity, `pi pi-plus`) that routes to `admin/surveys/new`.
- PrimeNG `<p-table>` with:
  - 10 rows per page, paginator, `currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"`.
  - Global filter input on `name` + `description`.
  - Sortable columns: `name`, `active`, `updatedAt`.
  - Rows show name + description subtitle, active state (green check / red times icon), `updatedAt` via `| date : 'medium'`.
  - Per-row edit button (`pi pi-pencil`, success severity, outlined) → `editSurvey(survey)` → routes to `admin/surveys/{id}`.
  - Per-row delete button (`pi pi-trash`, danger severity) → `deleteSurvey(survey)`.
  - Footer summary: `In total there are {n} surveys`.
- `deleteSurvey` opens a PrimeNG `ConfirmationService.confirm({ message: 'Are you sure you want to delete <name>?', header: 'Confirm', icon: 'pi pi-exclamation-triangle' })`. Accept calls DELETE → toast `Survey Deleted` (success, life 3000) or `Failed to delete survey` (error).

#### Angular `survey-detail.component.html`
- Header: `editMode ? 'Edit Survey' : 'New Survey'`.
- Name input (English), required, inline error.
- Active `<p-inputSwitch>`.
- Description textarea (3 rows).
- `<p-divider>` with `<p-tag>Questions</p-tag>`.
- Per-question card with:
  - Header showing `Question {i+1}` and a delete-question trash button.
  - Text (English) and Text (Spanish) side-by-side inputs.
  - Type dropdown with the 4 options.
  - Answers section **rendered only if `type !== 2 && type !== 3`**:
    - Per-answer row: Answer (English), Answer (Spanish), and remove button (`pi pi-times`).
    - Add Answer button (`pi pi-plus`, outlined small).
- `Add Question` button centered below.
- Cancel button (text, `pi pi-times`) → `router.navigate(['/admin/surveys'])`.
- Save button (`pi pi-check`, type=submit) shows `[loading]="loading"`.
- Save success toast: `Survey Saved` (success, life 3000). Failure: `Failed to save survey` (error).

#### Next.js `surveys-table.tsx`
- 3 summary cards: **Total surveys**, **Active**, **Inactive** (no icons in the cards).
- Status filter `<Select>`: `All statuses / Active / Inactive`.
- Search by name and description (`searchKey="name"`).
- Table columns:
  - **Name** with `description` truncated as subtitle.
  - **Questions** count (`questions?.length ?? 0`).
  - **Active** as `<CheckCircle2 className="text-emerald-500" />` or `<XCircle className="text-red-500" />`.
  - **Updated** via `formatDate(updatedAt)`.
- Per-row `DropdownMenu` (kebab) with `Edit` (routes to `/surveys/{id}`) and `Delete` (opens confirm `Dialog`).
- Delete confirm `Dialog` copy: "Delete survey? This will permanently delete '<name>' and all its questions and answers. This cannot be undone." Buttons: Cancel + Delete (destructive).
- Delete success: toast `"Survey deleted"`. Failure: toast `"Delete failed"`.
- Row click navigates to `/surveys/{id}`.

#### Next.js `survey-builder.tsx`
- Top card: Name (English, required), Active switch, Description (3-row textarea).
- Question list with `useFieldArray`:
  - Per-question card with `<GripVertical>` handle icon (visual only; **not actually draggable**), `Question N` label, remove-question button.
  - Text (English) required, Text (Spanish), Type select (Radio/Checkbox/Text/Info).
  - Answers panel rendered only when `type !== 2 && type !== 3` (matches Angular).
  - Per-answer row: Text (English) required, Text (Spanish), **Value (number)**, remove-answer button.
  - Add answer button increments answer `value` based on current `answerFields.length` index.
- Empty state in the question list: "No questions yet. Add the first one below."
- `Add question` outlined dashed button below the list.
- Footer: Cancel (routes to `/surveys`) + Save (sky-600 button, sonner spinner).
- Save POSTs or PUTs to `/api/surveys[/id]`, then `router.push("/surveys")` and `router.refresh()`.
- Save success toast: `"Survey saved"`. Failure: `body.message ?? "Save failed"` or `"Network error — try again"`.

---

## 2. Non-Functional Requirements

### State Management

#### Angular
- `SurveyListComponent`: `surveys: Survey[]` populated via `surveysService.getAll().pipe(untilDestroyed(this))`.
- `SurveyDetailComponent`: `FormGroup` with nested `FormArray`s; `editMode`, `submitted`, `loading`, `surveyId` local fields.
- `route.paramMap.pipe(switchMap(...))` switches between create and edit modes; if `id !== 'new'`, calls `surveysService.get(id)` and `patchForm()` to populate.
- `MessageService` (PrimeNG) provides toasts. `ConfirmationService` provides delete confirmations.

#### Next.js
- Server components load surveys; client components hold form/UI state.
- `survey-builder.tsx` uses `react-hook-form` with `useFieldArray` for both `questions` and per-question `answers`.
- Sub-component `QuestionCard` receives the parent `form` instance and an index, calls `useFieldArray` on `questions.${index}.answers`.
- `useRouter` from `next/navigation` for navigation and `router.refresh()` for cache invalidation.
- `sonner` for toasts.

### Permissions
- **Angular:** `/admin/surveys` routes are gated by the admin app's auth guards (logged-in admins only).
- **Next.js:** `(app)` route group wraps with `requireSession()`. Super-admin only via the portal. No per-permission gating inside the surveys page.

### Error Handling

#### Angular
- Service calls subscribed with `next/error` callbacks; failure toasts a generic `Failed to delete survey` or `Failed to save survey`.
- Form invalid → early `return;` from `saveSurvey()` with `submitted = true` flipping inline error visibility.

#### Next.js
- `api.ts` throws `ApiError(status, body)`.
- Server loaders catch `ApiError` (404 → `notFound()`, others log + return `[]`/`null`).
- Route handlers wrap calls and forward the backend status with `{ message, body? }`.
- Client mutations show `sonner` toasts.
- Zod messages render inline under each input (`form.formState.errors.questions?.[i]?.text?.message`).

---

## 3. Migration Checklist

Definition of Done:

- [x] `Survey`, `SurveyQuestion`, `SurveyAnswer`, both translation interfaces declared in `src/lib/types.ts`.
- [x] `SurveyQuestionType` and `SurveyLanguage` enums match Angular (Radio=0, Checkbox=1, Text=2, Info=3; English=2, Spanish=3).
- [x] `/surveys` list page with `GET /surveys`.
- [x] Search by name + description.
- [x] Sortable name / active / updated columns (sorting comes from DataTable defaults).
- [x] Per-row Edit and Delete actions with confirmation Dialog.
- [x] `/surveys/new` with empty builder.
- [x] `/surveys/{id}` with prefilled builder fetched via `GET /surveys/{id}`.
- [x] Survey builder supports add/remove questions and nested add/remove answers via `useFieldArray`.
- [x] Answers panel hidden for type 2 (Text) and 3 (Info).
- [x] En + Es text inputs for both questions and answers.
- [x] On save, `trans_es` flattened into `translations[]` with `languageId: 3`.
- [x] `POST /api/surveys` → `POST /surveys`.
- [x] `PUT /api/surveys/{id}` → `PUT /surveys/{id}`.
- [x] `DELETE /api/surveys/{id}` → `DELETE /surveys/{id}`.
- [x] Sonner toasts on success/failure.
- [x] Nav entry slotted between Locations and Permissions in `src/components/layout/nav-items.ts`.
- [x] Build passes `next build` type-check.

---

## 4. Gap Analysis

### In Angular but missing in Next.js
- **Footer table summary** (`In total there are {n} surveys`). Next.js DataTable does not render a summary footer.
- **`currentPageReportTemplate`** ("Showing X to Y of N"). Next.js uses no count summary.
- **`*ngIf` per-question inline name-required error** (`Name is required.`). Next.js uses Zod error rendering, which is broadly equivalent but worded differently.
- **PrimeNG `<p-confirmDialog>` with `pi pi-exclamation-triangle`** triangle icon. Next.js uses a styled `<Dialog>` with no icon.
- **Per-row Edit button (pencil) + Delete button (trash) side-by-side**. Next.js consolidates these into a kebab `DropdownMenu`.
- **PrimeNG `<p-toolbar>`** containing the New button. Next.js places the New button in the page header.
- **`<p-divider>` with `<p-tag>Questions</p-tag>`** visually separating the metadata fields from the questions array. Next.js uses a plain h3 label.

### New in Next.js (not in Angular)
- **Status filter dropdown** (`All / Active / Inactive`) above the table. Angular has no status filter.
- **3 summary cards** (Total, Active, Inactive) above the table. Angular surfaces these only as a footer count.
- **Question count column** in the list view. Angular does not show question count.
- **Answer `value` field** rendered as a number input in the builder. Angular's data model has `value: number` but the form template does not expose a value input (likely auto-incrementing on the server).
- **`GripVertical` drag handle icon** on each question card. **Decorative — not actually wired up for drag-and-drop**; documented here to avoid future confusion.
- **Empty-questions copy**: "No questions yet. Add the first one below." Angular shows the empty state implicitly (no question cards).
- **Add Question button** styled with a dashed outline. Angular uses a default PrimeNG button.
- **List envelope flexibility**: accept `Survey[]` or `{ items: Survey[] }`.
- **`router.refresh()`** for cache invalidation after mutation. Angular re-fetches with `loadSurveys()`.
- **Question type stored as `z.coerce.number()`**: the form `<Select>` returns strings; Zod coerces to numeric.
