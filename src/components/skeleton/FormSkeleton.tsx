"use client";

import { Skeleton } from "./Skeleton";

interface FormSkeletonProps {
  fields?: number;
  hasButtons?: boolean;
}

/**
 * 폼 로딩 스켈레톤
 * - 폼 데이터 로드 시 사용
 * - 필드 수와 버튼 표시 여부 조절 가능
 */
export default function FormSkeleton({
  fields = 4,
  hasButtons = true,
}: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* 필드들 */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {/* 버튼 영역 */}
      {hasButtons && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}
