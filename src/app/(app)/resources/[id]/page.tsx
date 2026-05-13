import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
        </Link>
      </Button>
      <PageHeader title="Resource detail" description={`ID: ${id}`} />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Resource detail view coming soon.
        </CardContent>
      </Card>
    </div>
  );
}
