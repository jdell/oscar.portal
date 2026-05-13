import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { LocationForm } from "../location-form";

export default function NewLocationPage() {
  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/locations">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to locations
        </Link>
      </Button>
      <PageHeader
        title="New location"
        description="Create a physical location in your organization."
      />
      <LocationForm />
    </div>
  );
}
