import { Skeleton } from "@/components/ui/skeleton";

const COL_WIDTHS = ["28%", "20%", "18%", "16%", "18%"];

export function DataTableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64" />
      <div className="rounded-md border bg-background">
        <div className="border-b px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4"
                style={{ width: COL_WIDTHS[i % COL_WIDTHS.length] }}
              />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-b-0">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-4"
                  style={{ width: COL_WIDTHS[j % COL_WIDTHS.length] }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
