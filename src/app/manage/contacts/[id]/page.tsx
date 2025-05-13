"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Package,
  Search,
  BarChart,
  PieChart,
  TrendingUp,
  Download,
} from "lucide-react";
import { useContactDetails } from "@/hooks/manage/contacts/detail/useContactDetails";

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ApexCharts type declaration
declare type ApexCharts = any;

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const contactId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  // Get URL parameters or use defaults
  const initialDateFilter =
    (searchParams.get("dateFilter") as "year" | "quarter" | "month") || "month";
  const initialYear = Number.parseInt(
    searchParams.get("year") || new Date().getFullYear().toString(),
    10
  );
  const initialQuarter = Number.parseInt(
    searchParams.get("quarter") || "1",
    10
  );
  const initialMonth = Number.parseInt(
    searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    10
  );
  const initialTab =
    (searchParams.get("tab") as
      | "overview"
      | "consultations"
      | "documents"
      | "analytics") || "overview";

  // State for filters and tabs
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    initialDateFilter
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedQuarter, setSelectedQuarter] =
    useState<number>(initialQuarter);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [activeTab, setActiveTab] = useState<
    "overview" | "consultations" | "documents" | "analytics"
  >(initialTab);
  const [documentFilter, setDocumentFilter] = useState<
    "all" | "estimate" | "order"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "canceled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate date range based on filters
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    const startMonth = (selectedQuarter - 1) * 3 + 1;
    startDate = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
    // Calculate end date for the quarter
    const endMonth = startMonth + 2;
    const lastDay = new Date(selectedYear, endMonth, 0).getDate();
    endDate = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    // Calculate last day of the month
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    endDate = `${selectedYear}-${String(selectedMonth).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;
  }

  // Fetch contact data
  const { contactData, isLoading, error } = useContactDetails(
    contactId,
    startDate,
    endDate
  );

  // Update URL when filters change
  // useEffect(() => {
  //   const params = new URLSearchParams(searchParams.toString());
  //   params.set("dateFilter", dateFilter);
  //   params.set("year", selectedYear.toString());

  //   if (dateFilter === "quarter") {
  //     params.set("quarter", selectedQuarter.toString());
  //   }

  //   if (dateFilter === "month") {
  //     params.set("month", selectedMonth.toString());
  //   }

  //   params.set("tab", activeTab);

  //   router.push(`/manage/contacts/${contactId}?${params.toString()}`, {
  //     scroll: false,
  //   });
  // }, [
  //   dateFilter,
  //   selectedYear,
  //   selectedQuarter,
  //   selectedMonth,
  //   activeTab,
  //   contactId,
  //   router,
  //   searchParams,
  // ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            오류가 발생했습니다
          </h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!contactData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">
            데이터를 찾을 수 없습니다
          </h3>
          <p className="text-yellow-600">
            요청하신 담당자 정보를 찾을 수 없습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // Process data for display
  const documents = contactData.consultations.flatMap((c: any) => c.documents);

  // Filter documents by type and status
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesType = documentFilter === "all" || doc.type === documentFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesType && matchesStatus;
  });

  // Filter consultations by search term
  const filteredConsultations = contactData.consultations.filter(
    (consultation: any) => {
      if (!searchTerm) return true;
      return consultation.content
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    }
  );

  // Calculate sales and purchase amounts by status
  const confirmedSales = documents
    .filter((doc: any) => doc.status === "completed" && doc.type === "estimate")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  const confirmedPurchases = documents
    .filter((doc: any) => doc.status === "completed" && doc.type === "order")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  const pendingSales = documents
    .filter((doc: any) => doc.status === "pending" && doc.type === "estimate")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  const pendingPurchases = documents
    .filter((doc: any) => doc.status === "pending" && doc.type === "order")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  const canceledSales = documents
    .filter((doc: any) => doc.status === "canceled" && doc.type === "estimate")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  const canceledPurchases = documents
    .filter((doc: any) => doc.status === "canceled" && doc.type === "order")
    .reduce(
      (sum: number, doc: any) =>
        sum +
        doc.items.reduce(
          (subSum: number, item: any) => subSum + item.amount,
          0
        ),
      0
    );

  // Calculate total sales and purchases
  const totalSales = confirmedSales + pendingSales + canceledSales;
  const totalPurchases =
    confirmedPurchases + pendingPurchases + canceledPurchases;

  // Prepare data for charts
  const salesStatusData = [confirmedSales, pendingSales, canceledSales];
  const purchaseStatusData = [
    confirmedPurchases,
    pendingPurchases,
    canceledPurchases,
  ];

  // Get top products by sales amount
  const allProducts = documents
    .filter((doc: any) => doc.type === "estimate")
    .flatMap((doc: any) => doc.items)
    .reduce((acc: any, item: any) => {
      const key = `${item.name}-${item.spec}`;
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          spec: item.spec,
          amount: 0,
          count: 0,
        };
      }
      acc[key].amount += item.amount;
      acc[key].count += 1;
      return acc;
    }, {});

  const topProducts = Object.values(allProducts)
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5);

  // Get consultation trend data
  const consultationsByMonth: Record<string, number> = {};

  contactData.consultations.forEach((consultation: any) => {
    const date = new Date(consultation.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!consultationsByMonth[monthKey]) {
      consultationsByMonth[monthKey] = 0;
    }

    consultationsByMonth[monthKey] += 1;
  });

  const trendMonths = Object.keys(consultationsByMonth).sort();
  const trendData = trendMonths.map((month) => consultationsByMonth[month]);

  // Helper function to format status text
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

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "canceled":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get document type text
  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case "estimate":
        return "견적서";
      case "order":
        return "발주서";
      default:
        return "문서";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      {/* Contact Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">
                {contactData.contact_name}
                <span className="ml-2 text-lg font-normal text-slate-500">
                  {contactData.level || ""}
                </span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                <Link
                  href={`/consultations/${contactData.company_id}`}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {contactData.company_name}
                </Link>
                <span className="text-slate-400">|</span>
                <span>{contactData.department || "부서 정보 없음"}</span>
              </div>

              <div className="flex items-center gap-4">
                {contactData.mobile && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{contactData.mobile}</span>
                  </div>
                )}

                {contactData.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{contactData.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            >
              뒤로 가기
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>내보내기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">
            데이터 기간 선택
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              연도
            </label>
            <select
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from(
                { length: new Date().getFullYear() - 2010 + 1 },
                (_, i) => (
                  <option key={i} value={new Date().getFullYear() - i}>
                    {new Date().getFullYear() - i}년
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              기간 단위
            </label>
            <select
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "year" | "quarter" | "month")
              }
            >
              <option value="year">연도별</option>
              <option value="quarter">분기별</option>
              <option value="month">월별</option>
            </select>
          </div>

          {dateFilter === "quarter" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                분기
              </label>
              <select
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

          {dateFilter === "month" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                월
              </label>
              <select
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

          <div className="flex items-end">
            <span className="text-sm text-slate-600 mb-2">
              {startDate} ~ {endDate}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-t border-b border-slate-200 p-1 mb-6">
        <div className="flex flex-wrap space-x-1 max-w-7xl mx-auto">
          <button
            className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              개요
            </span>
          </button>

          <button
            className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "consultations"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("consultations")}
          >
            <span className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              상담 내역
            </span>
          </button>

          <button
            className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "documents"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            <span className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              문서 관리
            </span>
          </button>

          <button
            className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <span className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              분석
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500">총 매출</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalSales.toLocaleString()} 원
                  </p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-md">
                  <ArrowUpRight className="h-5 w-5 text-indigo-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                    확정
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {confirmedSales.toLocaleString()} 원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <Clock className="h-3.5 w-3.5 text-amber-500 mr-1" />
                    진행 중
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {pendingSales.toLocaleString()} 원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <XCircle className="h-3.5 w-3.5 text-rose-500 mr-1" />
                    취소
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {canceledSales.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

            {/* Total Purchases */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500">총 매입</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalPurchases.toLocaleString()} 원
                  </p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-md">
                  <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                    확정
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {confirmedPurchases.toLocaleString()} 원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <Clock className="h-3.5 w-3.5 text-amber-500 mr-1" />
                    진행 중
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {pendingPurchases.toLocaleString()} 원
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <XCircle className="h-3.5 w-3.5 text-rose-500 mr-1" />
                    취소
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {canceledPurchases.toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>

            {/* Consultation Count */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500">상담 건수</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {contactData.consultations.length} 건
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-md">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (contactData.consultations.length / 10) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  최근{" "}
                  {dateFilter === "year"
                    ? "1년"
                    : dateFilter === "quarter"
                    ? "분기"
                    : "월"}{" "}
                  동안의 상담 건수
                </p>
              </div>
            </div>

            {/* Document Count */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-500">문서 건수</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {documents.length} 건
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-md">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">견적서</span>
                  <span className="text-sm font-medium text-slate-800">
                    {
                      documents.filter((doc: any) => doc.type === "estimate")
                        .length
                    }{" "}
                    건
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">발주서</span>
                  <span className="text-sm font-medium text-slate-800">
                    {
                      documents.filter((doc: any) => doc.type === "order")
                        .length
                    }{" "}
                    건
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Status Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">
                  매출 상태 분석
                </h2>
              </div>

              <div className="h-64">
                <ReactApexChart
                  options={{
                    labels: ["확정", "진행 중", "취소"],
                    colors: ["#10b981", "#f59e0b", "#ef4444"],
                    legend: {
                      position: "bottom",
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number) => val.toFixed(1) + "%",
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) =>
                          val.toLocaleString() + " 원",
                      },
                    },
                    chart: {
                      fontFamily: "Inter, sans-serif",
                    },
                  }}
                  series={salesStatusData}
                  type="pie"
                  height="100%"
                />
              </div>
            </div>

            {/* Purchase Status Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">
                  매입 상태 분석
                </h2>
              </div>

              <div className="h-64">
                <ReactApexChart
                  options={{
                    labels: ["확정", "진행 중", "취소"],
                    colors: ["#10b981", "#f59e0b", "#ef4444"],
                    legend: {
                      position: "bottom",
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number) => val.toFixed(1) + "%",
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) =>
                          val.toLocaleString() + " 원",
                      },
                    },
                    chart: {
                      fontFamily: "Inter, sans-serif",
                    },
                  }}
                  series={purchaseStatusData}
                  type="pie"
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Recent Consultations */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-slate-800">
                  최근 상담 내역
                </h2>
              </div>

              <button
                onClick={() => setActiveTab("consultations")}
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                모두 보기
              </button>
            </div>

            <div className="space-y-4">
              {contactData.consultations
                .slice(0, 3)
                .map((consultation: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-slate-800">
                        {consultation.date}
                      </span>
                      <span className="text-xs text-slate-500">
                        {consultation.documents.length > 0
                          ? `${consultation.documents.length}개 문서`
                          : "문서 없음"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-2">
                      {consultation.content}
                    </p>
                  </div>
                ))}

              {contactData.consultations.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>상담 내역이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "consultations" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">
                상담 내역
              </h2>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="상담 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2">
            {filteredConsultations.length > 0 ? (
              filteredConsultations.map((consultation: any, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_1.5fr] gap-6 items-start border-b border-slate-200 pb-6"
                >
                  {/* Consultation Content */}
                  <div className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-indigo-50 cursor-pointer transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">
                        {consultation.date}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-line text-sm">
                      {consultation.content}
                    </p>
                  </div>

                  {/* Related Documents */}
                  <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                    {consultation.documents.length > 0 ? (
                      consultation.documents.map(
                        (doc: any, docIndex: number) => (
                          <div
                            key={docIndex}
                            className="mb-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
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
                              {getDocumentTypeText(doc.type)}:{" "}
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
                        )
                      )
                    ) : (
                      <p className="text-slate-400 text-sm">
                        📂 관련 문서 없음
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                    {consultation.documents.length > 0 ? (
                      consultation.documents.flatMap((doc: any) =>
                        doc.items.length > 0 ? (
                          doc.items.map((item: any, itemIndex: number) => (
                            <div
                              key={`${doc.document_number}-${itemIndex}`}
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
                                {Number(item.amount).toLocaleString()} 원
                              </span>
                            </div>
                          ))
                        ) : (
                          <p
                            key={doc.document_number}
                            className="text-slate-400 text-sm mb-2"
                          >
                            📦 {getDocumentTypeText(doc.type)} 품목 없음
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-slate-400 text-sm">📦 품목 없음</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">검색 결과가 없습니다</p>
                <p className="text-slate-400 text-sm mt-2">
                  다른 검색어로 시도해보세요
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">
                문서 관리
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={documentFilter}
                onChange={(e) =>
                  setDocumentFilter(
                    e.target.value as "all" | "estimate" | "order"
                  )
                }
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">모든 문서</option>
                <option value="estimate">견적서</option>
                <option value="order">발주서</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "completed"
                      | "canceled"
                  )
                }
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">진행 중</option>
                <option value="completed">완료됨</option>
                <option value="canceled">취소됨</option>
              </select>
            </div>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      문서 번호
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      유형
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      생성일
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      담당자
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      상태
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredDocuments.map((doc: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                        {doc.document_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {getDocumentTypeText(doc.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {doc.created_at.split("T")[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {doc.user.name} ({doc.user.level})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status === "pending" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {doc.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {doc.status === "canceled" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {getStatusText(doc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-800">
                        {doc.items
                          .reduce(
                            (sum: number, item: any) => sum + item.amount,
                            0
                          )
                          .toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">문서가 없습니다</p>
              <p className="text-slate-400 text-sm mt-2">필터를 변경해보세요</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center mb-6">
              <Package className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">
                인기 품목 TOP 5
              </h2>
            </div>

            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        순위
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        품목명
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        규격
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        거래 횟수
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        총 금액
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {topProducts.map((product: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {product.spec || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">
                          {product.count}회
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-600">
                          {product.amount.toLocaleString()} 원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">품목 데이터가 없습니다</p>
              </div>
            )}
          </div>

          {/* Consultation Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">
                상담 추이
              </h2>
            </div>

            {trendMonths.length > 0 ? (
              <div className="h-80">
                <ReactApexChart
                  options={{
                    chart: {
                      type: "line",
                      fontFamily: "Inter, sans-serif",
                      toolbar: {
                        show: false,
                      },
                    },
                    xaxis: {
                      categories: trendMonths.map((month) => {
                        const [year, monthNum] = month.split("-");
                        return `${year}.${monthNum}`;
                      }),
                    },
                    stroke: {
                      curve: "smooth",
                      width: 3,
                    },
                    colors: ["#4f46e5"],
                    markers: {
                      size: 5,
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) => val + "건",
                      },
                    },
                  }}
                  series={[
                    {
                      name: "상담 건수",
                      data: trendData,
                    },
                  ]}
                  type="line"
                  height="100%"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">상담 데이터가 없습니다</p>
              </div>
            )}
          </div>

          {/* Sales vs Purchase Comparison */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center mb-6">
              <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-800">
                매출/매입 비교
              </h2>
            </div>

            <div className="h-80">
              <ReactApexChart
                options={{
                  chart: {
                    type: "bar",
                    fontFamily: "Inter, sans-serif",
                    toolbar: {
                      show: false,
                    },
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
                    categories: ["확정", "진행 중", "취소", "총계"],
                  },
                  colors: ["#4f46e5", "#10b981"],
                  legend: {
                    position: "top",
                  },
                  tooltip: {
                    y: {
                      formatter: (val: number) => val.toLocaleString() + " 원",
                    },
                  },
                }}
                series={[
                  {
                    name: "매출",
                    data: [
                      confirmedSales,
                      pendingSales,
                      canceledSales,
                      totalSales,
                    ],
                  },
                  {
                    name: "매입",
                    data: [
                      confirmedPurchases,
                      pendingPurchases,
                      canceledPurchases,
                      totalPurchases,
                    ],
                  },
                ]}
                type="bar"
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
