import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewResourcePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New resource" />
      <Card>
        <CardHeader>
          <CardTitle>Resource form</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Form coming soon. Use the agencies form as a reference.
        </CardContent>
      </Card>
    </div>
  );
}
