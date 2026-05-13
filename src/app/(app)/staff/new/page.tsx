import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewStaffPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New staff member"
        description="Add a new staff member to your organization."
      />
      <Card>
        <CardHeader>
          <CardTitle>Staff form</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Form coming soon. Use the agencies form as a reference.
        </CardContent>
      </Card>
    </div>
  );
}
