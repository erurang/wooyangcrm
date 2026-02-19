"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  UserCircle,
  Forward,
  SkipForward,
} from "lucide-react";
import type { ApprovalLine } from "@/types/approval";

interface ApprovalLineTimelineProps {
  lines: ApprovalLine[];
  currentLineOrder: number;
  variant?: "horizontal" | "vertical";
  compact?: boolean;
}

// 상태별 스타일 설정
const statusConfig = {
  pending: {
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    iconColor: "text-slate-400",
    textColor: "text-slate-600",
    icon: Clock,
    label: "대기",
  },
  approved: {
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
    iconColor: "text-green-500",
    textColor: "text-green-700",
    icon: CheckCircle,
    label: "승인",
  },
  rejected: {
    bgColor: "bg-red-50",
    borderColor: "border-red-400",
    iconColor: "text-red-500",
    textColor: "text-red-700",
    icon: XCircle,
    label: "반려",
  },
  delegated: {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
    iconColor: "text-amber-500",
    textColor: "text-amber-700",
    icon: Forward,
    label: "위임",
  },
  skipped: {
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    iconColor: "text-slate-300",
    textColor: "text-slate-400",
    icon: SkipForward,
    label: "건너뜀",
  },
};

// 결재선 타입별 스타일
const lineTypeConfig = {
  approval: { label: "결재", color: "bg-sky-500" },
  review: { label: "검토", color: "bg-sky-500" },
  reference: { label: "참조", color: "bg-slate-400" },
  agreement: { label: "합의", color: "bg-purple-500" },
};

export default function ApprovalLineTimeline({
  lines,
  currentLineOrder,
  variant = "horizontal",
  compact = false,
}: ApprovalLineTimelineProps) {
  const sortedLines = [...lines].sort((a, b) => a.line_order - b.line_order);
  const approvalLines = sortedLines.filter((l) => l.line_type !== "reference");
  const referenceLines = sortedLines.filter((l) => l.line_type === "reference");

  if (variant === "vertical") {
    return (
      <VerticalTimeline
        lines={approvalLines}
        referenceLines={referenceLines}
        currentLineOrder={currentLineOrder}
        compact={compact}
      />
    );
  }

  return (
    <HorizontalTimeline
      lines={approvalLines}
      referenceLines={referenceLines}
      currentLineOrder={currentLineOrder}
      compact={compact}
    />
  );
}

function HorizontalTimeline({
  lines,
  referenceLines,
  currentLineOrder,
  compact,
}: {
  lines: ApprovalLine[];
  referenceLines: ApprovalLine[];
  currentLineOrder: number;
  compact: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* 메인 결재선 */}
      <div className="flex items-center justify-center overflow-x-auto py-2">
        <div className="flex items-center gap-0">
          {lines.map((line, index) => {
            const isCurrent = line.line_order === currentLineOrder && line.status === "pending";
            const config = statusConfig[line.status] || statusConfig.pending;
            const typeConfig = lineTypeConfig[line.line_type] || lineTypeConfig.approval;
            const StatusIcon = config.icon;

            return (
              <div key={line.id} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative flex flex-col items-center
                    ${compact ? "min-w-[70px]" : "min-w-[100px]"}
                  `}
                >
                  {/* 타입 배지 */}
                  <span
                    className={`
                      ${typeConfig.color} text-white text-[10px] font-medium
                      px-1.5 py-0.5 rounded mb-1
                    `}
                  >
                    {typeConfig.label}
                  </span>

                  {/* 원형 노드 */}
                  <div
                    className={`
                      relative flex items-center justify-center
                      ${compact ? "w-12 h-12" : "w-16 h-16"}
                      rounded-full border-2 transition-all duration-300
                      ${config.bgColor} ${config.borderColor}
                      ${isCurrent ? "ring-2 ring-sky-400 ring-offset-2" : ""}
                    `}
                  >
                    {line.status === "approved" ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 font-serif italic text-sm">Sign</span>
                      </div>
                    ) : (
                      <StatusIcon className={`${compact ? "w-5 h-5" : "w-6 h-6"} ${config.iconColor}`} />
                    )}

                    {/* 현재 결재자 표시 */}
                    {isCurrent && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <span className="text-white text-[8px] font-bold">!</span>
                      </motion.div>
                    )}
                  </div>

                  {/* 결재자 이름 */}
                  <div className="mt-1.5 text-center">
                    <p
                      className={`
                        text-xs font-medium
                        ${isCurrent ? "text-sky-600" : config.textColor}
                      `}
                    >
                      {line.approver?.name || "미지정"}
                    </p>
                    {!compact && line.approver?.position && (
                      <p className="text-[10px] text-slate-400">{line.approver.position}</p>
                    )}
                  </div>

                  {/* 처리 시간 */}
                  {line.acted_at && (
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {new Date(line.acted_at).toLocaleDateString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* 상태 라벨 */}
                  <span className={`text-[10px] mt-0.5 ${config.textColor}`}>
                    {config.label}
                  </span>
                </motion.div>

                {/* 연결선 */}
                {index < lines.length - 1 && (
                  <div className={`flex items-center ${compact ? "mx-1" : "mx-2"}`}>
                    <div
                      className={`
                        ${compact ? "w-6" : "w-10"} h-0.5
                        ${
                          lines[index].status === "approved"
                            ? "bg-green-400"
                            : lines[index].status === "rejected"
                            ? "bg-red-400"
                            : "bg-slate-200"
                        }
                      `}
                    />
                    <ArrowRight
                      className={`
                        ${compact ? "w-3 h-3" : "w-4 h-4"}
                        ${
                          lines[index].status === "approved"
                            ? "text-green-400"
                            : lines[index].status === "rejected"
                            ? "text-red-400"
                            : "text-slate-300"
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 참조자 */}
      {referenceLines.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-dashed border-slate-200">
          <span className="text-xs text-slate-400">참조:</span>
          <div className="flex gap-2">
            {referenceLines.map((line) => (
              <div
                key={line.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full border border-slate-200"
              >
                <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{line.approver?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VerticalTimeline({
  lines,
  referenceLines,
  currentLineOrder,
  compact,
}: {
  lines: ApprovalLine[];
  referenceLines: ApprovalLine[];
  currentLineOrder: number;
  compact: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* 메인 결재선 */}
      <div className="relative">
        {lines.map((line, index) => {
          const isCurrent = line.line_order === currentLineOrder && line.status === "pending";
          const config = statusConfig[line.status] || statusConfig.pending;
          const typeConfig = lineTypeConfig[line.line_type] || lineTypeConfig.approval;
          const StatusIcon = config.icon;

          return (
            <motion.div
              key={line.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* 연결선 */}
              {index < lines.length - 1 && (
                <div
                  className={`
                    absolute left-5 top-12 w-0.5 h-[calc(100%-48px)]
                    ${
                      line.status === "approved"
                        ? "bg-green-300"
                        : line.status === "rejected"
                        ? "bg-red-300"
                        : "bg-slate-200"
                    }
                  `}
                />
              )}

              {/* 노드 */}
              <div
                className={`
                  relative flex items-center justify-center shrink-0
                  w-10 h-10 rounded-full border-2
                  ${config.bgColor} ${config.borderColor}
                  ${isCurrent ? "ring-2 ring-sky-400 ring-offset-1" : ""}
                `}
              >
                {line.status === "approved" ? (
                  <span className="text-green-600 font-serif italic text-xs">Sign</span>
                ) : (
                  <StatusIcon className="w-4 h-4" style={{ color: config.iconColor.replace("text-", "") }} />
                )}

                {isCurrent && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-sky-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`
                      ${typeConfig.color} text-white text-[10px] font-medium
                      px-1.5 py-0.5 rounded
                    `}
                  >
                    {typeConfig.label}
                  </span>
                  <span className={`text-xs font-medium ${isCurrent ? "text-sky-600" : "text-slate-800"}`}>
                    {line.approver?.name || "미지정"}
                  </span>
                  {line.approver?.position && (
                    <span className="text-xs text-slate-400">{line.approver.position}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${config.textColor}`}>{config.label}</span>
                  {line.acted_at && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(line.acted_at).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {line.comment && (
                  <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    {line.comment}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 참조자 */}
      {referenceLines.length > 0 && (
        <div className="pt-3 border-t border-dashed border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-400">참조</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {referenceLines.map((line) => (
              <div
                key={line.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-200"
              >
                <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{line.approver?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 진행률 표시 컴포넌트
export function ApprovalProgress({ lines }: { lines: ApprovalLine[] }) {
  const approvalLines = lines.filter((l) => l.line_type !== "reference");
  const completedCount = approvalLines.filter(
    (l) => l.status === "approved" || l.status === "rejected"
  ).length;
  const totalCount = approvalLines.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const hasRejection = approvalLines.some((l) => l.status === "rejected");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">결재 진행률</span>
        <span className={hasRejection ? "text-red-600" : "text-slate-700"}>
          {completedCount}/{totalCount}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${hasRejection ? "bg-red-400" : "bg-green-400"}`}
        />
      </div>
    </div>
  );
}
