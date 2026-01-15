"use client";

import { Skeleton, SkeletonText } from "./Skeleton";

interface CardSkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
}

export default function CardSkeleton({
  showImage = false,
  showActions = false,
}: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      {showImage && <Skeleton className="h-40 w-full rounded-md" />}
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={2} />
      </div>
      {showActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      )}
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}
