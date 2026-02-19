"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  List,
} from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { useLoginUser } from "@/context/login";
import {
  useApprovals,
  useApprovalCategories,
  useApprovalSummary,
} from "@/hooks/approvals";
import ApprovalList from "@/components/approvals/ApprovalList";
import ApprovalFilters from "@/components/approvals/ApprovalFilters";
import ApprovalFormModal from "@/components/approvals/ApprovalFormModal";
import ApprovalStatistics from "@/components/approvals/ApprovalStatistics";
import type { ApprovalListTab, ApprovalFilters as FilterType } from "@/types/approval";

const TABS: { id: ApprovalListTab; label: string; icon: React.ReactNode }[] = [
  { id: "pending", label: "결재 대기", icon: <Clock className="w-4 h-4" /> },
  { id: "requested", label: "내가 기안", icon: <Send className="w-4 h-4" /> },
  { id: "approved", label: "완료 문서", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "reference", label: "참조 문서", icon: <Eye className="w-4 h-4" /> },
  { id: "all", label: "전체", icon: <FileText className="w-4 h-4" /> },
];

export default function ApprovalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터
  const urlTab = (searchParams.get("tab") as ApprovalListTab) || "pending";
  const urlPage = Number(searchParams.get("page") || "1");
  const urlCategory = searchParams.get("category") || "";
  const urlKeyword = searchParams.get("keyword") || "";

  // 상태
  const [currentTab, setCurrentTab] = useState<ApprovalListTab>(urlTab);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [filters, setFilters] = useState<FilterType>({
    category_id: urlCategory || undefined,
    keyword: urlKeyword || undefined,
  });
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL 동기화
  useEffect(() => {
    setCurrentTab(urlTab);
    setCurrentPage(urlPage);
    setFilters({
      category_id: urlCategory || undefined,
      keyword: urlKeyword || undefined,
    });
  }, [urlTab, urlPage, urlCategory, urlKeyword]);

  // 데이터 훅
  const { categories } = useApprovalCategories();
  const { summary } = useApprovalSummary(user?.id || null);
  const { approvals, total, totalPages, isLoading, mutate } = useApprovals({
    tab: currentTab,
    userId: user?.id,
    filters,
    page: currentPage,
    limit: itemsPerPage,
  });

  // URL 업데이트
  const updateUrl = (params: {
    tab?: ApprovalListTab;
    page?: number;
    category?: string;
    keyword?: string;
  }) => {
    const urlParams = new URLSearchParams();
    const tab = params.tab ?? currentTab;
    const page = params.page ?? currentPage;
    const category = params.category ?? filters.category_id;
    const keyword = params.keyword ?? filters.keyword;

    if (tab !== "pending") urlParams.set("tab", tab);
    if (page > 1) urlParams.set("page", page.toString());
    if (category) urlParams.set("category", category);
    if (keyword) urlParams.set("keyword", keyword);

    const newUrl = `/approvals${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 핸들러
  const handleTabChange = (tab: ApprovalListTab) => {
    setCurrentTab(tab);
    setCurrentPage(1);
    updateUrl({ tab, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl({
      category: newFilters.category_id,
      keyword: newFilters.keyword,
      page: 1,
    });
  };

  const handleApprovalClick = (id: string) => {
    router.push(`/approvals/${id}`);
  };

  const handleNewApproval = () => {
    setIsModalOpen(true);
  };

  const handleModalSuccess = (id: string) => {
    mutate();
    router.push(`/approvals/${id}`);
  };

  // 탭별 카운트
  const getTabCount = (tab: ApprovalListTab): number | undefined => {
    if (!summary) return undefined;
    switch (tab) {
      case "pending":
        return summary.pending_count;
      case "requested":
        return summary.requested_count;
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 요약 카드 */}
        {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="결재 대기"
            value={summary.pending_count}
            iconBg="bg-amber-100"
            onClick={() => handleTabChange("pending")}
            isActive={currentTab === "pending"}
          />
          <SummaryCard
            icon={<Send className="w-5 h-5 text-sky-600" />}
            label="내가 기안"
            value={summary.requested_count}
            iconBg="bg-sky-100"
            onClick={() => handleTabChange("requested")}
            isActive={currentTab === "requested"}
          />
          <SummaryCard
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            label="이번 달 승인"
            value={summary.approved_count}
            iconBg="bg-green-100"
            onClick={() => handleTabChange("approved")}
            isActive={currentTab === "approved"}
          />
          <SummaryCard
            icon={<XCircle className="w-5 h-5 text-red-600" />}
            label="이번 달 반려"
            value={summary.rejected_count}
            iconBg="bg-red-100"
          />
        </div>
      )}

      {/* 결재 통계 */}
      <ApprovalStatistics userId={user?.id} compact />

      {/* 필터 및 탭 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* 탭 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4">
          <div className="flex overflow-x-auto -mb-px">
            {TABS.map((tab) => {
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    currentTab === tab.id
                      ? "border-sky-600 text-sky-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                        currentTab === tab.id
                          ? "bg-sky-100 text-sky-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleNewApproval}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 결재
          </button>
        </div>

        {/* 필터 */}
        <ApprovalFilters
          categories={categories}
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* 테이블 컨트롤 */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100">
          <div className="text-sm text-slate-500">
            총 <span className="font-semibold text-sky-600">{total}</span>개 문서
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">표시:</span>
            <div className="min-w-[80px]">
              <HeadlessSelect
                value={String(itemsPerPage)}
                onChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: "10", label: "10개" },
                  { value: "20", label: "20개" },
                  { value: "30", label: "30개" },
                  { value: "50", label: "50개" },
                ]}
                placeholder="20개"
                icon={<List className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        {/* 결재 목록 */}
        <ApprovalList
          approvals={approvals}
          isLoading={isLoading}
          currentUserId={user?.id || ""}
          onApprovalClick={handleApprovalClick}
          onRefresh={mutate}
        />

        {/* 페이지네이션 */}
        {!isLoading && approvals.length > 0 && totalPages > 1 && (
          <div className="flex justify-center gap-1 py-3 border-t border-slate-100">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              이전
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 text-xs rounded ${
                    currentPage === pageNum
                      ? "bg-sky-600 text-white"
                      : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
      </motion.div>

      {/* 새 결재 모달 */}
      <ApprovalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  iconBg,
  onClick,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconBg: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border shadow-sm p-3 transition-all ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${isActive ? "border-sky-300 ring-1 ring-sky-100" : "border-slate-200"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
