"use client";

import { FileText, Clock, CheckCircle, XCircle, Undo2 } from "lucide-react";
import type { ApprovalRequestWithRelations } from "@/types/approval";
import {
  APPROVAL_REQUEST_STATUS_LABELS,
  APPROVAL_LINE_TYPE_LABELS,
} from "@/types/approval";

interface ApprovalListProps {
  approvals: ApprovalRequestWithRelations[];
  isLoading: boolean;
  currentUserId: string;
  onApprovalClick: (id: string) => void;
  onRefresh?: () => void;
}

export default function ApprovalList({
  approvals,
  isLoading,
  currentUserId,
  onApprovalClick,
}: ApprovalListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FileText className="w-12 h-12 mb-4 text-slate-300" />
        <p>결재 문서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {approvals.map((approval) => (
        <ApprovalListItem
          key={approval.id}
          approval={approval}
          currentUserId={currentUserId}
          onClick={() => onApprovalClick(approval.id)}
        />
      ))}
    </div>
  );
}

function ApprovalListItem({
  approval,
  currentUserId,
  onClick,
}: {
  approval: ApprovalRequestWithRelations;
  currentUserId: string;
  onClick: () => void;
}) {
  const statusConfig = getStatusConfig(approval.status);

  // 현재 결재자 찾기
  const currentApprover = approval.lines?.find(
    (line) => line.line_order === approval.current_line_order
  );

  // 내가 결재할 차례인지 확인
  const isMyTurn =
    approval.status === "pending" &&
    currentApprover &&
    (currentApprover.approver_id === currentUserId ||
      currentApprover.delegated_to === currentUserId);

  // 결재 진행률
  const approvedCount =
    approval.lines?.filter((line) => line.status === "approved").length || 0;
  const totalApprovers =
    approval.lines?.filter((line) => line.line_type === "approval").length || 0;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
        isMyTurn ? "bg-blue-50/30 border-l-2 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 상태 아이콘 */}
        <div className={`p-1.5 rounded ${statusConfig.bgColor}`}>
          {statusConfig.icon}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
              {approval.category?.name || "기타"}
            </span>
            {isMyTurn && (
              <span className="text-[11px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                내 결재
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium text-slate-800 truncate">{approval.title}</h3>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>
              {approval.requester?.name || "알 수 없음"}
              {approval.requester_department && ` · ${approval.requester_department}`}
            </span>
            <span>
              {new Date(approval.created_at || "").toLocaleDateString("ko-KR")}
            </span>
          </div>

          {/* 결재선 미니 표시 */}
          {approval.lines && approval.lines.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {approval.lines
                .filter((line) => line.line_type === "approval")
                .map((line, index) => (
                  <div
                    key={line.id}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                      line.status === "approved"
                        ? "bg-green-50 text-green-700"
                        : line.status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : line.line_order === approval.current_line_order
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {line.status === "approved" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {line.status === "rejected" && <XCircle className="w-3 h-3" />}
                    {line.status === "pending" &&
                      line.line_order === approval.current_line_order && (
                        <Clock className="w-3 h-3" />
                      )}
                    <span>{line.approver?.name || `${index + 1}차`}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 상태 배지 */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-0.5 text-[11px] font-medium rounded ${statusConfig.badgeColor}`}
          >
            {APPROVAL_REQUEST_STATUS_LABELS[approval.status]}
          </span>
          {totalApprovers > 0 && approval.status === "pending" && (
            <span className="text-[11px] text-slate-400">
              {approvedCount}/{totalApprovers}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return {
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        bgColor: "bg-blue-50",
        badgeColor: "bg-blue-50 text-blue-700",
      };
    case "approved":
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        bgColor: "bg-green-50",
        badgeColor: "bg-green-50 text-green-700",
      };
    case "rejected":
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        bgColor: "bg-red-50",
        badgeColor: "bg-red-50 text-red-700",
      };
    case "withdrawn":
      return {
        icon: <Undo2 className="w-4 h-4 text-amber-600" />,
        bgColor: "bg-amber-50",
        badgeColor: "bg-amber-50 text-amber-700",
      };
    case "draft":
    default:
      return {
        icon: <FileText className="w-4 h-4 text-slate-600" />,
        bgColor: "bg-slate-50",
        badgeColor: "bg-slate-50 text-slate-700",
      };
  }
}
