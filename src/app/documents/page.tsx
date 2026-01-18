"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Document {
  type: "estimate" | "order" | "requestQuote";
  document_number: string;
  content: {
    items?: any[];
  };
  created_at: string;
  status: "pending" | "completed" | "canceled" | "expired";
  // 분리된 컬럼들
  company_name?: string;
  valid_until?: string | null;
}

// 만료임박 여부 확인 (7일 이내)
function isExpiringSoon(doc: Document): boolean {
  if (doc.status !== "pending" || !doc.valid_until) return false;
  const today = new Date();
  const expiryDate = new Date(doc.valid_until);
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

interface DashboardData {
  documentDetails: Document[];
}

export default function DocumentsDashboard() {
  const user = useLoginUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/documents?userId=${user?.id}`);
        const data = await response.json();
        setDashboardData({ documentDetails: data.documentDetails });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const filterDocumentsByType = (type: string) =>
    dashboardData?.documentDetails.filter((doc) => doc.type === type) || [];

  const tabs = [
    { name: "견적서", type: "estimate" },
    { name: "발주서", type: "order" },
    { name: "의뢰서", type: "requestQuote" },
  ];

  const documentSummary = tabs.map(({ type }) => {
    const documents = filterDocumentsByType(type);
    return {
      type,
      pending: documents.filter((doc) => doc.status === "pending").length,
      expiring_soon: documents.filter((doc) => isExpiringSoon(doc)).length,
      completed: documents.filter((doc) => doc.status === "completed").length,
      canceled: documents.filter((doc) => doc.status === "canceled").length,
      expired: documents.filter((doc) => doc.status === "expired").length,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500">문서 현황을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 상태 요약을 3개 컬럼으로 나눠서 표시 */}
          <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 pt-4">
            {documentSummary.map((doc) => (
              <div key={doc.type} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="font-semibold mb-3 text-slate-800">
                  {tabs.find((t) => t.type === doc.type)?.name} 상태 요약
                </h2>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "진행 중", key: "pending", color: "bg-slate-50 hover:bg-slate-100" },
                    { label: "만료임박", key: "expiring_soon", color: "bg-orange-50 hover:bg-orange-100" },
                    { label: "완료됨", key: "completed", color: "bg-emerald-50 hover:bg-emerald-100" },
                    { label: "취소됨", key: "canceled", color: "bg-red-50 hover:bg-red-100" },
                    { label: "만료됨", key: "expired", color: "bg-slate-100 hover:bg-slate-200" },
                  ].map(({ label, key, color }) => (
                    <div
                      key={key}
                      className={`${color} p-2.5 rounded-lg text-center cursor-pointer transition-colors ${
                        key === "expiring_soon" && doc.expiring_soon > 0 ? "ring-2 ring-orange-400" : ""
                      }`}
                      onClick={() =>
                        router.push(
                          `/documents/details?type=${doc.type}&status=${key}`
                        )
                      }
                    >
                      <p className={`font-medium text-xs ${
                        key === "expiring_soon" ? "text-orange-700" :
                        key === "completed" ? "text-emerald-700" :
                        key === "canceled" ? "text-red-700" :
                        "text-slate-600"
                      }`}>{label}</p>
                      <h3 className={`text-lg font-bold ${
                        key === "expiring_soon" && doc.expiring_soon > 0 ? "text-orange-600" :
                        key === "completed" ? "text-emerald-600" :
                        key === "canceled" ? "text-red-600" :
                        "text-slate-800"
                      }`}>
                        {doc[key as keyof typeof doc]}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 문서 유형별 진행 중 문서 테이블 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 pb-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">문서 진행 현황</h2>
              {tabs.map((tab) => {
                const documents = filterDocumentsByType(tab.type).filter(
                  (doc) => doc.status === "pending"
                );

                return (
                  <div key={tab.type} className="mb-5 last:mb-0">
                    <h3 className="font-medium text-slate-700 mb-2">{tab.name} 진행 중 문서</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">문서 번호</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">회사명</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">작성일</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">유효 기간</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {documents.slice(0, 3).map((doc) => {
                            const companyName = doc.company_name || "";
                            const validUntil = doc.valid_until || "";

                            return (
                              <tr
                                key={doc.document_number}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-3 py-2 text-sm text-indigo-600 font-medium">
                                  {doc.document_number}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-700">
                                  {companyName}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-600">
                                  {doc.created_at.slice(0, 10)}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-600">
                                  {validUntil?.slice(0, 10) || "없음"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 차트 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">문서 상태별 개수</h2>
              <ReactApexChart
                options={{
                  chart: { type: "bar" },
                  plotOptions: {
                    bar: { horizontal: false, columnWidth: "55%" },
                  },
                  dataLabels: { enabled: false },
                  stroke: { show: true, width: 1, colors: ["transparent"] },
                  xaxis: {
                    categories: tabs.map((tab) => tab.name), // X축: 견적서, 발주서, 의뢰서
                  },
                  yaxis: {
                    title: { text: "문서 개수" },
                    labels: {
                      formatter: (value: number) =>
                        Math.floor(value).toString(),
                    }, // 🔥 string 변환
                  },
                  fill: { opacity: 1 },
                  tooltip: {
                    y: { formatter: (value: number) => `${value}개` },
                  },
                }}
                series={[
                  {
                    name: "진행 중",
                    data: documentSummary.map((doc) => doc.pending),
                    color: "#42A5F5",
                  },
                  {
                    name: "완료됨",
                    data: documentSummary.map((doc) => doc.completed),
                    color: "#66BB6A",
                  },
                  {
                    name: "취소됨",
                    data: documentSummary.map((doc) => doc.canceled),
                    color: "#8E24AA",
                  },
                  {
                    name: "만료됨",
                    data: documentSummary.map((doc) => doc.expired),
                    color: "#9E9E9E",
                  },
                ]}
                type="bar"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
