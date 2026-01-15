"use client";

import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export default function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* 테이블 헤더 */}
      {showHeader && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4 flex-1"
                style={{ maxWidth: i === 0 ? "100px" : "150px" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 테이블 행 */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className="h-4 flex-1"
                  style={{
                    maxWidth:
                      colIndex === 0
                        ? "100px"
                        : colIndex === columns - 1
                        ? "80px"
                        : "150px",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
