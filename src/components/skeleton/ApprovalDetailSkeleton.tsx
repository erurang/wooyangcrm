"use client";

import { Skeleton } from "./Skeleton";

/**
 * 결재 상세 페이지 스켈레톤
 * - 헤더 + 문서 내용 + 결재선
 */
export default function ApprovalDetailSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* 문서 내용 */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          {/* 문서 정보 */}
          <div className="border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>

          {/* 지출 내용 테이블 */}
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 p-3 flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border-t border-slate-100 flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          {/* 합계 */}
          <div className="mt-4 flex justify-end gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>

          {/* 사유 */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Skeleton className="h-5 w-16 mb-2" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        {/* 사이드바: 결재선 */}
        <div className="lg:w-[320px] space-y-4">
          {/* 결재 현황 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* 참조/공유 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>

          {/* 첨부파일 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
