"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BarChart3,
  FileText,
  PieChart,
  Target,
  User,
  Users,
  Filter,
  Search,
  TrendingUp,
  Building,
  ArrowUpRight,
  Layers,
  BarChart,
  Briefcase,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
import { useUserDocumentList } from "@/hooks/reports/userDetail/documents/useUserDocumentList";
import { useLoginLogs } from "@/hooks/dashboard/useLoginLogs";
import { useClientSummary } from "@/hooks/dashboard/useClientSummary";
import TodoList from "@/components/dashboard/Todos";

// 동적으로 차트 컴포넌트 불러오기
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ApexCharts 타입 선언
declare type ApexCharts = any;

// 타입 정의
interface Item {
  name: string;
  spec?: string;
  quantity: string;
  total: number;
  type?: "sales" | "purchase";
}

interface Company {
  name: string;
  total: number;
}

interface ChartData {
  labels: string[];
  data: number[];
}

interface ItemChartData {
  name: string;
  value: number;
  type: "sales" | "purchase";
}

interface ClientAnalysis {
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = Array.isArray(id) ? id[0] : id || "";

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "consultation"
    | "sales"
    | "purchase"
    | "trends"
    | "performance"
    | "clients"
    | "items"
    | "todo"
  >("dashboard"); // 기본 탭을 대시보드로 변경
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemCategory, setSelectedItemCategory] = useState<
    "all" | "sales" | "purchase"
  >("all");
  const [timeRange, setTimeRange] = useState<
    "month" | "quarter" | "year" | "all"
  >("month");

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "month"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // 날짜 변환 (연도별, 분기별, 월별)
  let startDate: string;
  let endDate: string;

  // 날짜 변환 (연도별, 분기별, 월별) 부분을 다음과 같이 수정합니다.
  // 타임존 차이를 고려하여 endDate에 하루를 추가합니다。

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    const startMonth = (selectedQuarter - 1) * 3 + 1;
    startDate = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
    // 분기의 마지막 월의 마지막 날짜 계산 + 하루 추가하여 타임존 문제 해결
    const endMonth = startMonth + 2; // 분기의 마지막 월
    const lastDay = new Date(selectedYear, endMonth, 0).getDate();
    endDate = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    // 선택한 월의 마지막 날짜 계산 + 하루 추가하여 타임존 문제 해결
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    endDate = `${selectedYear}-${String(selectedMonth).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;
  }

  // API 호출 시 타임존 고려를 위해 endDate에 하루를 추가
  // 이렇게 하면 UTC 기준으로도 해당 월의 마지막 날 데이터��지 모두 포함됩니다
  if (dateFilter === "month" || dateFilter === "quarter") {
    const endDateObj = new Date(endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    endDate = endDateObj.toISOString().split("T")[0];
  }

  // SWR 데이터 가져오기
  const { user, isLoading: isUserLoading } = useUserDetail(userId);
  const { salesSummary, isLoading: isSalesLoading } = useUserSalesSummary(
    [userId],
    startDate,
    endDate
  );
  const {
    salesCompanies,
    purchaseCompanies,
    salesProducts,
    purchaseProducts,
    isLoading: isTransactionsLoading,
  } = useUserTransactions(userId, startDate, endDate);

  const { documents, isLoading: isConsultationsLoading } =
    useUserDocumentsCount([userId], startDate, endDate);
  const { documentsDetails } = useUserDocumentList(userId, startDate, endDate);

  // 대시보드 탭에 필요한 추가 데이터
  const { loginLogs } = useLoginLogs(userId);
  const { followUpClients, clients } = useClientSummary(userId);

  // 만료 예정 견적서 계산
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  // 직접 만료 예정 견적서 계산
  const expiringDocuments = useMemo(() => {
    return (documentsDetails ?? [])
      .flatMap((user: any) => user.consultations ?? [])
      .flatMap((consultation: any) =>
        (consultation.documents ?? [])
          .filter((doc: any) => {
            // 견적서이고 valid_until이 있는 경우만 필터링
            if (doc.type !== "estimate" || !doc.valid_until) return false;

            // 유효기간이 오늘과 7일 후 사이에 있는지 확인
            const validUntil = new Date(doc.valid_until);
            return validUntil >= today && validUntil <= sevenDaysLater;
          })
          .map((doc: any) => ({
            id: doc.document_id,
            content: {
              company_name: consultation.company_name,
              valid_until: doc.valid_until,
              total_amount: (doc.items ?? []).reduce(
                (sum: number, item: any) => sum + (item.amount || 0),
                0
              ),
            },
          }))
      );
  }, [documentsDetails, today, sevenDaysLater]);

  const userDocuments = documents?.[userId] || {
    estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
    orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
  };

  const estimates = userDocuments.estimates;
  const orders = userDocuments.orders;

  // 중복 제거 및 총합 계산 함수
  const aggregateData = (data: any[], key: string): any[] => {
    return Object.values(
      data.reduce((acc: Record<string, any>, item: any) => {
        const identifier = `${item.name}-${item[key] || ""}`; // 거래처명 or 품목명+스펙
        if (!acc[identifier]) {
          acc[identifier] = { ...item };
        } else {
          acc[identifier].total += item.total; // 같은 항목이면 total 값 합산
        }
        return acc;
      }, {})
    );
  };

  // 중복 데이터 제거 및 총합 계산 적용
  const aggregatedSalesCompanies = aggregateData(
    salesCompanies || [],
    "name"
  ) as Company[];
  const aggregatedPurchaseCompanies = aggregateData(
    purchaseCompanies || [],
    "name"
  ) as Company[];
  const aggregatedSalesProducts = aggregateData(
    salesProducts || [],
    "spec"
  ) as Item[];
  const aggregatedPurchaseProducts = aggregateData(
    purchaseProducts || [],
    "spec"
  ) as Item[];

  // 검색 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    const allItems = [
      ...aggregatedSalesProducts.map((item) => ({
        ...item,
        type: "sales" as const,
      })),
      ...aggregatedPurchaseProducts.map((item) => ({
        ...item,
        type: "purchase" as const,
      })),
    ];

    return allItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.spec &&
          item.spec.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedItemCategory === "all" || item.type === selectedItemCategory;

      return matchesSearch && matchesCategory;
    });
  }, [
    searchTerm,
    selectedItemCategory,
    aggregatedSalesProducts,
    aggregatedPurchaseProducts,
  ]);

  // 차트 데이터 정리
  const getChartData = (companies: Company[]): ChartData => {
    const sorted = [...companies].sort((a, b) => b.total - a.total);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);

    return {
      labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(
        Boolean
      ),
      data: [
        ...top5.map((c) => c.total),
        otherTotal > 0 ? otherTotal : 0,
      ].filter((v) => v > 0),
    };
  };

  // 차트 데이터 생성
  const salesChart = getChartData(aggregatedSalesCompanies);
  const purchaseChart = getChartData(aggregatedPurchaseCompanies);

  // 아이템별 차트 데이터
  const itemsChartData = useMemo(() => {
    const salesData = aggregatedSalesProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        value: item.total,
        type: "sales" as const,
      }));

    const purchaseData = aggregatedPurchaseProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        value: item.total,
        type: "purchase" as const,
      }));

    return { salesData, purchaseData };
  }, [aggregatedSalesProducts, aggregatedPurchaseProducts]);

  // 월별 트렌드 데이터 (실제 데이터 기반)
  const generateMonthlyTrendData = () => {
    const months = [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
    ];

    // 월별 데이터 초기화
    const monthlySales = Array(12).fill(0);
    const monthlyPurchases = Array(12).fill(0);

    // documentsDetails에서 월별 데이터 추출
    if (documentsDetails && documentsDetails.length > 0) {
      documentsDetails.forEach((userObj: any) => {
        (userObj.consultations || []).forEach((consultation: any) => {
          if (!consultation.date) return;

          // 날짜에서 월 추출 (YYYY-MM-DD 형식 가정)
          const consultDate = new Date(consultation.date);
          const month = consultDate.getMonth();

          // 문서 처리 - completed 상태인 문서만 집계
          (consultation.documents || []).forEach((doc: any) => {
            if (doc.status === "completed") {
              const total = (doc.items || []).reduce(
                (sum: number, item: any) => sum + (item.amount || 0),
                0
              );

              if (doc.type === "estimate") {
                monthlySales[month] += total;
              } else if (doc.type === "order") {
                monthlyPurchases[month] += total;
              }
            }
          });
        });
      });
    }

    // 현재 선택된 필터에 따라 데이터 필터링
    let filteredMonths: string[] = [];
    let filteredSales: number[] = [];
    let filteredPurchases: number[] = [];

    if (dateFilter === "month") {
      // 월별 조회: 선택한 월만 표시
      filteredMonths = [months[selectedMonth - 1]];
      filteredSales = [monthlySales[selectedMonth - 1]];
      filteredPurchases = [monthlyPurchases[selectedMonth - 1]];
    } else if (dateFilter === "quarter") {
      // 분기별 조회: 해당 분기의 3개월 표시
      const startMonth = (selectedQuarter - 1) * 3;
      filteredMonths = months.slice(startMonth, startMonth + 3);
      filteredSales = monthlySales.slice(startMonth, startMonth + 3);
      filteredPurchases = monthlyPurchases.slice(startMonth, startMonth + 3);
    } else {
      // 연도별 조회: 모든 월 표시
      filteredMonths = months;
      filteredSales = monthlySales;
      filteredPurchases = monthlyPurchases;
    }

    return {
      months: filteredMonths,
      salesData: filteredSales,
      purchaseData: filteredPurchases,
    };
  };

  const monthlyTrendData = useMemo(generateMonthlyTrendData, [
    documentsDetails,
    dateFilter,
    selectedMonth,
    selectedQuarter,
    selectedYear,
  ]);

  const completedSales: number = (documentsDetails ?? [])
    ?.flatMap((user: any) => user.consultations ?? [])
    ?.flatMap((consultation: any) => consultation.documents ?? [])
    ?.filter(
      (doc: any) => doc.status === "completed" && doc.type === "estimate"
    )
    ?.reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const completedPurchases: number = (documentsDetails ?? [])
    ?.flatMap((user: any) => user.consultations ?? [])
    ?.flatMap((consultation: any) => consultation.documents ?? [])
    ?.filter((doc: any) => doc.status === "completed" && doc.type === "order")
    ?.reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const pendingSales: number = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "pending" && doc.type === "estimate")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const pendingPurchases: number = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "pending" && doc.type === "order")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const canceledSales: number = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "canceled" && doc.type === "estimate")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const canceledPurchases: number = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "canceled" && doc.type === "order")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: number, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  // 거래처 분석 데이터 (상위 거래처 및 거래 빈도)
  const clientAnalysisData = useMemo(() => {
    // 거래처별 상담 횟수 계산
    const consultationsByClient = (documentsDetails ?? [])
      .flatMap((user: any) => user.consultations ?? [])
      .reduce((acc: Record<string, ClientAnalysis>, consultation: any) => {
        const companyName = consultation.company_name;
        if (!acc[companyName]) {
          acc[companyName] = {
            name: companyName,
            consultations: 0,
            estimates: 0,
            orders: 0,
            totalSales: 0,
            totalPurchases: 0,
          };
        }
        acc[companyName].consultations += 1;

        // 문서 정보 추가
        (consultation.documents ?? []).forEach((doc: any) => {
          if (doc.type === "estimate") {
            acc[companyName].estimates += 1;
            if (doc.status === "completed") {
              const docTotal = (doc.items ?? []).reduce(
                (sum: number, item: any) => sum + (item.amount || 0),
                0
              );
              acc[companyName].totalSales += docTotal;
            }
          } else if (doc.type === "order") {
            acc[companyName].orders += 1;
            if (doc.status === "completed") {
              const docTotal = (doc.items ?? []).reduce(
                (sum: number, item: any) => sum + (item.amount || 0),
                0
              );
              acc[companyName].totalPurchases += docTotal;
            }
          }
        });

        return acc;
      }, {});

    return Object.values(consultationsByClient);
  }, [documentsDetails]);

  const docTypes = ["estimate", "order", "requestQuote"];

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "진행 중";
      case "completed":
        return "완료됨";
      case "canceled":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  function getDocTypeLabel(type: string) {
    switch (type) {
      case "estimate":
        return "견적서";
      case "order":
        return "발주서";
      case "requestQuote":
        return "의뢰서";
      default:
        return "기타 문서";
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-600 bg-amber-50";
      case "completed":
        return "text-emerald-600 bg-emerald-50";
      case "canceled":
        return "text-rose-600 bg-rose-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // 성과 지표 계산
  const performanceMetrics = useMemo(() => {
    // 목표 대비 달성률
    const targetAchievementRate = user?.target
      ? (completedSales / user.target) * 100
      : 0;

    // 견적 성공률
    const estimateSuccessRate =
      estimates?.total > 0 ? (estimates.completed / estimates.total) * 100 : 0;

    // 평균 거래 금액
    const avgTransactionAmount =
      estimates?.completed > 0 ? completedSales / estimates.completed : 0;

    // 상담 대비 견적 전환율
    const totalConsultations = (documentsDetails ?? []).flatMap(
      (user: any) => user.consultations ?? []
    ).length;
    const totalEstimates = (documentsDetails ?? [])
      .flatMap((user: any) => user.consultations ?? [])
      .flatMap((consultation: any) => consultation.documents ?? [])
      .filter((doc: any) => doc.type === "estimate").length;

    const consultationToEstimateRate =
      totalConsultations > 0 ? (totalEstimates / totalConsultations) * 100 : 0;

    return {
      targetAchievementRate,
      estimateSuccessRate,
      avgTransactionAmount,
      consultationToEstimateRate,
    };
  }, [user, completedSales, estimates, documentsDetails]);

  // 날짜 변환 함수
  function formatDate(dateString: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 헤더 영역 */}
      <div className="w-full">
        {/* 상단 영역: 유저 정보 및 탭 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-slate-800">
                  {user?.name} {user?.level}
                </h2>
                <p className="text-slate-500">{user?.position}</p>
              </div>
              <div className="text-end text-slate-500 text-xs">
                <p>최근 접속IP : {loginLogs?.ip_address || "-"}</p>
                <p>
                  최근 로그인 :{" "}
                  {loginLogs?.login_time
                    ? new Date(loginLogs.login_time).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">목표 금액</p>
                <p className="text-lg font-semibold text-indigo-600">
                  {user?.target?.toLocaleString() || "-"} 원
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">확정 매출</span>
                  <span className="font-semibold text-indigo-600">
                    {completedSales?.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">진행 매출</span>
                  <span className="font-semibold text-indigo-600">
                    {pendingSales?.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">취소 매출</span>
                  <span className="font-semibold text-indigo-600">
                    {canceledSales?.toLocaleString()} 원
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">확정 매입</span>
                  <span className="font-semibold text-indigo-600">
                    {completedPurchases?.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">진행 매입</span>
                  <span className="font-semibold text-indigo-600">
                    {pendingPurchases?.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-700">취소 매입</span>
                  <span className="font-semibold text-indigo-600">
                    {canceledPurchases?.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 + 문서 현황 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <Filter className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                데이터 기간 선택
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 연도 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  연도
                </label>
                <select
                  className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from(
                    { length: new Date().getFullYear() - 2010 + 1 },
                    (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      );
                    }
                  )}
                </select>
              </div>

              {/* 필터 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  기간 단위
                </label>
                <select
                  className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value as "year" | "quarter" | "month"
                    )
                  }
                >
                  <option value="year">연도별</option>
                  <option value="quarter">분기별</option>
                  <option value="month">월별</option>
                </select>
              </div>

              {/* 분기 */}
              {dateFilter === "quarter" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    분기
                  </label>
                  <select
                    className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                  >
                    <option value="1">1분기 (1~3월)</option>
                    <option value="2">2분기 (4~6월)</option>
                    <option value="3">3분기 (7~9월)</option>
                    <option value="4">4분기 (10~12월)</option>
                  </select>
                </div>
              )}

              {/* 월 */}
              {dateFilter === "month" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    월
                  </label>
                  <select
                    className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}월
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 견적서 / 발주서 현황 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> 견적서
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      진행 중
                    </span>
                    <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      {estimates?.pending || 0}건
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      완료됨
                    </span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      {estimates?.completed || 0}건
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                      취소됨
                    </span>
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                      {estimates?.canceled || 0}건
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> 발주서
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      진행 중
                    </span>
                    <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      {orders?.pending || 0}건
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      완료됨
                    </span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      {orders?.completed || 0}건
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium flex items-center">
                      <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                      취소됨
                    </span>
                    <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                      {orders?.canceled || 0}건
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white border-t border-b border-slate-200 p-1 mb-5">
          <div className="flex flex-wrap space-x-1 max-w-7xl mx-auto">
            {/* 새로운 대시보드 탭 추가 */}
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span className="flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                대시보드
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "consultation"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("consultation")}
            >
              <span className="flex items-center justify-center">
                <Users className="h-4 w-4 mr-2" />
                상담 내역
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "sales"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("sales")}
            >
              <span className="flex items-center justify-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                매출 분석
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "purchase"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("purchase")}
            >
              <span className="flex items-center justify-center">
                <PieChart className="h-4 w-4 mr-2" />
                매입 분석
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "items"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("items")}
            >
              <span className="flex items-center justify-center">
                <Package className="h-4 w-4 mr-2" />
                품목 검색
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "trends"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("trends")}
            >
              <span className="flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                추이 분석
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "performance"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("performance")}
            >
              <span className="flex items-center justify-center">
                <Target className="h-4 w-4 mr-2" />
                성과 지표
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "clients"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("clients")}
            >
              <span className="flex items-center justify-center">
                <Building className="h-4 w-4 mr-2" />
                거래처 분석
              </span>
            </button>
            <button
              className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "todo"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("todo")}
            >
              <span className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 mr-2" />할 일
              </span>
            </button>
          </div>
        </div>

        {/* 대시보드 탭 */}
        {activeTab === "dashboard" && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 후속 상담 필요 거래처 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    후속 상담 필요 거래처
                  </h2>
                </div>

                {followUpClients && followUpClients.length > 0 ? (
                  <ul className="space-y-3">
                    {followUpClients.map((client: any) => (
                      <li
                        key={client.company_id}
                        className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        <div
                          className="text-slate-800 font-medium cursor-pointer hover:text-indigo-600 transition-colors flex items-center justify-between"
                          onClick={() =>
                            router.push(`/consultations/${client.company_id}`)
                          }
                        >
                          <span>{client.company_name}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          마지막 상담일:{" "}
                          {new Date(
                            client.last_consultation
                          ).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <div className="bg-indigo-50 p-3 rounded-full mb-2">
                      <Clock className="h-6 w-6 text-indigo-400" />
                    </div>
                    <p>후속 상담이 필요한 고객이 없습니다</p>
                  </div>
                )}
              </div>

              {/* 곧 만료되는 견적서 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <AlertCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    곧 만료되는 견적서
                  </h2>
                </div>

                {expiringDocuments && expiringDocuments.length > 0 ? (
                  <ul className="space-y-3">
                    {expiringDocuments.map((doc: any) => (
                      <li
                        key={doc.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        <div className="font-medium text-slate-800">
                          {doc.content.company_name}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">
                            만료일:{" "}
                            {new Date(
                              doc.content.valid_until
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-sm font-medium text-indigo-600">
                            {doc.content.total_amount.toLocaleString()}원
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <div className="bg-indigo-50 p-3 rounded-full mb-2">
                      <AlertCircle className="h-6 w-6 text-indigo-400" />
                    </div>
                    <p>유효기간 7일 내 만료 임박한 견적서가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "consultation" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                상담 내역 및 문서
              </h2>
            </div>

            {/* 스크롤 컨테이너 */}
            <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2">
              {/* 헤더 (3열) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700 font-semibold min-w-[900px] border-b pb-2">
                <div className="text-indigo-600">상담 기록</div>
                <div className="text-indigo-600">관련 문서</div>
                <div className="text-indigo-600">품목 리스트</div>
              </div>

              {/* 상담들 */}
              {documentsDetails?.map((userObj: any) =>
                userObj.consultations.map((consultation: any) => (
                  <div
                    key={consultation.consultation_id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_1.5fr] gap-6 items-start border-b border-slate-200 pb-6"
                  >
                    {/* 왼쪽 열: 상담 기록 */}
                    <div
                      className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-indigo-50 cursor-pointer transition-colors shadow-sm"
                      onClick={() =>
                        router.push(`/consultations/${consultation.company_id}`)
                      }
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">
                          {consultation.date}
                        </span>
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs">
                          {consultation.company_name}
                        </span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-line text-sm">
                        {consultation.content}
                      </p>
                    </div>

                    {/* 중간 열: 관련 문서 */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                      {docTypes.map((docType) => {
                        // docType별 문서만 추출
                        const docsOfThisType = consultation.documents.filter(
                          (doc: any) => doc.type === docType
                        );
                        // 문서가 없으면 문서 없음
                        if (docsOfThisType.length === 0) {
                          return (
                            <p
                              key={docType}
                              className="text-slate-400 text-sm mb-4"
                            >
                              📂 {docType === "estimate" && "견적"}
                              {docType === "order" && "발주"}
                              {docType === "requestQuote" && "의뢰"} 문서 없음
                            </p>
                          );
                        }
                        // 문서가 있으면 표시
                        return (
                          <div key={docType} className="mb-4 last:mb-0">
                            <h3 className="font-semibold text-slate-700 mb-2 text-sm">
                              {getDocTypeLabel(docType)}
                            </h3>
                            {docsOfThisType.map((doc: any) => (
                              <div
                                key={doc.document_id}
                                className="mb-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() =>
                                  window.open(
                                    `/documents/${doc.type}?consultId=${consultation.consultation_id}&compId=${consultation.company_id}&fullscreen=true`,
                                    "_blank",
                                    "width=1200,height=800,top=100,left=100"
                                  )
                                }
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-md ${getStatusColor(
                                      doc.status
                                    )}`}
                                  >
                                    {getStatusText(doc.status)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {doc.created_at.split("T")[0]}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700">
                                  문서번호:{" "}
                                  <span className="text-indigo-600 font-semibold">
                                    {doc.document_number}
                                  </span>
                                </p>
                                <p className="text-xs mt-1">
                                  담당자:{" "}
                                  <span className="font-semibold">
                                    {doc.user.name}
                                  </span>{" "}
                                  ({doc.user.level})
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* 오른쪽 열: 품목 리스트 */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                      {docTypes.map((docType) => {
                        // docType별 문서
                        const docsOfThisType = consultation.documents.filter(
                          (doc: any) => doc.type === docType
                        );
                        // 문서 자체가 없으면 품목도 없음
                        if (docsOfThisType.length === 0) {
                          return (
                            <p
                              key={docType}
                              className="text-slate-400 text-sm mb-4"
                            >
                              📂 {docType === "estimate" && "견적"}
                              {docType === "order" && "발주"}
                              {docType === "requestQuote" && "의뢰"} 품목 없음
                            </p>
                          );
                        }

                        // 문서가 있으면, 각 문서의 items 확인
                        return docsOfThisType.map(
                          (doc: any, docIndex: number) => {
                            if (!doc.items || doc.items.length === 0) {
                              // 문서는 있으나 품목이 없음
                              return (
                                <p
                                  key={doc.document_id}
                                  className="text-slate-400 text-sm mb-4"
                                >
                                  {getDocTypeLabel(docType)} - 품목 없음
                                </p>
                              );
                            }
                            // 품목이 있으면 나열
                            return (
                              <div
                                key={doc.document_id}
                                className="mb-4 last:mb-0"
                              >
                                <h3 className="font-semibold text-slate-700 mb-2 text-sm">
                                  {getDocTypeLabel(docType)}{" "}
                                  {doc.document_number}
                                </h3>
                                {doc.items.map(
                                  (item: any, itemIndex: number) => (
                                    <div
                                      key={itemIndex}
                                      className="grid grid-cols-[2fr_1fr_0.5fr_0.5fr] gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm mb-2"
                                    >
                                      <span className="text-slate-700 font-medium">
                                        {item.name}
                                      </span>
                                      <span className="text-slate-500">
                                        {item.spec}
                                      </span>
                                      <span className="text-slate-500 text-center">
                                        {item.quantity}
                                      </span>
                                      <span className="text-indigo-600 font-semibold text-right">
                                        {Number(item.amount).toLocaleString()}{" "}
                                        원
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          }
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Search className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  품목 검색
                </h2>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="품목명 또는 규격 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={selectedItemCategory}
                  onChange={(e) =>
                    setSelectedItemCategory(e.target.value as any)
                  }
                  className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">전체 품목</option>
                  <option value="sales">매출 품목</option>
                  <option value="purchase">매입 품목</option>
                </select>
              </div>
            </div>

            {/* 검색 결과 */}
            <div className="overflow-y-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      품목명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      규격
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      수량
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                          {item.spec || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.type === "sales"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.type === "sales" ? "매출" : "매입"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                          {item.total.toLocaleString()} 원
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 품목별 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
              {/* 매출 품목 TOP 10 */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    품목별 매출 TOP 10
                  </h2>
                </div>

                <ReactApexChart
                  options={{
                    chart: {
                      type: "bar",
                      fontFamily: "Inter, sans-serif",
                      toolbar: { show: false },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        borderRadius: 4,
                        dataLabels: {
                          position: "top",
                        },
                      },
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val) => val.toLocaleString() + " 원",
                      offsetX: 30,
                      style: {
                        fontSize: "12px",
                        colors: ["#304758"],
                      },
                    },
                    xaxis: {
                      categories: itemsChartData.salesData.map(
                        (item) => item.name
                      ),
                      labels: {
                        formatter: (val) => val.toLocaleString(),
                      },
                    },
                    colors: ["#4f46e5"],
                    tooltip: {
                      y: {
                        formatter: (value) => value.toLocaleString() + " 원",
                      },
                    },
                  }}
                  series={[
                    {
                      name: "매출액",
                      data: itemsChartData.salesData.map((item) => item.value),
                    },
                  ]}
                  type="bar"
                  height={350}
                />
              </div>

              {/* 매입 품목 TOP 10 */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    품목별 매입 TOP 10
                  </h2>
                </div>

                <ReactApexChart
                  options={{
                    chart: {
                      type: "bar",
                      fontFamily: "Inter, sans-serif",
                      toolbar: { show: false },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        borderRadius: 4,
                        dataLabels: {
                          position: "top",
                        },
                      },
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val) => val.toLocaleString() + " 원",
                      offsetX: 30,
                      style: {
                        fontSize: "12px",
                        colors: ["#304758"],
                      },
                    },
                    xaxis: {
                      categories: itemsChartData.purchaseData.map(
                        (item) => item.name
                      ),
                      labels: {
                        formatter: (val) => val.toLocaleString(),
                      },
                    },
                    colors: ["#10b981"],
                    tooltip: {
                      y: {
                        formatter: (value) => value.toLocaleString() + " 원",
                      },
                    },
                  }}
                  series={[
                    {
                      name: "매입액",
                      data: itemsChartData.purchaseData.map(
                        (item) => item.value
                      ),
                    },
                  ]}
                  type="bar"
                  height={350}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mx-5 mb-5">
            {/* 거래처별 매출 비중 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <PieChart className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  거래처별 매출 비중
                </h2>
              </div>

              <ReactApexChart
                options={{
                  labels: salesChart.labels,
                  legend: { position: "bottom" },
                  colors: [
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#bfdbfe",
                    "#dbeafe",
                    "#eff6ff",
                  ],
                  chart: {
                    fontFamily: "Inter, sans-serif",
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (val: number) => val.toFixed(1) + "%",
                  },
                  tooltip: {
                    y: {
                      formatter: (value: number) =>
                        value.toLocaleString() + " 원",
                    },
                  },
                }}
                series={salesChart.data}
                type="pie"
                height={300}
              />
            </div>

            {/* 아이템별 매출 차트 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <BarChart className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  품목별 매출 TOP 10
                </h2>
              </div>

              <ReactApexChart
                options={{
                  chart: {
                    type: "bar",
                    fontFamily: "Inter, sans-serif",
                    toolbar: { show: false },
                  },
                  plotOptions: {
                    bar: {
                      horizontal: true,
                      borderRadius: 4,
                      dataLabels: {
                        position: "top",
                      },
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (val) => val.toLocaleString() + " 원",
                    offsetX: 30,
                    style: {
                      fontSize: "12px",
                      colors: ["#304758"],
                    },
                  },
                  xaxis: {
                    categories: itemsChartData.salesData.map(
                      (item) => item.name
                    ),
                    labels: {
                      formatter: (val) => val.toLocaleString(),
                    },
                  },
                  colors: ["#4f46e5"],
                  tooltip: {
                    y: {
                      formatter: (value) => value.toLocaleString() + " 원",
                    },
                  },
                }}
                series={[
                  {
                    name: "매출액",
                    data: itemsChartData.salesData.map((item) => item.value),
                  },
                ]}
                type="bar"
                height={350}
              />
            </div>

            {/* 견적 금액 (Area Chart) */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  견적 금액
                </h2>
              </div>

              <ReactApexChart
                options={{
                  chart: {
                    type: "area",
                    fontFamily: "Inter, sans-serif",
                    toolbar: { show: false },
                  },
                  xaxis: {
                    categories: ["진행 중", "완료", "취소"],
                  },
                  yaxis: {
                    labels: {
                      formatter: (value) => value.toLocaleString(),
                    },
                  },
                  stroke: {
                    curve: "smooth",
                    width: 3,
                  },
                  fill: {
                    type: "gradient",
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.7,
                      opacityTo: 0.2,
                      stops: [0, 90, 100],
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (value) => value.toLocaleString(),
                  },
                  colors: ["#0ea5e9"],
                }}
                series={[
                  {
                    name: "견적 실적",
                    data: [
                      salesSummary?.[userId]?.estimates?.pending || 0,
                      salesSummary?.[userId]?.estimates?.completed || 0,
                      salesSummary?.[userId]?.estimates?.canceled || 0,
                    ],
                  },
                ]}
                type="area"
                height={300}
              />
            </div>

            {/* 매출 거래처 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  매출 거래처
                </h2>
              </div>

              {aggregatedSalesCompanies.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {aggregatedSalesCompanies.map((c: any, index: number) => (
                    <div
                      key={c.name}
                      className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                    >
                      <span className="font-medium text-slate-800">
                        {c.name}
                      </span>
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                        {c.total.toLocaleString()} 원
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <Users className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>매출 거래처가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "purchase" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mx-5 mb-5">
            {/* 거래처별 매입 비중 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <PieChart className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  거래처별 매입 비중
                </h2>
              </div>

              <ReactApexChart
                options={{
                  labels: purchaseChart.labels,
                  legend: { position: "bottom" },
                  colors: [
                    "#10b981",
                    "#34d399",
                    "#6ee7b7",
                    "#a7f3d0",
                    "#d1fae5",
                    "#ecfdf5",
                  ],
                  chart: {
                    fontFamily: "Inter, sans-serif",
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (val: number) => val.toFixed(1) + "%",
                  },
                  tooltip: {
                    y: {
                      formatter: (value: number) =>
                        value.toLocaleString() + " 원",
                    },
                  },
                }}
                series={purchaseChart.data}
                type="pie"
                height={300}
              />
            </div>

            {/* 아이템별 매입 차트 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <BarChart className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  품목별 매입 TOP 10
                </h2>
              </div>

              <ReactApexChart
                options={{
                  chart: {
                    type: "bar",
                    fontFamily: "Inter, sans-serif",
                    toolbar: { show: false },
                  },
                  plotOptions: {
                    bar: {
                      horizontal: true,
                      borderRadius: 4,
                      dataLabels: {
                        position: "top",
                      },
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (val) => val.toLocaleString() + " 원",
                    offsetX: 30,
                    style: {
                      fontSize: "12px",
                      colors: ["#304758"],
                    },
                  },
                  xaxis: {
                    categories: itemsChartData.purchaseData.map(
                      (item) => item.name
                    ),
                    labels: {
                      formatter: (val) => val.toLocaleString(),
                    },
                  },
                  colors: ["#10b981"],
                  tooltip: {
                    y: {
                      formatter: (value) => value.toLocaleString() + " 원",
                    },
                  },
                }}
                series={[
                  {
                    name: "매입액",
                    data: itemsChartData.purchaseData.map((item) => item.value),
                  },
                ]}
                type="bar"
                height={350}
              />
            </div>

            {/* 발주 금액 (Area Chart) */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  발주 금액
                </h2>
              </div>

              <ReactApexChart
                options={{
                  chart: {
                    type: "area",
                    fontFamily: "Inter, sans-serif",
                    toolbar: { show: false },
                  },
                  xaxis: {
                    categories: ["진행 중", "완료", "취소"],
                  },
                  yaxis: {
                    labels: {
                      formatter: (value) => value.toLocaleString(),
                    },
                  },
                  stroke: {
                    curve: "smooth",
                    width: 3,
                  },
                  fill: {
                    type: "gradient",
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.7,
                      opacityTo: 0.2,
                      stops: [0, 90, 100],
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (value) => value.toLocaleString(),
                  },
                  colors: ["#10b981"],
                }}
                series={[
                  {
                    name: "발주 실적",
                    data: [
                      salesSummary?.[userId]?.orders?.pending || 0,
                      salesSummary?.[userId]?.orders?.completed || 0,
                      salesSummary?.[userId]?.orders?.canceled || 0,
                    ],
                  },
                ]}
                type="area"
                height={300}
              />
            </div>

            {/* 매입 거래처 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  매입 거래처
                </h2>
              </div>

              {aggregatedPurchaseCompanies.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {aggregatedPurchaseCompanies.map((c: any, index: number) => (
                    <div
                      key={c.name}
                      className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                    >
                      <span className="font-medium text-slate-800">
                        {c.name}
                      </span>
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                        {c.total.toLocaleString()} 원
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <Users className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>매입 거래처가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                월별 매출/매입 추이
              </h2>
            </div>

            <div className="mb-6">
              <ReactApexChart
                options={{
                  chart: {
                    type: "line",
                    fontFamily: "Inter, sans-serif",
                    toolbar: { show: false },
                    zoom: { enabled: false },
                  },
                  stroke: {
                    width: [3, 3],
                    curve: "smooth",
                  },
                  markers: {
                    size: 4,
                    hover: {
                      size: 6,
                    },
                  },
                  xaxis: {
                    categories: monthlyTrendData.months,
                  },
                  yaxis: {
                    labels: {
                      formatter: (value) => value.toLocaleString(),
                    },
                  },
                  tooltip: {
                    y: {
                      formatter: (value) => value.toLocaleString() + " 원",
                    },
                  },
                  colors: ["#4f46e5", "#10b981"],
                  legend: {
                    position: "top",
                  },
                }}
                series={[
                  {
                    name: "매출",
                    data: monthlyTrendData.salesData,
                  },
                  {
                    name: "매입",
                    data: monthlyTrendData.purchaseData,
                  },
                ]}
                type="line"
                height={400}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    매출 추이
                  </h3>
                  {monthlyTrendData.salesData.length > 0 &&
                  monthlyTrendData.salesData[
                    monthlyTrendData.salesData.length - 1
                  ] > 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-2">
                  {monthlyTrendData.salesData.length > 0
                    ? monthlyTrendData.salesData[
                        monthlyTrendData.salesData.length - 1
                      ]?.toLocaleString() + " 원"
                    : "데이터 없음"}
                </p>
                <p className="text-sm text-slate-500">
                  {monthlyTrendData.salesData.length > 1
                    ? "이전 기간 대비 변동 있음"
                    : "비교 데이터 없음"}
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    매입 추이
                  </h3>
                  {monthlyTrendData.purchaseData.length > 0 &&
                  monthlyTrendData.purchaseData[
                    monthlyTrendData.purchaseData.length - 1
                  ] > 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-2">
                  {monthlyTrendData.purchaseData.length > 0
                    ? monthlyTrendData.purchaseData[
                        monthlyTrendData.purchaseData.length - 1
                      ]?.toLocaleString() + " 원"
                    : "데이터 없음"}
                </p>
                <p className="text-sm text-slate-500">
                  {monthlyTrendData.purchaseData.length > 1
                    ? "이전 기간 대비 변동 있음"
                    : "비교 데이터 없음"}
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    이익률
                  </h3>
                  <span className="text-slate-400">-</span>
                </div>
                {monthlyTrendData.salesData.length > 0 &&
                monthlyTrendData.purchaseData.length > 0 &&
                monthlyTrendData.salesData[
                  monthlyTrendData.salesData.length - 1
                ] > 0 ? (
                  <p className="text-3xl font-bold text-indigo-600 mb-2">
                    {Math.round(
                      (1 -
                        monthlyTrendData.purchaseData[
                          monthlyTrendData.purchaseData.length - 1
                        ] /
                          monthlyTrendData.salesData[
                            monthlyTrendData.salesData.length - 1
                          ]) *
                        100
                    )}
                    %
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-indigo-600 mb-2">
                    데이터 없음
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  매출 대비 매입 비율 기준
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                성과 지표
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 목표 달성률 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    목표 달성률
                  </h3>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                        진행 중
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600">
                        {performanceMetrics.targetAchievementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                    <div
                      style={{
                        width: `${Math.min(
                          performanceMetrics.targetAchievementRate,
                          100
                        )}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm text-slate-500">목표 금액</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {user?.target?.toLocaleString() || "-"} 원
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">달성 금액</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {completedSales?.toLocaleString()} 원
                    </p>
                  </div>
                </div>
              </div>

              {/* 견적 성공률 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    견적 성공률
                  </h3>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                        성공률
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-emerald-600">
                        {performanceMetrics.estimateSuccessRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-200">
                    <div
                      style={{
                        width: `${performanceMetrics.estimateSuccessRate}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm text-slate-500">총 견적 건수</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {estimates?.total || 0} 건
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">완료 건수</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {estimates?.completed || 0} 건
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 평균 거래 금액 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    평균 거래 금액
                  </h3>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600 mb-2">
                      {performanceMetrics.avgTransactionAmount.toLocaleString()}{" "}
                      원
                    </p>
                    <p className="text-sm text-slate-500">완료된 견적 기준</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-500">최소 금액</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {Math.floor(
                        performanceMetrics.avgTransactionAmount * 0.4
                      ).toLocaleString()}{" "}
                      원
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-500">평균 금액</p>
                    <p className="text-sm font-semibold text-indigo-600">
                      {performanceMetrics.avgTransactionAmount.toLocaleString()}{" "}
                      원
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-slate-500">최대 금액</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {Math.floor(
                        performanceMetrics.avgTransactionAmount * 1.8
                      ).toLocaleString()}{" "}
                      원
                    </p>
                  </div>
                </div>
              </div>

              {/* 상담 전환율 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Layers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    상담 전환율
                  </h3>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
                        전환율
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-amber-600">
                        {performanceMetrics.consultationToEstimateRate.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-amber-200">
                    <div
                      style={{
                        width: `${performanceMetrics.consultationToEstimateRate}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm text-slate-500">총 상담 건수</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {
                        (documentsDetails ?? []).flatMap(
                          (user: any) => user.consultations ?? []
                        ).length
                      }{" "}
                      건
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">견적 생성 건수</p>
                    <p className="text-lg font-semibold text-amber-600">
                      {estimates?.total || 0} 건
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <Building className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                거래처 분석
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      거래처명
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      상담 횟수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      견적 건수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      발주 건수
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      매출액
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      매입액
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {clientAnalysisData.length > 0 ? (
                    clientAnalysisData
                      .sort((a: any, b: any) => b.totalSales - a.totalSales)
                      .map((client: any, index: number) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                            {client.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                            {client.consultations}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                            {client.estimates}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                            {client.orders}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                            {client.totalSales.toLocaleString()} 원
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-emerald-600">
                            {client.totalPurchases.toLocaleString()} 원
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        거래처 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 거래처별 상담 빈도 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    거래처별 상담 빈도
                  </h3>
                </div>

                <ReactApexChart
                  options={{
                    chart: {
                      type: "bar",
                      fontFamily: "Inter, sans-serif",
                      toolbar: { show: false },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: "55%",
                        borderRadius: 4,
                      },
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    xaxis: {
                      categories: clientAnalysisData
                        .sort(
                          (a: any, b: any) => b.consultations - a.consultations
                        )
                        .slice(0, 5)
                        .map((client: any) => client.name),
                    },
                    colors: ["#4f46e5"],
                    tooltip: {
                      y: {
                        formatter: (value) => value + " 회",
                      },
                    },
                  }}
                  series={[
                    {
                      name: "상담 횟수",
                      data: clientAnalysisData
                        .sort(
                          (a: any, b: any) => b.consultations - a.consultations
                        )
                        .slice(0, 5)
                        .map((client: any) => client.consultations),
                    },
                  ]}
                  type="bar"
                  height={300}
                />
              </div>

              {/* 거래처별 매출 비중 */}
              <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    거래처별 매출 비중
                  </h3>
                </div>

                <ReactApexChart
                  options={{
                    chart: {
                      type: "donut",
                      fontFamily: "Inter, sans-serif",
                    },
                    labels: clientAnalysisData
                      .sort((a: any, b: any) => b.totalSales - a.totalSales)
                      .slice(0, 5)
                      .map((client: any) => client.name),
                    colors: [
                      "#3b82f6",
                      "#60a5fa",
                      "#93c5fd",
                      "#bfdbfe",
                      "#dbeafe",
                    ],
                    legend: {
                      position: "bottom",
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    tooltip: {
                      y: {
                        formatter: (value) => value.toLocaleString() + " 원",
                      },
                    },
                  }}
                  series={clientAnalysisData
                    .sort((a: any, b: any) => b.totalSales - a.totalSales)
                    .slice(0, 5)
                    .map((client: any) => client.totalSales)}
                  type="donut"
                  height={300}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "todo" && (
          <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                할 일 관리
              </h2>
            </div>

            <div className="rounded-lg">
              <TodoList userId={userId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
