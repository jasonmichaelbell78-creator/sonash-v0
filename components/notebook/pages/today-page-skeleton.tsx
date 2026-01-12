import { Skeleton } from "@/components/ui/skeleton";

export function TodayPageSkeleton() {
  return (
    <div className="h-full overflow-y-auto pr-2 pb-8 scrollbar-hide">
      {/* Header skeleton */}
      <div className="mb-6 pt-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-16 w-32" />
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Clean time skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Quote skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Reading links skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-lg" />
              <Skeleton className="flex-1 h-12 rounded-lg" />
            </div>
          </div>

          {/* Notepad skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Check-in skeleton */}
          <div>
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="flex-1 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* HALT skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>

          {/* Button skeleton */}
          <Skeleton className="h-20 w-full rounded-xl" />

          {/* Stats skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
