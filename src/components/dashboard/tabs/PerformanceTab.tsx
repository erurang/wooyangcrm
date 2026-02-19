"use client";

import { Target, FileText, Briefcase, Layers } from "lucide-react";

interface DocumentCounts {
  total: number;
  pending: number;
  completed: number;
  canceled: number;
}

interface PerformanceMetrics {
  targetAchievementRate: number;
  estimateSuccessRate: number;
  avgTransactionAmount: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  consultationToEstimateRate: number;
}

interface PerformanceTabProps {
  performanceMetrics: PerformanceMetrics;
  userTarget: number | undefined;
  completedSales: number;
  estimates: DocumentCounts | null;
  totalConsultations: number;
}

export default function PerformanceTab({
  performanceMetrics,
  userTarget,
  completedSales,
  estimates,
  totalConsultations,
}: PerformanceTabProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <Target className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">성과 지표</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 목표 달성률 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <Target className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              목표 달성률
            </h3>
          </div>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
                  진행 중
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-sky-600">
                  {performanceMetrics.targetAchievementRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-sky-200">
              <div
                style={{
                  width: `${Math.min(
                    performanceMetrics.targetAchievementRate,
                    100
                  )}%`,
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-sky-500"
              ></div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-sm text-slate-500">목표 금액</p>
              <p className="text-lg font-semibold text-slate-800">
                {userTarget?.toLocaleString() || "-"} 원
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">달성 금액</p>
              <p className="text-lg font-semibold text-sky-600">
                {completedSales?.toLocaleString()} 원
              </p>
            </div>
          </div>
        </div>

        {/* 견적 성공률 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <FileText className="h-5 w-5 text-sky-600" />
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
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <Briefcase className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              평균 거래 금액
            </h3>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600 mb-2">
                {performanceMetrics.avgTransactionAmount.toLocaleString()} 원
              </p>
              <p className="text-sm text-slate-500">완료된 견적 기준</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <p className="text-xs text-slate-500">최소 금액</p>
              <p className="text-sm font-semibold text-slate-800">
                {performanceMetrics.minTransactionAmount.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-sky-50 p-3 rounded-lg text-center">
              <p className="text-xs text-slate-500">평균 금액</p>
              <p className="text-sm font-semibold text-sky-600">
                {performanceMetrics.avgTransactionAmount.toLocaleString()} 원
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <p className="text-xs text-slate-500">최대 금액</p>
              <p className="text-sm font-semibold text-slate-800">
                {performanceMetrics.maxTransactionAmount.toLocaleString()} 원
              </p>
            </div>
          </div>
        </div>

        {/* 상담 전환율 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <Layers className="h-5 w-5 text-sky-600" />
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
                  {performanceMetrics.consultationToEstimateRate.toFixed(1)}%
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
                {totalConsultations} 건
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
  );
}
