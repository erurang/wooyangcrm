"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ChevronLeft,
  FileText,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MessageSquare,
  User,
  Target,
  Activity,
  Star,
  ChevronRight,
} from "lucide-react";

import { useCompanyDetails } from "@/hooks/consultations/useCompanyDetails";
import { useCompanyStats } from "@/hooks/companies/useCompanyStats";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useCompanySalesSummaryDetail } from "@/hooks/reports/customers/useCompanySalesSummaryDetail";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type TabType = "overview" | "trends" | "products" | "documents" | "contacts";

interface Contact {
  id: string;
  contact_name: string;
  department?: string;
  level?: string;
  mobile?: string;
  email?: string;
  resign?: boolean;
}

export default function CompanyDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const companyId = Array.isArray(id) ? id[0] : id || "";

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">("year");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 날짜 계산
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    startDate = `${selectedYear}-${String((selectedQuarter - 1) * 3 + 1).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedQuarter * 3, 0).toISOString().split("T")[0];
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];
  }

  // 데이터 가져오기
  const { companyDetail: company, isLoading: isCompanyLoading } = useCompanyDetails(companyId);
  const { stats, isLoading: isStatsLoading } = useCompanyStats({ companyId });
  const { contacts } = useContactsByCompany([companyId]);
  const { companySalesSummary, isLoading: isSalesLoading } = useCompanySalesSummaryDetail(companyId, startDate, endDate);

  const isLoading = isCompanyLoading || isStatsLoading;

  // 기간 라벨
  const getPeriodLabel = () => {
    if (dateFilter === "year") return `${selectedYear}년`;
    if (dateFilter === "quarter") return `${selectedYear}년 ${selectedQuarter}분기`;
    return `${selectedYear}년 ${selectedMonth}월`;
  };

  // 차트 컬러
  const chartColors = {
    sales: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
    purchase: ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
    primary: "#14b8a6",
    secondary: "#f97316",
  };

  // 탭 설정
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "개요", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "trends", label: "추이", icon: <Activity className="h-4 w-4" /> },
    { id: "products", label: "품목", icon: <Package className="h-4 w-4" /> },
    { id: "documents", label: "문서", icon: <FileText className="h-4 w-4" /> },
    { id: "contacts", label: "담당자", icon: <Users className="h-4 w-4" /> },
  ];

  // 변화율 렌더링
  const renderChange = (change: number | null, size: "sm" | "md" = "sm") => {
    if (change === null) return <span className="text-slate-400">-</span>;
    const textSize = size === "sm" ? "text-xs" : "text-sm";
    if (change > 0) {
      return (
        <span className={`flex items-center gap-0.5 text-emerald-600 ${textSize}`}>
          <ArrowUpRight className="w-3 h-3" />
          {change.toFixed(1)}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className={`flex items-center gap-0.5 text-red-500 ${textSize}`}>
          <ArrowDownRight className="w-3 h-3" />
          {Math.abs(change).toFixed(1)}%
        </span>
      );
    }
    return (
      <span className={`flex items-center gap-0.5 text-slate-400 ${textSize}`}>
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  };

  // 월별 트렌드 차트 데이터
  const monthlyChartData = useMemo(() => {
    if (!stats?.monthlyData) return { categories: [], sales: [], purchases: [] };
    return {
      categories: stats.monthlyData.map((d) => d.month),
      sales: stats.monthlyData.map((d) => d.estimateAmount),
      purchases: stats.monthlyData.map((d) => d.orderAmount),
    };
  }, [stats?.monthlyData]);

  // 품목 차트 데이터
  const getProductChartData = (items: { name: string; total: number }[]) => {
    const sorted = [...items].sort((a, b) => b.total - a.total);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);
    return {
      labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(Boolean),
      data: [...top5.map((c) => c.total), otherTotal > 0 ? otherTotal : 0].filter((v) => v > 0),
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* 거래처 기본 정보 */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/reports/customers")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-1"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">{company?.name}</h1>
                  {company?.is_overseas && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      해외
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                  {company?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </span>
                  )}
                  {company?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {company.email}
                    </span>
                  )}
                  {company?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {company.address}
                    </span>
                  )}
                  {company?.website && (
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-teal-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      웹사이트
                    </a>
                  )}
                </div>
                {stats?.summary && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    거래 기간: {stats.summary.tradingDays}일
                    {stats.summary.firstTransactionDate && (
                      <span>
                        ({new Date(stats.summary.firstTransactionDate).toLocaleDateString("ko-KR")} ~{" "}
                        {stats.summary.lastTransactionDate
                          ? new Date(stats.summary.lastTransactionDate).toLocaleDateString("ko-KR")
                          : "현재"}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 기간 필터 */}
          <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
            <select
              className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as "year" | "quarter" | "month")}
            >
              <option value="year">연간</option>
              <option value="quarter">분기</option>
              <option value="month">월간</option>
            </select>
            {dateFilter === "quarter" && (
              <select
                className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    {q}분기
                  </option>
                ))}
              </select>
            )}
            {dateFilter === "month" && (
              <select
                className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 핵심 KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">총 매출</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              {((stats?.summary?.totalSales || 0) / 10000).toLocaleString()}
              <span className="text-xs font-normal ml-1">만원</span>
            </p>
            {stats?.yoyComparison && renderChange(stats.yoyComparison.sales.change)}
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">총 매입</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {((stats?.summary?.totalPurchases || 0) / 10000).toLocaleString()}
              <span className="text-xs font-normal ml-1">만원</span>
            </p>
            {stats?.yoyComparison && renderChange(stats.yoyComparison.purchases.change)}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">견적서</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {stats?.documentStats?.estimate?.total || 0}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
            <span className="text-xs text-blue-500">
              완료 {stats?.documentStats?.estimate?.completed || 0}건
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">발주서</span>
            </div>
            <p className="text-lg font-bold text-purple-600">
              {stats?.documentStats?.order?.total || 0}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
            <span className="text-xs text-purple-500">
              완료 {stats?.documentStats?.order?.completed || 0}건
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">상담</span>
            </div>
            <p className="text-lg font-bold text-amber-600">
              {stats?.summary?.totalConsultations || 0}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
            <span className="text-xs text-amber-500">
              팔로업 {stats?.summary?.followUpNeeded || 0}건
            </span>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">전환율</span>
            </div>
            <p className="text-lg font-bold text-teal-600">
              {((stats?.summary?.conversionRate || 0) * 100).toFixed(1)}
              <span className="text-xs font-normal ml-1">%</span>
            </p>
            <span className="text-xs text-teal-500">견적 → 완료</span>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 mb-6">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 연도별 비교 */}
          {stats?.yoyComparison && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-500" />
                연도별 비교 (YoY)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">{stats.yoyComparison.prevYear}년 매출</p>
                    <p className="text-lg font-bold text-slate-700">
                      {(stats.yoyComparison.sales.previous / 10000).toLocaleString()}만원
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{stats.yoyComparison.currentYear}년 매출</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {(stats.yoyComparison.sales.current / 10000).toLocaleString()}만원
                    </p>
                  </div>
                  <div className="ml-2">{renderChange(stats.yoyComparison.sales.change, "md")}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">{stats.yoyComparison.prevYear}년 매입</p>
                    <p className="text-lg font-bold text-slate-700">
                      {(stats.yoyComparison.purchases.previous / 10000).toLocaleString()}만원
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{stats.yoyComparison.currentYear}년 매입</p>
                    <p className="text-lg font-bold text-red-600">
                      {(stats.yoyComparison.purchases.current / 10000).toLocaleString()}만원
                    </p>
                  </div>
                  <div className="ml-2">{renderChange(stats.yoyComparison.purchases.change, "md")}</div>
                </div>
              </div>
            </div>
          )}

          {/* 담당 영업사원 */}
          {stats?.userActivity && stats.userActivity.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                담당 영업사원
              </h3>
              <div className="space-y-3">
                {stats.userActivity.slice(0, 5).map((user, idx) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">
                          문서 {user.documents}건 · 상담 {user.consultations}건
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-indigo-600">
                      {(user.totalAmount / 10000).toLocaleString()}만원
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최근 문서 */}
          {stats?.recentDocuments && stats.recentDocuments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                최근 문서
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">문서번호</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">유형</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">상태</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">금액</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">일자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.recentDocuments.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{doc.document_number}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              doc.type === "estimate"
                                ? "bg-blue-100 text-blue-700"
                                : doc.type === "order"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {doc.type === "estimate" ? "견적" : doc.type === "order" ? "발주" : "의뢰"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              doc.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : doc.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {doc.status === "completed" ? "완료" : doc.status === "pending" ? "대기" : "취소"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {doc.total_amount?.toLocaleString()}원
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {doc.date ? new Date(doc.date).toLocaleDateString("ko-KR") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "trends" && (
        <div className="grid grid-cols-1 gap-6">
          {/* 월별 추이 차트 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              월별 매출/매입 추이
            </h3>
            {monthlyChartData.categories.length > 0 ? (
              <ReactApexChart
                options={{
                  chart: { type: "area", toolbar: { show: true }, zoom: { enabled: true } },
                  xaxis: { categories: monthlyChartData.categories },
                  yaxis: {
                    labels: {
                      formatter: (val: number) => `${(val / 10000).toLocaleString()}만`,
                    },
                  },
                  colors: [chartColors.primary, chartColors.secondary],
                  stroke: { curve: "smooth", width: 2 },
                  fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
                  tooltip: {
                    y: { formatter: (val: number) => `${val.toLocaleString()}원` },
                  },
                  legend: { position: "top" },
                  grid: { borderColor: "#e2e8f0" },
                }}
                series={[
                  { name: "매출", data: monthlyChartData.sales },
                  { name: "매입", data: monthlyChartData.purchases },
                ]}
                type="area"
                height={350}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-slate-400">
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* 분기별 비교 */}
          {stats?.quarterlyData && stats.quarterlyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                분기별 비교
              </h3>
              <ReactApexChart
                options={{
                  chart: { type: "bar", toolbar: { show: false } },
                  xaxis: { categories: stats.quarterlyData.map((q) => q.quarter) },
                  yaxis: {
                    labels: {
                      formatter: (val: number) => `${(val / 10000).toLocaleString()}만`,
                    },
                  },
                  colors: [chartColors.primary, chartColors.secondary],
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                  dataLabels: { enabled: false },
                  legend: { position: "top" },
                  grid: { borderColor: "#e2e8f0" },
                }}
                series={[
                  { name: "매출", data: stats.quarterlyData.map((q) => q.sales) },
                  { name: "매입", data: stats.quarterlyData.map((q) => q.purchases) },
                ]}
                type="bar"
                height={300}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 매출 품목 파이 차트 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              매출 품목 비중 ({getPeriodLabel()})
            </h3>
            {companySalesSummary?.sales_items?.length > 0 ? (
              <ReactApexChart
                options={{
                  labels: getProductChartData(companySalesSummary.sales_items).labels,
                  colors: chartColors.sales,
                  legend: { position: "bottom", fontSize: "12px" },
                  tooltip: { y: { formatter: (val: number) => `${val.toLocaleString()}원` } },
                }}
                series={getProductChartData(companySalesSummary.sales_items).data}
                type="pie"
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-400">
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* 매입 품목 파이 차트 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              매입 품목 비중 ({getPeriodLabel()})
            </h3>
            {companySalesSummary?.purchase_items?.length > 0 ? (
              <ReactApexChart
                options={{
                  labels: getProductChartData(companySalesSummary.purchase_items).labels,
                  colors: chartColors.purchase,
                  legend: { position: "bottom", fontSize: "12px" },
                  tooltip: { y: { formatter: (val: number) => `${val.toLocaleString()}원` } },
                }}
                series={getProductChartData(companySalesSummary.purchase_items).data}
                type="pie"
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-400">
                데이터가 없습니다
              </div>
            )}
          </div>

          {/* Top 품목 리스트 */}
          {stats?.topProducts && stats.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                주요 거래 품목 (전체 기간)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">품명</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">규격</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">거래 횟수</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">총 수량</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">총 금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.topProducts.map((product, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{product.spec || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                            {product.count}회
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {product.totalQuantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-teal-600">
                          {product.totalAmount.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 견적서 통계 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">견적서</h3>
                <p className="text-xs text-slate-500">Estimate</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">총 건수</span>
                <span className="font-bold text-slate-800">{stats?.documentStats?.estimate?.total || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-600">완료</span>
                <span className="font-bold text-emerald-600">{stats?.documentStats?.estimate?.completed || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-600">대기</span>
                <span className="font-bold text-amber-600">{stats?.documentStats?.estimate?.pending || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-500">취소</span>
                <span className="font-bold text-red-500">{stats?.documentStats?.estimate?.canceled || 0}건</span>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">총 금액</span>
                  <span className="font-bold text-blue-600">
                    {((stats?.documentStats?.estimate?.amount || 0) / 10000).toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-500 text-xs">건당 평균</span>
                  <span className="text-slate-600 text-sm">
                    {((stats?.documentStats?.estimate?.avgAmount || 0) / 10000).toLocaleString()}만원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 발주서 통계 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">발주서</h3>
                <p className="text-xs text-slate-500">Order</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">총 건수</span>
                <span className="font-bold text-slate-800">{stats?.documentStats?.order?.total || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-600">완료</span>
                <span className="font-bold text-emerald-600">{stats?.documentStats?.order?.completed || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-600">대기</span>
                <span className="font-bold text-amber-600">{stats?.documentStats?.order?.pending || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-500">취소</span>
                <span className="font-bold text-red-500">{stats?.documentStats?.order?.canceled || 0}건</span>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">총 금액</span>
                  <span className="font-bold text-purple-600">
                    {((stats?.documentStats?.order?.amount || 0) / 10000).toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-500 text-xs">건당 평균</span>
                  <span className="text-slate-600 text-sm">
                    {((stats?.documentStats?.order?.avgAmount || 0) / 10000).toLocaleString()}만원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 상담 통계 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">상담</h3>
                <p className="text-xs text-slate-500">Consultation</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">총 건수</span>
                <span className="font-bold text-slate-800">{stats?.consultationStats?.total || 0}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-600">팔로업 필요</span>
                <span className="font-bold text-amber-600">{stats?.consultationStats?.followUpNeeded || 0}건</span>
              </div>
              {stats?.consultationStats?.byMethod && Object.keys(stats.consultationStats.byMethod).length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">상담 방법별</p>
                  {Object.entries(stats.consultationStats.byMethod).map(([method, count]) => (
                    <div key={method} className="flex justify-between items-center mt-1">
                      <span className="text-slate-600 text-sm capitalize">{method}</span>
                      <span className="text-slate-700 text-sm">{count}건</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              담당자 목록
              <span className="text-xs font-normal text-slate-500 ml-auto">
                {contacts?.length || 0}명 (활성 {contacts?.filter((c: Contact) => !c.resign).length || 0}명)
              </span>
            </h3>
          </div>
          {contacts && contacts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {contacts.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className={`px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    contact.resign ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                      {contact.contact_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{contact.contact_name}</p>
                        {contact.level && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {contact.level}
                          </span>
                        )}
                        {contact.resign && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">퇴사</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{contact.department || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {contact.mobile && (
                      <a
                        href={`tel:${contact.mobile}`}
                        className="flex items-center gap-1 text-slate-600 hover:text-teal-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {contact.mobile}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-slate-600 hover:text-teal-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="w-12 h-12 mb-4" />
              <p>등록된 담당자가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
