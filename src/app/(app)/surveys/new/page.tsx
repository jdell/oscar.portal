import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { SurveyBuilder } from "../survey-builder";

export default function NewSurveyPage() {
  return (
    <div className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/surveys">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to surveys
        </Link>
      </Button>
      <PageHeader
        title="New survey"
        description="Build a multi-language survey with questions and answers."
      />
      <SurveyBuilder />
    </div>
  );
}
