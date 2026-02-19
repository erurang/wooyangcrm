"use client";

import dynamic from "next/dynamic";
import { FileText, BarChart3 } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DocumentCounts {
  pending: number;
  completed: number;
  canceled: number;
  total: number;
}

interface DocumentsTabProps {
  estimates: DocumentCounts | null;
  orders: DocumentCounts | null;
  pendingSales: number;
  completedSales: number;
  canceledSales: number;
  pendingPurchases: number;
  completedPurchases: number;
  canceledPurchases: number;
}

export default function DocumentsTab({
  estimates,
  orders,
  pendingSales,
  completedSales,
  canceledSales,
  pendingPurchases,
  completedPurchases,
  canceledPurchases,
}: DocumentsTabProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <FileText className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">문서 상태 요약</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 견적서 상태 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">견적서 상태</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-xs text-amber-600 font-semibold mb-1">
                진행 중
              </p>
              <p className="text-lg font-bold text-slate-800">
                {estimates?.pending || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {pendingSales.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <p className="text-xs text-emerald-600 font-semibold mb-1">
                완료됨
              </p>
              <p className="text-lg font-bold text-slate-800">
                {estimates?.completed || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {completedSales.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg text-center">
              <p className="text-xs text-rose-600 font-semibold mb-1">취소됨</p>
              <p className="text-lg font-bold text-slate-800">
                {estimates?.canceled || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {canceledSales.toLocaleString()} 원
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ReactApexChart
              options={{
                chart: {
                  type: "pie",
                  fontFamily: "Inter, sans-serif",
                },
                labels: ["진행 중", "완료됨", "취소됨"],
                colors: ["#fbbf24", "#10b981", "#f43f5e"],
                legend: {
                  position: "bottom",
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toFixed(1) + "%",
                },
                tooltip: {
                  y: {
                    formatter: (value) => value.toLocaleString() + " 원",
                  },
                },
              }}
              series={[pendingSales, completedSales, canceledSales]}
              type="pie"
              height={250}
            />
          </div>
        </div>

        {/* 발주서 상태 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">발주서 상태</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-xs text-amber-600 font-semibold mb-1">
                진행 중
              </p>
              <p className="text-lg font-bold text-slate-800">
                {orders?.pending || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {pendingPurchases.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <p className="text-xs text-emerald-600 font-semibold mb-1">
                완료됨
              </p>
              <p className="text-lg font-bold text-slate-800">
                {orders?.completed || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {completedPurchases.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg text-center">
              <p className="text-xs text-rose-600 font-semibold mb-1">취소됨</p>
              <p className="text-lg font-bold text-slate-800">
                {orders?.canceled || 0} 건
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {canceledPurchases.toLocaleString()} 원
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ReactApexChart
              options={{
                chart: {
                  type: "pie",
                  fontFamily: "Inter, sans-serif",
                },
                labels: ["진행 중", "완료됨", "취소됨"],
                colors: ["#fbbf24", "#10b981", "#f43f5e"],
                legend: {
                  position: "bottom",
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toFixed(1) + "%",
                },
                tooltip: {
                  y: {
                    formatter: (value) => value.toLocaleString() + " 원",
                  },
                },
              }}
              series={[pendingPurchases, completedPurchases, canceledPurchases]}
              type="pie"
              height={250}
            />
          </div>
        </div>
      </div>

      {/* 매출/매입 요약 */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-sky-50 p-2 rounded-md mr-3">
            <BarChart3 className="h-5 w-5 text-sky-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">매출/매입 요약</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-slate-700 mb-3">
              매출 상태
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  진행 매출
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {pendingSales.toLocaleString()} 원
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <p className="text-xs text-emerald-600 font-semibold mb-1">
                  확정 매출
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {completedSales.toLocaleString()} 원
                </p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg text-center">
                <p className="text-xs text-rose-600 font-semibold mb-1">
                  취소 매출
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {canceledSales.toLocaleString()} 원
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-slate-700 mb-3">
              매입 상태
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  진행 매입
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {pendingPurchases.toLocaleString()} 원
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <p className="text-xs text-emerald-600 font-semibold mb-1">
                  확정 매입
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {completedPurchases.toLocaleString()} 원
                </p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg text-center">
                <p className="text-xs text-rose-600 font-semibold mb-1">
                  취소 매입
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {canceledPurchases.toLocaleString()} 원
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
