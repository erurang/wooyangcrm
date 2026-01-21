"use client";

import { Skeleton } from "./Skeleton";

export default function ProductionDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="p-3 h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-9 w-12" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <Skeleton className="h-12 w-12 rounded-xl mb-3" />
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
