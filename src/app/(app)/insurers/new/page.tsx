import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { InsurerForm } from "../insurer-form";

export default function NewInsurerPage() {
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/insurers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to insurers
        </Link>
      </Button>
      <PageHeader
        title="New insurer"
        description="Add a new insurance provider to your organization."
      />
      <InsurerForm />
    </div>
  );
}
