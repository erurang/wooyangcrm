"use client";

import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  PieChart,
} from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface OverviewTabProps {
  totalSales: number;
  totalPurchases: number;
  confirmedSales: number;
  confirmedPurchases: number;
  pendingSales: number;
  pendingPurchases: number;
  canceledSales: number;
  canceledPurchases: number;
  consultationsCount: number;
  documentsCount: number;
  estimatesCount: number;
  ordersCount: number;
  dateFilter: string;
  consultations: any[];
  onViewAllConsultations: () => void;
}

export default function OverviewTab({
  totalSales,
  totalPurchases,
  confirmedSales,
  confirmedPurchases,
  pendingSales,
  pendingPurchases,
  canceledSales,
  canceledPurchases,
  consultationsCount,
  documentsCount,
  estimatesCount,
  ordersCount,
  dateFilter,
  consultations,
  onViewAllConsultations,
}: OverviewTabProps) {
  const salesStatusData = [confirmedSales, pendingSales, canceledSales];
  const purchaseStatusData = [
    confirmedPurchases,
    pendingPurchases,
    canceledPurchases,
  ];

  return (
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
                {consultationsCount} 건
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
                  width: `${Math.min((consultationsCount / 10) * 100, 100)}%`,
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
                {documentsCount} 건
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
                {estimatesCount} 건
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">발주서</span>
              <span className="text-sm font-medium text-slate-800">
                {ordersCount} 건
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
                legend: { position: "bottom" },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toFixed(1) + "%",
                },
                tooltip: {
                  y: { formatter: (val: number) => val.toLocaleString() + " 원" },
                },
                chart: { fontFamily: "Inter, sans-serif" },
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
                legend: { position: "bottom" },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toFixed(1) + "%",
                },
                tooltip: {
                  y: { formatter: (val: number) => val.toLocaleString() + " 원" },
                },
                chart: { fontFamily: "Inter, sans-serif" },
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
            onClick={onViewAllConsultations}
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            모두 보기
          </button>
        </div>

        <div className="space-y-4">
          {consultations.slice(0, 3).map((consultation: any, index: number) => (
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

          {consultations.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>상담 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
