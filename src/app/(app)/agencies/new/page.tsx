import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { AgencyForm } from "../agency-form";

export default function NewAgencyPage() {
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/agencies">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to agencies
        </Link>
      </Button>
      <PageHeader
        title="New agency"
        description="Create a new agency under your organization."
      />
      <AgencyForm />
    </div>
  );
}
