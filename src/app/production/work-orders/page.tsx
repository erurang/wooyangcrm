"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ClipboardList, Users, CheckCircle2, Clock, AlertTriangle, XCircle, CalendarClock, TrendingUp } from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useWorkOrders, useMyWorkOrders } from "@/hooks/production/useWorkOrders";
import { useDebounce } from "@/hooks/useDebounce";
import WorkOrderCard from "@/components/production/work-orders/WorkOrderCard";
import WorkOrderFormModal from "@/components/production/work-orders/WorkOrderFormModal";
import WorkOrderDetailModal from "@/components/production/work-orders/WorkOrderDetailModal";
import type { WorkOrderFilter, WorkOrderCreateRequest } from "@/types/production";

type ViewMode = "all" | "my" | "requested";
type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "canceled";

export default function WorkOrdersPage() {
  const user = useLoginUser();

  // View mode & filters
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  // Build filter
  const filters: WorkOrderFilter = {
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    requester_id: viewMode === "requested" ? user?.id : undefined,
    assignee_id: viewMode === "my" ? user?.id : undefined,
  };

  const { workOrders, isLoading, createWorkOrder, refresh } = useWorkOrders(filters);
  const { workOrders: myWorkOrders } = useMyWorkOrders(user?.id);

  // Stats
  const myPendingCount = myWorkOrders.filter(
    (wo) => wo.status !== "completed" && wo.status !== "canceled"
  ).length;

  // 전체 통계 계산
  const stats = {
    total: workOrders.length,
    pending: workOrders.filter((wo) => wo.status === "pending").length,
    inProgress: workOrders.filter((wo) => wo.status === "in_progress").length,
    completed: workOrders.filter((wo) => wo.status === "completed").length,
    canceled: workOrders.filter((wo) => wo.status === "canceled").length,
    overdue: workOrders.filter((wo) => {
      if (wo.status === "completed" || wo.status === "canceled") return false;
      if (!wo.deadline_end) return false;
      const deadline = new Date(wo.deadline_end);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline < today;
    }).length,
    dueToday: workOrders.filter((wo) => {
      if (wo.status === "completed" || wo.status === "canceled") return false;
      if (!wo.deadline_end) return false;
      const deadline = new Date(wo.deadline_end);
      const today = new Date();
      deadline.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return deadline.getTime() === today.getTime();
    }).length,
  };

  const handleCreateWorkOrder = async (data: WorkOrderCreateRequest) => {
    setIsSubmitting(true);
    try {
      await createWorkOrder(data);
      setIsFormModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = (id: string) => {
    setSelectedWorkOrderId(id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">작업지시</h1>
                {myPendingCount > 0 && (
                  <p className="text-xs text-purple-600">
                    내 담당 {myPendingCount}건 진행중
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 작업지시
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { value: "all", label: "전체", icon: ClipboardList },
            { value: "my", label: "내 담당", icon: Users },
            { value: "requested", label: "내가 요청", icon: CheckCircle2 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setViewMode(tab.value as ViewMode)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === tab.value
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
              <option value="canceled">취소됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-slate-700">통계 현황</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 전체 */}
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-500">전체</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{stats.total}</p>
          </div>

          {/* 대기 */}
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">대기</span>
            </div>
            <p className="text-xl font-bold text-slate-600">{stats.pending}</p>
          </div>

          {/* 진행중 */}
          <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-blue-600">진행중</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>

          {/* 완료 */}
          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">완료</span>
            </div>
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          </div>

          {/* 취소됨 */}
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">취소됨</span>
            </div>
            <p className="text-xl font-bold text-slate-400">{stats.canceled}</p>
          </div>

          {/* 오늘 마감 */}
          <div className={`bg-white rounded-lg p-3 border shadow-sm ${stats.dueToday > 0 ? "border-orange-300 bg-orange-50" : "border-slate-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-orange-600">오늘 마감</span>
            </div>
            <p className={`text-xl font-bold ${stats.dueToday > 0 ? "text-orange-600" : "text-slate-400"}`}>
              {stats.dueToday}
            </p>
          </div>

          {/* 기한 초과 */}
          <div className={`bg-white rounded-lg p-3 border shadow-sm ${stats.overdue > 0 ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">기한 초과</span>
            </div>
            <p className={`text-xl font-bold ${stats.overdue > 0 ? "text-red-600" : "text-slate-400"}`}>
              {stats.overdue}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : workOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <ClipboardList className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              작업지시가 없습니다
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {viewMode === "my"
                ? "담당하고 있는 작업지시가 없습니다"
                : viewMode === "requested"
                ? "요청한 작업지시가 없습니다"
                : "새 작업지시를 등록해보세요"}
            </p>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              새 작업지시 등록
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workOrders.map((workOrder, index) => (
              <motion.div
                key={workOrder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <WorkOrderCard
                  workOrder={workOrder}
                  onClick={() => handleCardClick(workOrder.id)}
                  currentUserId={user?.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <WorkOrderFormModal
        isOpen={isFormModalOpen}
        requesterId={user?.id || ""}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateWorkOrder}
        isLoading={isSubmitting}
      />

      {/* Detail Modal */}
      <WorkOrderDetailModal
        isOpen={!!selectedWorkOrderId}
        workOrderId={selectedWorkOrderId}
        currentUserId={user?.id || ""}
        onClose={() => setSelectedWorkOrderId(null)}
        onUpdate={() => {
          refresh();
        }}
        onDelete={() => {
          refresh();
          setSelectedWorkOrderId(null);
        }}
      />
    </div>
  );
}
