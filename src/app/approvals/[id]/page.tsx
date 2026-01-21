"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Printer,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useApprovalDetail, useApprovalAction } from "@/hooks/approvals";
import type { ApprovalLine, ApprovalRequestWithRelations } from "@/types/approval";
import {
  APPROVAL_REQUEST_STATUS_LABELS,
  canApprove,
  canWithdrawRequest,
} from "@/types/approval";
import ApprovalActionModal from "@/components/approvals/ApprovalActionModal";
import ExpenseContentDisplay from "@/components/approvals/ExpenseContentDisplay";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApprovalDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const user = useLoginUser();
  const { approval, isLoading, mutate } = useApprovalDetail(id);
  const { approve, reject, delegate, withdraw, isLoading: isActionLoading } =
    useApprovalAction();

  // UI 상태
  const [showApprovalSummary, setShowApprovalSummary] = useState(true);
  const [showApprovalLine, setShowApprovalLine] = useState(true);
  const [showShareScope, setShowShareScope] = useState(true);
  const [approvalComment, setApprovalComment] = useState("");
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject" | "delegate" | "withdraw" | null;
  }>({ type: null });

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-16 animate-pulse">
          <div className="h-full bg-slate-100 rounded"></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-64 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
          <div className="lg:w-[320px] bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-64 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center">
          <FileText className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">결재 문서를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/approvals")}
            className="mt-3 px-3 py-1.5 text-sm text-blue-600 hover:underline"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 권한 체크
  const canUserApprove = user?.id ? canApprove(approval, user.id) : false;
  const canUserWithdraw = user?.id ? canWithdrawRequest(approval, user.id) : false;

  // 현재 결재자 정보
  const currentLine = approval.lines?.find(
    (line) => line.line_order === approval.current_line_order
  );

  // 액션 핸들러
  const handleAction = async (
    action: "approve" | "reject" | "delegate" | "withdraw",
    data?: { comment?: string; delegatedTo?: string; delegatedReason?: string }
  ) => {
    if (!user?.id) return;

    let result;
    switch (action) {
      case "approve":
        result = await approve(id, user.id, data?.comment);
        break;
      case "reject":
        result = await reject(id, user.id, data?.comment || "");
        break;
      case "delegate":
        result = await delegate(
          id,
          user.id,
          data?.delegatedTo || "",
          data?.delegatedReason
        );
        break;
      case "withdraw":
        result = await withdraw(id, user.id);
        break;
    }

    if (result?.success) {
      setActionModal({ type: null });
      mutate();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 헤더 카드 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/approvals")}
              className="p-1.5 hover:bg-slate-100 rounded"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {approval.category?.name || "기타"}
                </span>
                <StatusBadge status={approval.status} />
              </div>
              <h1 className="text-sm font-bold text-slate-800">{approval.title}</h1>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="p-1.5 hover:bg-slate-100 rounded"
            title="인쇄"
          >
            <Printer className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 space-y-3 sm:space-y-4">
          {/* 결재선 요약 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setShowApprovalSummary(!showApprovalSummary)}
              className="w-full px-4 py-2.5 flex items-center justify-between border-b border-slate-100"
            >
              <span className="text-sm font-medium text-slate-800">결재선 요약</span>
              {showApprovalSummary ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showApprovalSummary && (
              <div className="p-4">
                <ApprovalLinesSummary
                  lines={approval.lines || []}
                  currentLineOrder={approval.current_line_order}
                />
              </div>
            )}
          </div>

          {/* 문서 내용 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* 문서 헤더 */}
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 mb-1">
                {approval.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="text-blue-600">
                  {approval.requester?.name}
                  {approval.requester_department && ` · ${approval.requester_department}`}
                </span>
                <span>•</span>
                <span>
                  {new Date(approval.created_at || "").toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {approval.document_number && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{approval.document_number}</span>
                  </>
                )}
              </div>
            </div>

            {/* 기안 내용 */}
            <div className="p-4">
              {approval.content ? (
                <ExpenseContentDisplay content={approval.content} />
              ) : (
                <p className="text-slate-400 text-sm">내용 없음</p>
              )}

              {/* 첨부파일 */}
              {approval.files && approval.files.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-medium text-slate-500 mb-2">첨부파일</h3>
                  <div className="space-y-1.5">
                    {approval.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-700">
                            {file.file_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                          <a
                            href={file.file_url}
                            download={file.file_name}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="lg:w-[320px] space-y-3 sm:space-y-4">
          {/* 결재선 상세 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-medium text-slate-800">결재선</span>
            </div>

            <div className="p-3 space-y-1">
              {approval.lines
                ?.sort((a, b) => a.line_order - b.line_order)
                .map((line) => (
                  <ApprovalLineItem
                    key={line.id}
                    line={line}
                    isCurrent={line.line_order === approval.current_line_order}
                  />
                ))}
            </div>

            {/* 결재 의견 입력 */}
            {canUserApprove && (
              <div className="px-3 pb-3">
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="결재 의견을 입력하세요"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            )}

            {/* 액션 버튼 */}
            {(canUserApprove || canUserWithdraw) && (
              <div className="px-3 pb-3">
                {canUserApprove && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal({ type: "delegate" })}
                      className="flex-1 px-3 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-colors text-xs"
                    >
                      위임
                    </button>
                    <button
                      onClick={() => setActionModal({ type: "reject" })}
                      className="flex-1 px-3 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-colors text-xs"
                    >
                      반려
                    </button>
                    <button
                      onClick={() => handleAction("approve", { comment: approvalComment })}
                      disabled={isActionLoading}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs disabled:opacity-50"
                    >
                      승인
                    </button>
                  </div>
                )}
                {canUserWithdraw && (
                  <button
                    onClick={() => setActionModal({ type: "withdraw" })}
                    className="w-full mt-2 px-3 py-2 border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors text-xs"
                  >
                    회수
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 공유 범위 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setShowShareScope(!showShareScope)}
              className="w-full px-4 py-2.5 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-800">공유 범위</span>
              {showShareScope ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showShareScope && (
              <div className="px-4 pb-4">
                <div className="flex gap-2 mb-2">
                  <span
                    className={`flex-1 text-center py-1.5 rounded text-xs ${
                      approval.share_setting?.share_scope === "all"
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    전체
                  </span>
                  <span
                    className={`flex-1 text-center py-1.5 rounded text-xs ${
                      approval.share_setting?.share_scope === "partial"
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    일부
                  </span>
                </div>

                {approval.share_setting?.share_scope === "partial" &&
                  approval.shares &&
                  approval.shares.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {approval.shares.map((share) => (
                        <span
                          key={share.id}
                          className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                        >
                          {share.user?.name}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 모달 */}
      <ApprovalActionModal
        isOpen={actionModal.type !== null}
        actionType={actionModal.type}
        isLoading={isActionLoading}
        onClose={() => setActionModal({ type: null })}
        onConfirm={handleAction}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: "bg-slate-50 text-slate-600",
    pending: "bg-blue-50 text-blue-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    withdrawn: "bg-amber-50 text-amber-700",
  }[status] || "bg-slate-50 text-slate-600";

  return (
    <span className={`px-1.5 py-0.5 text-[11px] font-medium rounded ${config}`}>
      {APPROVAL_REQUEST_STATUS_LABELS[status as keyof typeof APPROVAL_REQUEST_STATUS_LABELS] ||
        status}
    </span>
  );
}

function ApprovalLinesSummary({
  lines,
  currentLineOrder,
}: {
  lines: ApprovalLine[];
  currentLineOrder: number;
}) {
  const approvalLines = lines.filter((l) => l.line_type === "approval");
  const referenceLines = lines.filter((l) => l.line_type === "reference");

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-3 py-1.5 text-left font-medium text-slate-500 whitespace-nowrap w-16"></th>
            {approvalLines.map((_, idx) => (
              <th key={idx} className="px-3 py-1.5 text-center font-medium text-slate-500 whitespace-nowrap">
                {idx === 0 ? "기안/승인" : `${idx + 1}차 결재`}
              </th>
            ))}
            {referenceLines.length > 0 && (
              <th className="px-3 py-1.5 text-center font-medium text-slate-500 whitespace-nowrap">참조</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">결재</td>
            {approvalLines.map((line) => (
              <td key={line.id} className="px-3 py-2 text-center">
                {line.status === "approved" ? (
                  <span className="text-blue-600 italic text-base font-serif">Sign</span>
                ) : line.status === "rejected" ? (
                  <span className="text-red-500">반려</span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
            ))}
            {referenceLines.length > 0 && (
              <td className="px-3 py-2 text-center">
                <span className="text-slate-300">-</span>
              </td>
            )}
          </tr>
          <tr>
            <td className="px-3 py-1.5"></td>
            {approvalLines.map((line) => (
              <td key={line.id} className="px-3 py-1.5 text-center">
                <span
                  className={`${
                    line.line_order === currentLineOrder && line.status === "pending"
                      ? "text-blue-600 font-medium"
                      : "text-slate-700"
                  }`}
                >
                  {line.approver?.name}
                </span>
              </td>
            ))}
            {referenceLines.length > 0 && (
              <td className="px-3 py-1.5 text-center">
                <span className="text-slate-700">
                  {referenceLines.map((l) => l.approver?.name).join(", ")}
                </span>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ApproverCell({
  line,
  isCurrent,
  label,
}: {
  line: ApprovalLine;
  isCurrent: boolean;
  label?: string;
}) {
  const statusStyles = {
    pending: isCurrent ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white",
    approved: "border-green-400 bg-green-50",
    rejected: "border-red-400 bg-red-50",
    delegated: "border-amber-400 bg-amber-50",
    skipped: "border-slate-200 bg-slate-50",
  };

  const textStyles = {
    pending: isCurrent ? "text-blue-700" : "text-slate-600",
    approved: "text-green-700",
    rejected: "text-red-700",
    delegated: "text-amber-700",
    skipped: "text-slate-400",
  };

  return (
    <div
      className={`flex flex-col items-center p-3 rounded-xl border-2 min-w-[80px] ${
        statusStyles[line.status] || statusStyles.pending
      }`}
    >
      {label && (
        <span className="text-[10px] text-slate-400 mb-1">{label}</span>
      )}

      {line.status === "approved" ? (
        <div className="relative w-10 h-10 mb-1 flex items-center justify-center">
          <img
            src="/sign.png"
            alt="서명"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div className="absolute inset-0 items-center justify-center" style={{ display: "none" }}>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      ) : line.status === "rejected" ? (
        <XCircle className="w-6 h-6 text-red-500 mb-1" />
      ) : (
        <div className={`w-8 h-8 rounded-full ${isCurrent && line.status === "pending" ? "bg-blue-100" : "bg-slate-100"} flex items-center justify-center mb-1`}>
          <span className={`text-xs font-medium ${textStyles[line.status] || textStyles.pending}`}>
            {line.approver?.name?.charAt(0) || "?"}
          </span>
        </div>
      )}

      <span className={`text-sm font-medium ${textStyles[line.status] || textStyles.pending}`}>
        {line.approver?.name}
      </span>

      {line.acted_at && (
        <span className="text-[10px] text-slate-400 mt-0.5">
          {new Date(line.acted_at).toLocaleDateString("ko-KR", {
            month: "numeric",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}

function ApprovalLineItem({
  line,
  isCurrent,
}: {
  line: ApprovalLine;
  isCurrent: boolean;
}) {
  const typeConfig = {
    approval: { label: "결재", bgColor: "bg-blue-500", textColor: "text-white" },
    review: { label: "검토", bgColor: "bg-indigo-500", textColor: "text-white" },
    reference: { label: "참조", bgColor: "bg-slate-400", textColor: "text-white" },
    agreement: { label: "합의", bgColor: "bg-purple-500", textColor: "text-white" },
  }[line.line_type] || { label: "결재", bgColor: "bg-blue-500", textColor: "text-white" };

  const statusText = {
    pending: isCurrent ? "대기중" : "대기",
    approved: "승인",
    rejected: "반려",
    delegated: "위임됨",
    skipped: "건너뜀",
  }[line.status] || line.status;

  const statusColor = {
    pending: "text-slate-500",
    approved: "text-green-600",
    rejected: "text-red-600",
    delegated: "text-blue-600",
    skipped: "text-slate-400",
  }[line.status] || "text-slate-500";

  return (
    <div className="flex items-center gap-3 py-2">
      {/* 타입 배지 */}
      <span className={`px-2 py-1 text-xs font-medium rounded ${typeConfig.bgColor} ${typeConfig.textColor}`}>
        {typeConfig.label}
      </span>

      {/* 결재자 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${isCurrent && line.status === "pending" ? "text-blue-600" : "text-slate-800"}`}>
            {line.approver?.name}
          </span>
          {line.approver?.position && (
            <span className="text-xs text-slate-500">{line.approver.position}</span>
          )}
        </div>
        {line.approver_team && (
          <span className="text-xs text-slate-400">{line.approver_team}</span>
        )}
      </div>

      {/* 상태 및 시간 */}
      <div className="text-right">
        <span className={`text-xs font-medium ${statusColor}`}>
          {statusText}
        </span>
        {line.acted_at && (
          <p className="text-[10px] text-slate-400">
            {new Date(line.acted_at).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
