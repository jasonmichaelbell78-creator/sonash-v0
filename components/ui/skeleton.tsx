"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton component with subtle shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-amber-900/10", className)} />;
}

/**
 * Skeleton for a journal entry card
 */
export function JournalEntrySkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

/**
 * Skeleton for the history page
 */
export function HistoryPageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <JournalEntrySkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for notebook page content
 */
export function NotebookPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Mood selector skeleton */}
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-full" />
        ))}
      </div>

      {/* Text area skeleton */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* Buttons skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for meeting cards
 */
export function MeetingCardSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Skeleton for meeting finder page
 */
export function MeetingFinderSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Filter pills skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>

      {/* Meeting cards skeleton */}
      {[1, 2, 3].map((i) => (
        <MeetingCardSkeleton key={i} />
      ))}
    </div>
  );
}
