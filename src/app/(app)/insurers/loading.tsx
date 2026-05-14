import { PageHeaderSkeleton } from "@/components/page-header-skeleton";
import { DataTableSkeleton } from "@/components/data-table-skeleton";

export default function InsurersLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction />
      <DataTableSkeleton rows={8} columns={4} />
    </div>
  );
}
