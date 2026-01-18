"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  CheckCircle,
  ListTodo,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Clock,
  Package,
  X,
} from "lucide-react";
import DateFilterCard from "../DateFilterCard";
import KPISummaryCards from "../KPISummaryCards";
import SalesComparisonChart from "../SalesComparisonChart";
import TopCompaniesCard from "../TopCompaniesCard";
import ExpiringDocumentsCard from "../ExpiringDocumentsCard";
import ExpiringDocumentsModal from "../ExpiringDocumentsModal";
import QuickMemoCard from "../QuickMemoCard";
import TodoModal from "../TodoModal";
import { useKPISummary } from "@/hooks/dashboard/useKPISummary";
import { useYearlyComparison } from "@/hooks/dashboard/useYearlyComparison";
import { useExpiringDocuments } from "@/hooks/dashboard/useExpiringDocuments";
import { useQuickMemo } from "@/hooks/dashboard/useQuickMemo";
import { useLoginUser } from "@/context/login";
import { useDashboard } from "@/context/dashboard";
import { useTodos } from "@/hooks/dashboard/useTodos";
import { HomeTodoCard } from "../HomeTodoCard";
import { ConsultationCard } from "../ConsultationCard";
import type {
  DashboardUserData,
  DashboardConsultation,
} from "@/types/dashboard";

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface DashboardTabProps {
  documentsDetails: DashboardUserData[] | null;
}

export default function DashboardTab({ documentsDetails }: DashboardTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightDocId = searchParams.get("highlight");
  const loginUser = useLoginUser();
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
  const [dismissedOrderAlert, setDismissedOrderAlert] = useState(false);

  // loginUser가 로드될 때까지 안정적으로 userId 사용
  const userId = loginUser?.id;

  const { kpiData, isLoading: kpiLoading } = useKPISummary(userId);
  const {
    todos,
    isLoading: todosLoading,
    isAdding: todosAdding,
    deletingTodoId,
    addTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    updateTodoOrder,
  } = useTodos(userId || "");
  const { data: yearlyData, isLoading: yearlyLoading } = useYearlyComparison(
    userId
  );
  const { estimates: expiringEstimates, orders: expiringOrders, isLoading: expiringLoading } =
    useExpiringDocuments(userId);
  const {
    memo,
    saveMemo,
    isLoading: memoLoading,
    isSaving: memoSaving,
  } = useQuickMemo(userId);
  const {
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
    clientAnalysisData,
  } = useDashboard();

  // loginUser가 아직 로드되지 않았으면 로딩 표시
  if (!loginUser) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
          <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-64 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-64 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-48 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-48 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 미완료 할 일 (최대 4개)
  const incompleteTodos =
    (todos as Todo[] | undefined)
      ?.filter((todo: Todo) => !todo.is_completed)
      .slice(0, 4) || [];
  const totalIncompleteTodos =
    (todos as Todo[] | undefined)?.filter((todo: Todo) => !todo.is_completed)
      .length || 0;

  // 긴급 문서 (3일 이내 + 기한 초과) - 견적서 + 발주서 통합
  const allUrgentDocs = [
    ...expiringEstimates.filter(doc => doc.days_remaining <= 3),
    ...expiringOrders.filter(doc => doc.days_remaining <= 3),
  ].sort((a, b) => a.days_remaining - b.days_remaining);
  const overdueDocs = allUrgentDocs.filter(doc => doc.days_remaining < 0);
  const upcomingDocs = allUrgentDocs.filter(doc => doc.days_remaining >= 0);

  return (
    <div className="space-y-4">
      {/* 긴급 문서 알림 배너 (견적서 + 발주서) */}
      {!dismissedOrderAlert && allUrgentDocs.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {overdueDocs.length > 0 && upcomingDocs.length > 0
                    ? `기한 초과 ${overdueDocs.length}건 / 임박 ${upcomingDocs.length}건`
                    : overdueDocs.length > 0
                    ? `기한 초과 문서 ${overdueDocs.length}건`
                    : `기한 임박 문서 ${upcomingDocs.length}건`}
                </h3>
                <p className="text-xs text-red-600 mt-0.5">
                  {overdueDocs.length > 0
                    ? "기한이 지났거나 3일 이내인 문서입니다. 확인이 필요합니다."
                    : "아래 문서의 기한이 3일 이내입니다. 확인이 필요합니다."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allUrgentDocs.slice(0, 5).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => router.push(`/documents/review?highlight=${doc.id}`)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        doc.days_remaining < 0
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span className="font-semibold">
                        {doc.days_remaining < 0
                          ? `${Math.abs(doc.days_remaining)}일 초과`
                          : doc.days_remaining === 0
                          ? "오늘"
                          : doc.days_remaining === 1
                          ? "내일"
                          : `${doc.days_remaining}일 후`}
                      </span>
                      <span className={doc.days_remaining < 0 ? "text-red-200" : "text-red-500"}>|</span>
                      <span className={doc.days_remaining < 0 ? "" : "text-blue-600"}>
                        {doc.type === "estimate" ? "[견적]" : "[발주]"}
                      </span>
                      <span>{doc.company_name}</span>
                      <span className={doc.days_remaining < 0 ? "text-red-200" : "text-red-400"}>({doc.document_number})</span>
                    </button>
                  ))}
                  {allUrgentDocs.length > 5 && (
                    <button
                      onClick={() => setIsExpiringModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 rounded-lg text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                    >
                      +{allUrgentDocs.length - 5}건 더보기
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissedOrderAlert(true)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
              title="알림 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 첫 번째 줄: 기간 선택 + KPI 카드 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <DateFilterCard
            dateFilter={dateFilter}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            selectedMonth={selectedMonth}
            onDateFilterChange={setDateFilter}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onMonthChange={setSelectedMonth}
          />
          {/* 나의 성과지표 버튼 */}
          <button
            onClick={() => router.push(`/reports/performance/${userId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            나의 성과지표
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="hidden md:block w-px h-8 bg-slate-200" />
          <KPISummaryCards
            todayConsultations={kpiData.todayConsultations}
            pendingDocuments={kpiData.pendingDocuments}
            monthSales={kpiData.monthSales}
            previousMonthSales={kpiData.previousMonthSales}
            monthPurchases={kpiData.monthPurchases}
            previousMonthPurchases={kpiData.previousMonthPurchases}
            followUpNeeded={kpiData.followUpNeeded}
            expiringDocuments={kpiData.expiringDocuments}
            isLoading={kpiLoading}
            compact
          />
        </div>
      </div>

      {/* 두 번째 줄: 매출 차트 + 주요 거래처 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {yearlyData ? (
            <SalesComparisonChart
              months={yearlyData.months}
              currentYear={yearlyData.currentYear}
              previousYear={yearlyData.previousYear}
              isLoading={yearlyLoading}
            />
          ) : (
            <SalesComparisonChart
              months={[]}
              currentYear={{
                year: new Date().getFullYear(),
                sales: [],
                purchases: [],
              }}
              previousYear={{
                year: new Date().getFullYear() - 1,
                sales: [],
                purchases: [],
              }}
              isLoading={yearlyLoading}
            />
          )}
        </div>
        <div>
          <TopCompaniesCard
            clientAnalysisData={clientAnalysisData || []}
            isLoading={!clientAnalysisData}
          />
        </div>
      </div>

      {/* 세 번째 줄: 상담 현황 + 최근 문서 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 text-indigo-600 mr-2" />
                <h2 className="text-sm font-semibold text-slate-800">
                  상담 현황
                </h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/consultation")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                전체보기
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>

            {documentsDetails && documentsDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {documentsDetails.flatMap((userObj: DashboardUserData) =>
                  userObj.consultations
                    .slice(0, 4)
                    .map((consultation: DashboardConsultation) => (
                      <ConsultationCard
                        key={consultation.consultation_id}
                        consultation={consultation}
                        highlightDocId={highlightDocId}
                      />
                    ))
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-slate-500">
                <MessageSquare className="h-5 w-5 text-indigo-300 mb-1" />
                <p className="text-sm">상담 내역이 없습니다</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <ExpiringDocumentsCard
            estimates={expiringEstimates}
            orders={expiringOrders}
            isLoading={expiringLoading}
            onViewAll={() => setIsExpiringModalOpen(true)}
          />
        </div>
      </div>

      {/* 네 번째 줄: 할 일 + 빠른 메모 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <ListTodo className="h-4 w-4 text-violet-600 mr-2" />
                <h2 className="text-sm font-semibold text-slate-800">할 일</h2>
                {totalIncompleteTodos > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                    {totalIncompleteTodos}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsTodoModalOpen(true)}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center"
              >
                전체보기
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>

            {todosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-lg p-3 animate-pulse h-20"
                  >
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : incompleteTodos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {incompleteTodos.map((todo) => (
                  <HomeTodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-500">
                <CheckCircle className="h-4 w-4 text-violet-400 mr-2" />
                <p className="text-sm">모든 할 일을 완료했습니다!</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <QuickMemoCard
            memo={memo}
            onSave={saveMemo}
            isLoading={memoLoading}
            isSaving={memoSaving}
          />
        </div>
      </div>

      {/* Todo 모달 */}
      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        todos={(todos as Todo[]) || []}
        isLoading={todosLoading}
        isAdding={todosAdding}
        deletingTodoId={deletingTodoId}
        onAddTodo={addTodo}
        onUpdateTodo={updateTodo}
        onToggleComplete={toggleComplete}
        onDeleteTodo={deleteTodo}
        onUpdateOrder={updateTodoOrder}
      />

      {/* 임박 문서 모달 */}
      <ExpiringDocumentsModal
        isOpen={isExpiringModalOpen}
        onClose={() => setIsExpiringModalOpen(false)}
        estimates={expiringEstimates}
        orders={expiringOrders}
        isLoading={expiringLoading}
      />
    </div>
  );
}
