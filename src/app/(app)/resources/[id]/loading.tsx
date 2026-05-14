import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/page-header-skeleton";

export default function ResourceDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-36" />
        <PageHeaderSkeleton hasAction />
        <div className="mt-2 flex flex-wrap gap-2">
          {[60, 80, 70].map((w, i) => (
            <Skeleton key={i} className="h-5 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Contact", "Location", "Details"].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-4 flex gap-2">
          {[80, 72, 96].map((w, i) => (
            <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
          ))}
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
