"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  SurveyLanguage,
  SurveyQuestionType,
  type Survey,
  type SurveyAnswer,
  type SurveyQuestion,
} from "@/lib/types";

const QUESTION_TYPES = [
  { label: "Radio", value: SurveyQuestionType.Radio },
  { label: "Checkbox", value: SurveyQuestionType.Checkbox },
  { label: "Text", value: SurveyQuestionType.Text },
  { label: "Info", value: SurveyQuestionType.Info },
] as const;

const answerSchema = z.object({
  id: z.coerce.number().int().default(0),
  text: z.string().min(1, "Answer text required"),
  value: z.coerce.number().int().default(0),
  trans_es: z.string().optional(),
});

const questionSchema = z.object({
  id: z.coerce.number().int().default(0),
  text: z.string().min(1, "Question text required"),
  type: z.coerce.number().int().min(0).max(3),
  trans_es: z.string().optional(),
  answers: z.array(answerSchema),
});

const schema = z.object({
  id: z.coerce.number().int().default(0),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  active: z.boolean(),
  questions: z.array(questionSchema),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function spanishText(
  translations: { languageId: number; text: string }[] | undefined,
): string {
  return translations?.find((t) => t.languageId === SurveyLanguage.Spanish)
    ?.text ?? "";
}

function toFormQuestion(q: SurveyQuestion): FormInput["questions"][number] {
  return {
    id: q.id ?? 0,
    text: q.text ?? "",
    type: q.type ?? SurveyQuestionType.Radio,
    trans_es: spanishText(q.translations),
    answers: (q.answers ?? []).map(
      (a): FormInput["questions"][number]["answers"][number] => ({
        id: a.id ?? 0,
        text: a.text ?? "",
        value: a.value ?? 0,
        trans_es: spanishText(a.translations),
      }),
    ),
  };
}

function fromFormValues(values: FormValues): Survey {
  return {
    id: values.id,
    name: values.name,
    description: values.description ?? "",
    active: values.active,
    questions: values.questions.map((q): SurveyQuestion => {
      const translations = q.trans_es?.trim()
        ? [
            {
              id: 0,
              surveyQuestionId: q.id,
              languageId: SurveyLanguage.Spanish,
              text: q.trans_es,
            },
          ]
        : [];
      return {
        id: q.id,
        surveyId: values.id,
        text: q.text,
        type: q.type,
        translations,
        answers: q.answers.map(
          (a): SurveyAnswer => ({
            id: a.id,
            surveyQuestionId: q.id,
            text: a.text,
            value: a.value,
            translations: a.trans_es?.trim()
              ? [
                  {
                    id: 0,
                    surveyAnswerId: a.id,
                    languageId: SurveyLanguage.Spanish,
                    text: a.trans_es,
                  },
                ]
              : [],
          }),
        ),
      };
    }),
  };
}

interface SurveyBuilderProps {
  initial?: Survey;
}

export function SurveyBuilder({ initial }: SurveyBuilderProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: initial?.id ?? 0,
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      active: initial?.active ?? true,
      questions: (initial?.questions ?? []).map(toFormQuestion),
    },
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({ control: form.control, name: "questions" });

  function addQuestion() {
    appendQuestion({
      id: 0,
      text: "",
      type: SurveyQuestionType.Radio,
      trans_es: "",
      answers: [],
    });
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = fromFormValues(values);
      const url = isEdit ? `/api/surveys/${values.id}` : "/api/surveys";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Save failed");
        return;
      }
      toast.success("Survey saved");
      router.push("/surveys");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="active">Active</Label>
              <div className="flex items-center h-9 rounded-md border px-3">
                <Switch
                  id="active"
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-md border bg-background p-2 text-sm"
              {...form.register("description")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Questions ({questionFields.length})
          </h3>
        </div>

        {questionFields.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No questions yet. Add the first one below.
            </CardContent>
          </Card>
        )}

        {questionFields.map((field, qIdx) => (
          <QuestionCard
            key={field.id}
            index={qIdx}
            form={form}
            onRemove={() => removeQuestion(qIdx)}
          />
        ))}

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" /> Add question
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/surveys")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Save survey"}
        </Button>
      </div>
    </form>
  );
}

interface QuestionCardProps {
  index: number;
  form: ReturnType<typeof useForm<FormInput, unknown, FormValues>>;
  onRemove: () => void;
}

function QuestionCard({ index, form, onRemove }: QuestionCardProps) {
  const {
    fields: answerFields,
    append: appendAnswer,
    remove: removeAnswer,
  } = useFieldArray({
    control: form.control,
    name: `questions.${index}.answers`,
  });

  const type = form.watch(`questions.${index}.type`);
  const showAnswers =
    Number(type) !== SurveyQuestionType.Text &&
    Number(type) !== SurveyQuestionType.Info;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-2">
          <GripVertical
            size={18}
            className="mt-1 text-muted-foreground shrink-0"
            aria-hidden
          />
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                Question {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={onRemove}
                aria-label="Remove question"
              >
                <Trash2 size={14} />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`q-text-${index}`}>Text (English) *</Label>
                <Input
                  id={`q-text-${index}`}
                  {...form.register(`questions.${index}.text`)}
                />
                {form.formState.errors.questions?.[index]?.text && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.questions[index]?.text?.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`q-trans-${index}`}>Text (Spanish)</Label>
                <Input
                  id={`q-trans-${index}`}
                  {...form.register(`questions.${index}.trans_es`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`q-type-${index}`}>Type</Label>
                <Select
                  value={String(form.watch(`questions.${index}.type`))}
                  onValueChange={(v) =>
                    form.setValue(`questions.${index}.type`, Number(v ?? 0))
                  }
                >
                  <SelectTrigger id={`q-type-${index}`}>
                    <SelectValue>
                      {QUESTION_TYPES.find(
                        (t) => t.value === form.watch(`questions.${index}.type`),
                      )?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showAnswers && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Answers ({answerFields.length})
                </div>
                {answerFields.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No answer options yet.
                  </p>
                )}
                {answerFields.map((aField, aIdx) => (
                  <div
                    key={aField.id}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_4rem_auto] items-end"
                  >
                    <div className="space-y-1">
                      <Label
                        htmlFor={`ans-text-${index}-${aIdx}`}
                        className="text-xs"
                      >
                        Answer (English) *
                      </Label>
                      <Input
                        id={`ans-text-${index}-${aIdx}`}
                        {...form.register(
                          `questions.${index}.answers.${aIdx}.text`,
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`ans-trans-${index}-${aIdx}`}
                        className="text-xs"
                      >
                        Answer (Spanish)
                      </Label>
                      <Input
                        id={`ans-trans-${index}-${aIdx}`}
                        {...form.register(
                          `questions.${index}.answers.${aIdx}.trans_es`,
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`ans-value-${index}-${aIdx}`}
                        className="text-xs"
                      >
                        Value
                      </Label>
                      <Input
                        id={`ans-value-${index}-${aIdx}`}
                        type="number"
                        className="w-16"
                        {...form.register(
                          `questions.${index}.answers.${aIdx}.value`,
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                      onClick={() => removeAnswer(aIdx)}
                      aria-label="Remove answer"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendAnswer({
                      id: 0,
                      text: "",
                      value: answerFields.length,
                      trans_es: "",
                    })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Add answer
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
