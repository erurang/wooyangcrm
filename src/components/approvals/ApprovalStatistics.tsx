"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  FileCheck,
  FileX,
  Files,
  ChevronDown,
  ChevronUp,
  Percent,
  Timer,
  FolderOpen,
} from "lucide-react";
import { useApprovalStatistics, type ApprovalStatistics } from "@/hooks/approvals";

interface ApprovalStatisticsProps {
  userId?: string | null;
  compact?: boolean;
}

// 월 이름 변환
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  return `${month}월`;
}

// 시간 포맷
function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}분`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}시간`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}일 ${remainingHours}시간` : `${days}일`;
}

export default function ApprovalStatisticsComponent({
  userId,
  compact = false,
}: ApprovalStatisticsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [scope, setScope] = useState<"all" | "my">("all");
  const { statistics, isLoading } = useApprovalStatistics(userId, scope);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!statistics) return null;

  const { monthly, categories, processing_time, summary } = statistics;

  // 최근 월 대비 변화율 계산
  const currentMonth = monthly[monthly.length - 1];
  const previousMonth = monthly[monthly.length - 2];
  const monthlyChange = previousMonth && currentMonth
    ? {
        total: previousMonth.approved + previousMonth.rejected + previousMonth.pending > 0
          ? Math.round(
              ((currentMonth.approved + currentMonth.rejected + currentMonth.pending) /
                (previousMonth.approved + previousMonth.rejected + previousMonth.pending) -
                1) *
                100
            )
          : 0,
        approved: previousMonth.approved > 0
          ? Math.round((currentMonth.approved / previousMonth.approved - 1) * 100)
          : 0,
      }
    : { total: 0, approved: 0 };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${
          compact ? "cursor-pointer hover:bg-slate-50" : ""
        }`}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 rounded-lg">
            <BarChart3 className="h-4 w-4 text-sky-600" />
          </div>
          <h3 className="font-semibold text-slate-800">결재 통계</h3>
          <span className="text-xs text-slate-500">(최근 6개월)</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 범위 선택 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScope("all");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                scope === "all"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              전체
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScope("my");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                scope === "my"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              내 결재
            </button>
          </div>
          {compact && (
            <button className="p-1 hover:bg-slate-100 rounded">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              {/* 주요 지표 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 총 건수 */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Files className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">총 건수</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-800">
                      {summary.total}
                    </span>
                    <span className="text-sm text-slate-500">건</span>
                  </div>
                  {monthlyChange.total !== 0 && (
                    <div
                      className={`flex items-center gap-0.5 mt-1 text-xs ${
                        monthlyChange.total > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {monthlyChange.total > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(monthlyChange.total)}% 전월대비</span>
                    </div>
                  )}
                </div>

                {/* 승인율 */}
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">승인율</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-green-700">
                      {summary.approval_rate}
                    </span>
                    <span className="text-sm text-green-600">%</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {summary.approved}건 승인 / {summary.rejected}건 반려
                  </div>
                </div>

                {/* 평균 처리 시간 */}
                <div className="bg-sky-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="h-4 w-4 text-sky-600" />
                    <span className="text-xs text-sky-600">평균 처리시간</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-sky-700">
                      {formatHours(processing_time.avg_hours)}
                    </span>
                  </div>
                  <div className="text-xs text-sky-600 mt-1">
                    최소 {formatHours(processing_time.min_hours)} ~ 최대{" "}
                    {formatHours(processing_time.max_hours)}
                  </div>
                </div>

                {/* 진행중 */}
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-600">진행중</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-orange-700">
                      {summary.pending}
                    </span>
                    <span className="text-sm text-orange-600">건</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    임시저장 {summary.draft}건
                  </div>
                </div>
              </div>

              {/* 월별 추이 차트 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">월별 결재 추이</h4>
                <div className="flex items-end justify-between gap-2 h-32">
                  {monthly.map((item) => {
                    const total = item.approved + item.rejected + item.pending;
                    const maxTotal = Math.max(
                      ...monthly.map((m) => m.approved + m.rejected + m.pending)
                    );
                    const height = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                    const approvedHeight = total > 0 ? (item.approved / total) * height : 0;
                    const rejectedHeight = total > 0 ? (item.rejected / total) * height : 0;
                    const pendingHeight = height - approvedHeight - rejectedHeight;

                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full flex flex-col justify-end rounded-t"
                          style={{ height: "100px" }}
                        >
                          {/* 진행중 (노란색) */}
                          <div
                            className="w-full bg-yellow-400 rounded-t transition-all"
                            style={{ height: `${pendingHeight}%` }}
                          />
                          {/* 승인 (녹색) */}
                          <div
                            className="w-full bg-green-500 transition-all"
                            style={{ height: `${approvedHeight}%` }}
                          />
                          {/* 반려 (빨간색) */}
                          <div
                            className="w-full bg-red-400 rounded-b transition-all"
                            style={{ height: `${rejectedHeight}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{formatMonth(item.month)}</span>
                        <span className="text-xs font-medium text-slate-700">{total}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-xs text-slate-600">승인</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span className="text-xs text-slate-600">반려</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-400" />
                    <span className="text-xs text-slate-600">진행중</span>
                  </div>
                </div>
              </div>

              {/* 카테고리별 통계 */}
              {categories.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">카테고리별 현황</h4>
                  <div className="space-y-2">
                    {categories.slice(0, 5).map((cat) => {
                      const approvedPercent =
                        cat.count > 0 ? Math.round((cat.approved / cat.count) * 100) : 0;

                      return (
                        <div key={cat.category_id} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28">
                            <FolderOpen className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700 truncate">
                              {cat.category_name}
                            </span>
                          </div>
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                              style={{ width: `${approvedPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-600">{cat.count}건</span>
                            <span className="text-green-600 font-medium">
                              {approvedPercent}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
