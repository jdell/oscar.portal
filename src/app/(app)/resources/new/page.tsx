import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceForm } from "../resource-form";

export default function NewResourcePage() {
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
        </Link>
      </Button>
      <PageHeader
        title="New resource"
        description="Add a medical or healthy living resource."
      />
      <ResourceForm />
    </div>
  );
}
