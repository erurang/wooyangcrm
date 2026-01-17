"use client";

import { ReactNode } from "react";
import { Search, FileText, Users, Building2, MessageSquare, Plus, UserX, Package } from "lucide-react";

type EmptyStateType = "search" | "data" | "document" | "contact" | "company" | "consultation" | "resign" | "product";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const defaultConfig: Record<EmptyStateType, { icon: ReactNode; title: string; description: string; actionLabel?: string }> = {
  search: {
    icon: <Search className="h-12 w-12 text-gray-300" />,
    title: "검색 결과가 없습니다",
    description: "다른 검색어로 시도해보세요.",
  },
  data: {
    icon: <FileText className="h-12 w-12 text-gray-300" />,
    title: "데이터가 없습니다",
    description: "아직 등록된 데이터가 없습니다.",
  },
  document: {
    icon: <FileText className="h-12 w-12 text-gray-300" />,
    title: "문서가 없습니다",
    description: "첫 번째 문서를 생성해보세요.",
    actionLabel: "문서 추가",
  },
  contact: {
    icon: <Users className="h-12 w-12 text-gray-300" />,
    title: "담당자가 없습니다",
    description: "담당자를 추가하여 관리를 시작하세요.",
    actionLabel: "담당자 추가",
  },
  company: {
    icon: <Building2 className="h-12 w-12 text-gray-300" />,
    title: "거래처가 없습니다",
    description: "새로운 거래처를 등록해보세요.",
    actionLabel: "거래처 추가",
  },
  consultation: {
    icon: <MessageSquare className="h-12 w-12 text-gray-300" />,
    title: "상담 내역이 없습니다",
    description: "첫 번째 상담을 기록해보세요.",
    actionLabel: "상담 추가",
  },
  resign: {
    icon: <UserX className="h-12 w-12 text-gray-300" />,
    title: "퇴사자가 없습니다",
    description: "퇴사자 검색 결과가 없습니다.",
  },
  product: {
    icon: <Package className="h-12 w-12 text-gray-300" />,
    title: "단가 정보가 없습니다",
    description: "검색 조건을 변경해보세요.",
  },
};

/**
 * Empty State 컴포넌트
 * - 데이터 없음 vs 검색 결과 없음 구분
 * - CTA 버튼으로 행동 유도
 *
 * @example
 * // 검색 결과 없음
 * <EmptyState type="search" />
 *
 * // 데이터 없음 + CTA
 * <EmptyState
 *   type="consultation"
 *   onAction={() => setShowAddModal(true)}
 * />
 *
 * // 커스텀
 * <EmptyState
 *   title="할 일이 없습니다"
 *   description="새로운 할 일을 추가해보세요."
 *   actionLabel="할 일 추가"
 *   onAction={handleAddTodo}
 * />
 */
export default function EmptyState({
  type = "data",
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <div className="mb-4">{displayIcon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        {displayDescription}
      </p>
      {displayActionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          {displayActionLabel}
        </button>
      )}
    </div>
  );
}
