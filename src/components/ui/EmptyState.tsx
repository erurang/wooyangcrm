"use client";

import { ReactNode } from "react";
import { Search, FileText, Users, Building2, MessageSquare, Plus, UserX, Package, CalendarX, BarChart2, FolderOpen, Inbox, ShoppingCart } from "lucide-react";

type EmptyStateType =
  | "search"
  | "data"
  | "document"
  | "contact"
  | "company"
  | "consultation"
  | "resign"
  | "product"
  | "notification"
  | "report"
  | "folder"
  | "inbox"
  | "order";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

// SVG 일러스트레이션 컴포넌트
function EmptyIllustration({ type }: { type: EmptyStateType }) {
  const baseClasses = "w-32 h-32 mb-2";

  switch (type) {
    case "search":
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <circle cx="50" cy="50" r="35" fill="#E5E7EB" />
          <circle cx="50" cy="50" r="25" fill="#F3F4F6" />
          <path d="M75 75L95 95" stroke="#9CA3AF" strokeWidth="8" strokeLinecap="round" />
          <path d="M38 45C38 43.8954 38.8954 43 40 43H60C61.1046 43 62 43.8954 62 45C62 46.1046 61.1046 47 60 47H40C38.8954 47 38 46.1046 38 45Z" fill="#D1D5DB" />
          <path d="M43 53C43 51.8954 43.8954 51 45 51H55C56.1046 51 57 51.8954 57 53C57 54.1046 56.1046 55 55 55H45C43.8954 55 43 54.1046 43 53Z" fill="#D1D5DB" />
        </svg>
      );
    case "data":
    case "document":
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <rect x="25" y="15" width="70" height="90" rx="4" fill="#E5E7EB" />
          <rect x="35" y="30" width="40" height="4" rx="2" fill="#D1D5DB" />
          <rect x="35" y="40" width="50" height="4" rx="2" fill="#D1D5DB" />
          <rect x="35" y="50" width="35" height="4" rx="2" fill="#D1D5DB" />
          <rect x="35" y="65" width="50" height="4" rx="2" fill="#D1D5DB" />
          <rect x="35" y="75" width="45" height="4" rx="2" fill="#D1D5DB" />
          <rect x="35" y="85" width="30" height="4" rx="2" fill="#D1D5DB" />
          <circle cx="90" cy="90" r="20" fill="#93C5FD" />
          <path d="M85 90H95M90 85V95" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "contact":
    case "company":
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="45" r="20" fill="#E5E7EB" />
          <path d="M30 95C30 77.3269 44.3269 63 62 63C79.6731 63 94 77.3269 94 95" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
          <circle cx="60" cy="45" r="12" fill="#D1D5DB" />
          <circle cx="90" cy="90" r="18" fill="#93C5FD" />
          <path d="M85 90H95M90 85V95" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "consultation":
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <rect x="15" y="25" width="65" height="50" rx="8" fill="#E5E7EB" />
          <path d="M15 65L30 75V65H15Z" fill="#E5E7EB" />
          <rect x="25" y="40" width="35" height="4" rx="2" fill="#D1D5DB" />
          <rect x="25" y="50" width="45" height="4" rx="2" fill="#D1D5DB" />
          <rect x="25" y="60" width="25" height="4" rx="2" fill="#D1D5DB" />
          <rect x="50" y="45" width="55" height="45" rx="8" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <path d="M105 80L90 90V80H105Z" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="60" y="55" width="30" height="4" rx="2" fill="#D1D5DB" />
          <rect x="60" y="65" width="35" height="4" rx="2" fill="#D1D5DB" />
        </svg>
      );
    case "inbox":
    case "notification":
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <rect x="20" y="35" width="80" height="60" rx="4" fill="#E5E7EB" />
          <path d="M20 45L60 70L100 45" stroke="#D1D5DB" strokeWidth="4" />
          <path d="M20 35L60 60L100 35" stroke="#D1D5DB" strokeWidth="4" />
          <circle cx="90" cy="35" r="15" fill="#93C5FD" />
          <text x="90" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">0</text>
        </svg>
      );
    default:
      return (
        <svg className={baseClasses} viewBox="0 0 120 120" fill="none">
          <rect x="25" y="25" width="70" height="70" rx="8" fill="#E5E7EB" />
          <circle cx="60" cy="55" r="15" fill="#D1D5DB" />
          <rect x="45" y="75" width="30" height="4" rx="2" fill="#D1D5DB" />
        </svg>
      );
  }
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
  notification: {
    icon: <Inbox className="h-12 w-12 text-gray-300" />,
    title: "알림이 없습니다",
    description: "새로운 알림이 오면 여기에 표시됩니다.",
  },
  report: {
    icon: <BarChart2 className="h-12 w-12 text-gray-300" />,
    title: "표시할 데이터가 없습니다",
    description: "기간이나 필터 조건을 변경해보세요.",
  },
  folder: {
    icon: <FolderOpen className="h-12 w-12 text-gray-300" />,
    title: "폴더가 비어있습니다",
    description: "파일을 추가하여 시작하세요.",
    actionLabel: "파일 추가",
  },
  inbox: {
    icon: <Inbox className="h-12 w-12 text-gray-300" />,
    title: "받은 항목이 없습니다",
    description: "새로운 항목이 도착하면 여기에 표시됩니다.",
  },
  order: {
    icon: <ShoppingCart className="h-12 w-12 text-gray-300" />,
    title: "주문 내역이 없습니다",
    description: "새 주문을 등록해보세요.",
    actionLabel: "주문 추가",
  },
};

/**
 * Empty State 컴포넌트
 * - 데이터 없음 vs 검색 결과 없음 구분
 * - CTA 버튼으로 행동 유도
 * - SVG 일러스트레이션 포함
 *
 * @example
 * // 검색 결과 없음 (일러스트 포함)
 * <EmptyState type="search" />
 *
 * // 데이터 없음 + CTA
 * <EmptyState
 *   type="consultation"
 *   onAction={() => setShowAddModal(true)}
 * />
 *
 * // 컴팩트 모드 (작은 공간용)
 * <EmptyState type="data" compact />
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
  compact = false,
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  // compact 모드에서는 아이콘, 기본 모드에서는 일러스트레이션
  const renderVisual = () => {
    if (icon) return <div className="mb-4">{icon}</div>;
    if (compact) return <div className="mb-3">{config.icon}</div>;
    return <EmptyIllustration type={type} />;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? "py-8 px-4" : "py-16 px-4"
      } ${className}`}
    >
      {renderVisual()}
      <h3 className={`font-medium text-gray-900 ${compact ? "text-base mb-1" : "text-lg mb-2"}`}>
        {displayTitle}
      </h3>
      <p className={`text-gray-500 text-center max-w-sm ${compact ? "text-xs mb-4" : "text-sm mb-6"}`}>
        {displayDescription}
      </p>
      {displayActionLabel && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
          }`}
        >
          <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {displayActionLabel}
        </button>
      )}
    </div>
  );
}
