import { PageHeaderSkeleton } from "@/components/page-header-skeleton";
import { DataTableSkeleton } from "@/components/data-table-skeleton";

export default function PermissionsLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction={false} />
      <DataTableSkeleton rows={8} columns={3} />
    </div>
  );
}
