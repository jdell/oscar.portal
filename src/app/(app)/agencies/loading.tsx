import { PageHeaderSkeleton } from "@/components/page-header-skeleton";
import { KpiGridSkeleton } from "@/components/kpi-card-skeleton";
import { DataTableSkeleton } from "@/components/data-table-skeleton";

export default function AgenciesLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction />
      <KpiGridSkeleton count={4} />
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  );
}
