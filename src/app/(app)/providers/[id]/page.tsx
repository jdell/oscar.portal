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

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/providers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to providers
        </Link>
      </Button>
      <PageHeader title="Provider detail" description={`ID: ${id}`} />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Provider detail view coming soon.
        </CardContent>
      </Card>
    </div>
  );
}
