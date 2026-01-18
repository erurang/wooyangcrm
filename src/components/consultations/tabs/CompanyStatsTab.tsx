"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  ShoppingCart,
  ClipboardList,
  Phone,
  Mail,
  Video,
  MapPin,
  Globe,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Package,
  Repeat,
  CalendarDays,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import { useCompanyStats } from "@/hooks/companies/useCompanyStats";
import EmptyState from "@/components/ui/EmptyState";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CompanyStatsTabProps {
  companyId: string;
}

// 금액 포맷
const formatAmount = (amount: number | null | undefined) => {
  if (amount == null) return "0";
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }
  return amount.toLocaleString();
};

// 변화율 표시
const formatChange = (change: number | null) => {
  if (change === null) return null;
  const formatted = change.toFixed(1);
  return parseFloat(formatted) >= 0 ? `+${formatted}%` : `${formatted}%`;
};

// 상담방법 라벨
const getContactMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    phone: "전화",
    email: "이메일",
    online: "온라인",
    meeting: "미팅",
    visit: "방문",
    exhibition: "전시회",
    other: "기타",
  };
  return labels[method] || method;
};

// 문서 타입 라벨
const getDocTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    estimate: "견적서",
    order: "발주서",
    requestQuote: "의뢰서",
  };
  return labels[type] || type;
};

// 문서 상태 뱃지
const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
    expired: "bg-slate-100 text-slate-700",
  };
  const labels: Record<string, string> = {
    completed: "완료",
    pending: "진행중",
    canceled: "취소",
    expired: "만료",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
};

// 비교 카드 컴포넌트
function ComparisonCard({
  title,
  current,
  previous,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  current: number;
  previous: number;
  change: number | null;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  const isPositive = change !== null && change >= 0;

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {change !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {formatChange(change)}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xl font-bold text-slate-800">{formatAmount(current)}</div>
          <div className="text-xs text-slate-500">현재</div>
        </div>
        <ArrowRight size={16} className="text-slate-300" />
        <div className="text-right">
          <div className="text-lg text-slate-600">{formatAmount(previous)}</div>
          <div className="text-xs text-slate-500">이전</div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyStatsTab({ companyId }: CompanyStatsTabProps) {
  const { stats, isLoading, isError } = useCompanyStats({ companyId });

  // 3년치 월별 비교 차트 데이터
  const threeYearChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];
    const categories = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    // 각 연도별 데이터 초기화
    const salesByYear: Record<number, number[]> = {};
    const purchasesByYear: Record<number, number[]> = {};
    const consultByYear: Record<number, number[]> = {};

    years.forEach(year => {
      salesByYear[year] = Array(12).fill(0);
      purchasesByYear[year] = Array(12).fill(0);
      consultByYear[year] = Array(12).fill(0);
    });

    if (stats?.monthlyData) {
      stats.monthlyData.forEach((d) => {
        const year = parseInt(d.month.substring(0, 4));
        const month = parseInt(d.month.substring(5, 7)) - 1; // 0-indexed

        if (years.includes(year)) {
          salesByYear[year][month] = d.estimateAmount;
          purchasesByYear[year][month] = d.orderAmount;
          consultByYear[year][month] = d.consultationCount;
        }
      });
    }

    return {
      categories,
      years,
      salesByYear,
      purchasesByYear,
      consultByYear,
    };
  }, [stats?.monthlyData]);

  // 차트 데이터 준비 (최근 12개월 - 레거시용)
  const monthlyChartData = useMemo(() => {
    if (!stats?.monthlyData) return { categories: [], salesSeries: [], purchaseSeries: [], consultSeries: [] };

    // 최근 12개월만
    const data = stats.monthlyData.slice(-12);
    return {
      categories: data.map((d) => dayjs(d.month).format("YY.MM")),
      salesSeries: data.map((d) => d.estimateAmount),
      purchaseSeries: data.map((d) => d.orderAmount),
      consultSeries: data.map((d) => d.consultationCount),
    };
  }, [stats?.monthlyData]);

  // 연도별 차트 데이터
  const yearlyChartData = useMemo(() => {
    if (!stats?.yearlyData) return { categories: [], salesSeries: [], purchasesSeries: [] };
    const data = stats.yearlyData;
    return {
      categories: data.map((d) => `${d.year}년`),
      salesSeries: data.map((d) => d.sales),
      purchasesSeries: data.map((d) => d.purchases),
    };
  }, [stats?.yearlyData]);

  // 분기별 차트 데이터
  const quarterlyChartData = useMemo(() => {
    if (!stats?.quarterlyData) return { categories: [], salesSeries: [], purchasesSeries: [] };
    const data = stats.quarterlyData.slice(-8); // 최근 8분기
    return {
      categories: data.map((d) => d.quarter),
      salesSeries: data.map((d) => d.sales),
      purchasesSeries: data.map((d) => d.purchases),
    };
  }, [stats?.quarterlyData]);

  // 문서 상태 분포 차트
  const docStatusData = useMemo(() => {
    if (!stats?.documentStats) return { series: [], labels: [] };
    const est = stats.documentStats.estimate;
    const ord = stats.documentStats.order;
    return {
      series: [est.completed + ord.completed, est.pending + ord.pending, est.canceled + ord.canceled],
      labels: ["완료", "진행중", "취소"],
    };
  }, [stats?.documentStats]);

  // 상담방법 분포 차트
  const consultMethodData = useMemo(() => {
    if (!stats?.consultationStats?.byMethod) return { series: [], categories: [] };
    const methods = stats.consultationStats.byMethod;
    const entries = Object.entries(methods).sort((a, b) => b[1] - a[1]);
    return {
      series: entries.map(([, v]) => v),
      categories: entries.map(([k]) => getContactMethodLabel(k)),
    };
  }, [stats?.consultationStats?.byMethod]);

  // Top 5 품목 차트 데이터
  const topProductsData = useMemo(() => {
    if (!stats?.topProducts) return { series: [], categories: [] };
    const data = stats.topProducts.slice(0, 5);
    return {
      series: data.map((p) => p.totalAmount),
      categories: data.map((p) => p.name.length > 10 ? p.name.substring(0, 10) + "..." : p.name),
    };
  }, [stats?.topProducts]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 mt-3">통계를 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-red-400" />}
        title="통계를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
      />
    );
  }

  const { summary, documentStats, consultationStats, contactStats, yoyComparison, qoqComparison, topProducts, userActivity, recentDocuments } = stats;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">종합 거래 통계</h3>
        {summary.firstTransactionDate && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} />
            <span>
              거래 기간: {dayjs(summary.firstTransactionDate).format("YYYY.MM.DD")} ~ {dayjs(summary.lastTransactionDate).format("YYYY.MM.DD")}
              <span className="ml-2 text-cyan-600">({summary.tradingDays}일)</span>
            </span>
          </div>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 매출 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              평균 {formatAmount(summary.avgSalesPerTransaction)}/건
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatAmount(summary.totalSales)}원
          </div>
          <div className="text-sm text-white/80">총 매출</div>
          <div className="text-xs text-white/60 mt-1">
            월평균 {formatAmount(summary.avgSalesPerMonth)}원
          </div>
        </div>

        {/* 총 매입 */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              평균 {formatAmount(summary.avgPurchasePerTransaction)}/건
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatAmount(summary.totalPurchases)}원
          </div>
          <div className="text-sm text-white/80">총 매입</div>
          <div className="text-xs text-white/60 mt-1">
            월평균 {formatAmount(summary.avgPurchasesPerMonth)}원
          </div>
        </div>

        {/* 전환율 */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {summary.conversionRate}%
          </div>
          <div className="text-sm text-white/80">견적→발주 전환율</div>
          <div className="text-xs text-white/60 mt-1">
            견적 {documentStats.estimate.completed}건 → 발주 {documentStats.order.completed}건
          </div>
        </div>

        {/* 담당자 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            {summary.resignedContacts > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                퇴사 {summary.resignedContacts}명
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-800 mb-1">
            {summary.totalContacts}명
          </div>
          <div className="text-sm text-slate-600">활성 담당자</div>
          <div className="flex gap-2 mt-2 text-xs text-slate-500">
            <MessageSquare size={12} />
            상담 {summary.totalConsultations}건 · 후속 {summary.followUpNeeded}건
          </div>
        </div>
      </div>

      {/* 전년 대비 (YoY) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-800">전년 대비 (YoY)</h4>
          <span className="text-xs text-slate-500">
            {yoyComparison.prevYear}년 vs {yoyComparison.currentYear}년
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComparisonCard
            title="매출"
            current={yoyComparison.sales.current}
            previous={yoyComparison.sales.previous}
            change={yoyComparison.sales.change}
            icon={TrendingUp}
            color="blue"
          />
          <ComparisonCard
            title="매입"
            current={yoyComparison.purchases.current}
            previous={yoyComparison.purchases.previous}
            change={yoyComparison.purchases.change}
            icon={ShoppingCart}
            color="green"
          />
          <ComparisonCard
            title="상담"
            current={yoyComparison.consultations.current}
            previous={yoyComparison.consultations.previous}
            change={yoyComparison.consultations.change}
            icon={MessageSquare}
            color="orange"
          />
        </div>
      </div>

      {/* 전분기 대비 (QoQ) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Repeat size={18} className="text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-800">전분기 대비 (QoQ)</h4>
          <span className="text-xs text-slate-500">
            {qoqComparison.prevQuarter} vs {qoqComparison.currentQuarter}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComparisonCard
            title="매출"
            current={qoqComparison.sales.current}
            previous={qoqComparison.sales.previous}
            change={qoqComparison.sales.change}
            icon={TrendingUp}
            color="blue"
          />
          <ComparisonCard
            title="매입"
            current={qoqComparison.purchases.current}
            previous={qoqComparison.purchases.previous}
            change={qoqComparison.purchases.change}
            icon={ShoppingCart}
            color="green"
          />
        </div>
      </div>

      {/* 차트 영역 - 연도별/분기별 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 연도별 추이 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">연도별 매출/매입 추이</h4>
          {yearlyChartData.categories.length > 0 ? (
            <ApexChart
              type="bar"
              height={250}
              options={{
                chart: {
                  id: `yearly-${companyId}`,
                  toolbar: { show: false },
                },
                colors: ["#3B82F6", "#10B981"],
                plotOptions: {
                  bar: { borderRadius: 4, columnWidth: "60%", dataLabels: { position: "top" } },
                },
                xaxis: {
                  categories: yearlyChartData.categories,
                  labels: { style: { fontSize: "11px" } },
                },
                yaxis: {
                  labels: {
                    formatter: (val) => formatAmount(val),
                    style: { fontSize: "11px" },
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => formatAmount(val as number),
                  offsetY: -20,
                  style: { fontSize: "10px", colors: ["#333"] },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  followCursor: true,
                  fixed: { enabled: false },
                  y: { formatter: (val) => `${val?.toLocaleString() || 0}원` },
                },
                legend: { position: "top", horizontalAlign: "right" },
              }}
              series={[
                { name: "매출", data: yearlyChartData.salesSeries },
                { name: "매입", data: yearlyChartData.purchasesSeries },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 분기별 추이 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">분기별 매출/매입 추이</h4>
          {quarterlyChartData.categories.length > 0 ? (
            <ApexChart
              type="line"
              height={250}
              options={{
                chart: {
                  id: `quarterly-${companyId}`,
                  toolbar: { show: false },
                },
                colors: ["#3B82F6", "#10B981"],
                stroke: { curve: "smooth", width: 3 },
                markers: { size: 4 },
                xaxis: {
                  categories: quarterlyChartData.categories,
                  labels: { style: { fontSize: "10px" } },
                },
                yaxis: {
                  labels: {
                    formatter: (val) => formatAmount(val),
                    style: { fontSize: "11px" },
                  },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  followCursor: true,
                  fixed: { enabled: false },
                  y: { formatter: (val) => `${val?.toLocaleString() || 0}원` },
                },
                legend: { position: "top", horizontalAlign: "right" },
              }}
              series={[
                { name: "매출", data: quarterlyChartData.salesSeries },
                { name: "매입", data: quarterlyChartData.purchasesSeries },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 월별 매출 추이 - 3년 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-800">월별 매출 추이 (3년)</h4>
            <div className="flex items-center gap-3 text-xs">
              {threeYearChartData.years.map((year, idx) => (
                <span key={year} className="flex items-center gap-1">
                  <span
                    className="w-3 h-0.5 rounded"
                    style={{ backgroundColor: ["#3B82F6", "#10B981", "#F97316"][idx] }}
                  ></span>
                  {year}년
                </span>
              ))}
            </div>
          </div>
          <ApexChart
            type="line"
            height={280}
            options={{
              chart: {
                id: `sales-3year-${companyId}`,
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              colors: ["#3B82F6", "#10B981", "#F97316"],
              dataLabels: { enabled: false },
              stroke: {
                curve: "smooth",
                width: [3, 2, 2],
                dashArray: [0, 5, 5],
              },
              markers: { size: [4, 3, 3] },
              xaxis: {
                categories: threeYearChartData.categories,
                labels: { style: { fontSize: "11px" } },
              },
              yaxis: {
                labels: {
                  formatter: (val) => formatAmount(val),
                  style: { fontSize: "11px" },
                },
              },
              tooltip: {
                shared: true,
                intersect: false,
                followCursor: true,
                fixed: { enabled: false },
                y: { formatter: (val) => `${val?.toLocaleString() || 0}원` },
              },
              legend: { show: false },
              grid: { borderColor: "#f1f1f1" },
            }}
            series={threeYearChartData.years.map(year => ({
              name: `${year}년`,
              data: threeYearChartData.salesByYear[year],
            }))}
          />
        </div>

        {/* 월별 매입 추이 - 3년 비교 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-800">월별 매입 추이 (3년)</h4>
            <div className="flex items-center gap-3 text-xs">
              {threeYearChartData.years.map((year, idx) => (
                <span key={year} className="flex items-center gap-1">
                  <span
                    className="w-3 h-0.5 rounded"
                    style={{ backgroundColor: ["#3B82F6", "#10B981", "#F97316"][idx] }}
                  ></span>
                  {year}년
                </span>
              ))}
            </div>
          </div>
          <ApexChart
            type="line"
            height={280}
            options={{
              chart: {
                id: `purchases-3year-${companyId}`,
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              colors: ["#3B82F6", "#10B981", "#F97316"],
              dataLabels: { enabled: false },
              stroke: {
                curve: "smooth",
                width: [3, 2, 2],
                dashArray: [0, 5, 5],
              },
              markers: { size: [4, 3, 3] },
              xaxis: {
                categories: threeYearChartData.categories,
                labels: { style: { fontSize: "11px" } },
              },
              yaxis: {
                labels: {
                  formatter: (val) => formatAmount(val),
                  style: { fontSize: "11px" },
                },
              },
              tooltip: {
                shared: true,
                intersect: false,
                followCursor: true,
                fixed: { enabled: false },
                y: { formatter: (val) => `${val?.toLocaleString() || 0}원` },
              },
              legend: { show: false },
              grid: { borderColor: "#f1f1f1" },
            }}
            series={threeYearChartData.years.map(year => ({
              name: `${year}년`,
              data: threeYearChartData.purchasesByYear[year],
            }))}
          />
        </div>
      </div>

      {/* TOP 품목 & 담당자별 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOP 품목 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-800">TOP 10 품목 (금액 기준)</h4>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${product.spec}`}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index < 3 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{product.name}</div>
                      {product.spec && (
                        <div className="text-xs text-slate-500">{product.spec}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      {formatAmount(product.totalAmount)}원
                    </div>
                    <div className="text-xs text-slate-500">
                      {product.totalQuantity}개 · {product.count}건
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              품목 데이터가 없습니다
            </div>
          )}
        </div>

        {/* 담당자별 활동 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-800">담당자별 활동</h4>
          </div>
          {userActivity.length > 0 ? (
            <div className="space-y-2">
              {userActivity.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? "bg-yellow-400 text-white" : "bg-slate-300 text-slate-700"
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{user.name}</div>
                      <div className="text-xs text-slate-500">
                        문서 {user.documents}건 · 상담 {user.consultations}건
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatAmount(user.totalAmount)}원
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              활동 데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 문서/상담 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 문서 상태 분포 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">문서 상태 분포</h4>
          {docStatusData.series.some((v) => v > 0) ? (
            <>
              <ApexChart
                type="donut"
                height={180}
                options={{
                  chart: { toolbar: { show: false } },
                  colors: ["#22C55E", "#F59E0B", "#EF4444"],
                  labels: docStatusData.labels,
                  legend: { position: "bottom", fontSize: "12px" },
                  dataLabels: {
                    enabled: true,
                    formatter: (val: number) => `${val.toFixed(0)}%`,
                  },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: "65%",
                        labels: {
                          show: true,
                          total: {
                            show: true,
                            label: "전체",
                            formatter: () => `${summary.totalDocuments}건`,
                          },
                        },
                      },
                    },
                  },
                }}
                series={docStatusData.series}
              />
              <div className="mt-4 space-y-2">
                {Object.entries(documentStats).map(([type, stat]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{getDocTypeLabel(type)}</span>
                    <div className="flex gap-2">
                      <span className="text-green-600">{stat.completed}완료</span>
                      <span className="text-yellow-600">{stat.pending}진행</span>
                      <span className="text-red-600">{stat.canceled}취소</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 상담방법 분포 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">상담방법 분포</h4>
          {consultMethodData.series.length > 0 ? (
            <ApexChart
              type="bar"
              height={220}
              options={{
                chart: { toolbar: { show: false } },
                colors: ["#6366F1"],
                plotOptions: {
                  bar: { horizontal: true, borderRadius: 4, barHeight: "60%" },
                },
                xaxis: { categories: consultMethodData.categories },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => `${val}건`,
                  style: { fontSize: "11px" },
                },
                tooltip: { y: { formatter: (val) => `${val}건` } },
              }}
              series={[{ name: "상담수", data: consultMethodData.series }]}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 부서별 담당자 분포 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">부서별 담당자 분포</h4>
          {Object.keys(contactStats.byDepartment).length > 0 ? (
            <ApexChart
              type="pie"
              height={220}
              options={{
                chart: { toolbar: { show: false } },
                labels: Object.keys(contactStats.byDepartment).map(d => d || "미지정"),
                legend: { position: "bottom", fontSize: "11px" },
                dataLabels: { enabled: true },
              }}
              series={Object.values(contactStats.byDepartment)}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              부서 정보가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 월별 상담 추이 - 3년 비교 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-800">월별 상담 현황 (3년)</h4>
          <div className="flex items-center gap-3 text-xs">
            {threeYearChartData.years.map((year, idx) => (
              <span key={year} className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: ["#3B82F6", "#10B981", "#F97316"][idx] }}
                ></span>
                {year}년
              </span>
            ))}
          </div>
        </div>
        <ApexChart
          type="bar"
          height={200}
          options={{
            chart: {
              id: `consult-3year-${companyId}`,
              toolbar: { show: false },
            },
            colors: ["#3B82F6", "#10B981", "#F97316"],
            plotOptions: {
              bar: { borderRadius: 4, columnWidth: "70%" },
            },
            xaxis: {
              categories: threeYearChartData.categories,
              labels: { style: { fontSize: "11px" } },
            },
            yaxis: {
              labels: {
                formatter: (val) => `${val}건`,
                style: { fontSize: "11px" },
              },
            },
            dataLabels: { enabled: false },
            tooltip: {
              shared: true,
              intersect: false,
              followCursor: true,
              fixed: { enabled: false },
              y: { formatter: (val) => `${val}건` },
            },
            legend: { show: false },
          }}
          series={threeYearChartData.years.map(year => ({
            name: `${year}년`,
            data: threeYearChartData.consultByYear[year],
          }))}
        />
      </div>

      {/* 최근 문서 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">최근 문서</h4>
        {recentDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    doc.type === "estimate" ? "bg-blue-100" :
                    doc.type === "order" ? "bg-green-100" : "bg-purple-100"
                  }`}>
                    <FileText size={16} className={
                      doc.type === "estimate" ? "text-blue-600" :
                      doc.type === "order" ? "text-green-600" : "text-purple-600"
                    } />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {doc.document_number}
                    </div>
                    <div className="text-xs text-slate-500">
                      {getDocTypeLabel(doc.type)} · {dayjs(doc.date).format("YYYY-MM-DD")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">
                    {formatAmount(doc.total_amount)}원
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-slate-400">
            최근 문서가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
