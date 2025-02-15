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
    company_name: string;
    valid_until?: string;
  };
  created_at: string;
  status: "pending" | "completed" | "canceled";
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
      completed: documents.filter((doc) => doc.status === "completed").length,
      canceled: documents.filter((doc) => doc.status === "canceled").length,
    };
  });

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">문서 관리</p>
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <>
          {/* 상태 요약을 3개 컬럼으로 나눠서 표시 */}
          <div className="mb-6 bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md grid grid-cols-3 gap-4">
            {documentSummary.map((doc) => (
              <div key={doc.type} className="bg-white p-4 rounded-md shadow-md">
                <h2 className="font-semibold mb-2">
                  {tabs.find((t) => t.type === doc.type)?.name} 상태 요약
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "진행 중", key: "pending" },
                    { label: "완료됨", key: "completed" },
                    { label: "취소됨", key: "canceled" },
                  ].map(({ label, key }) => (
                    <div
                      key={key}
                      className="bg-gray-100 p-4 rounded-md text-center cursor-pointer hover:bg-gray-200"
                      onClick={() =>
                        router.push(
                          `/documents/details?type=${doc.type}&status=${key}`
                        )
                      }
                    >
                      <p className="font-semibold text-gray-700">{label}</p>
                      <h3 className="text-xl font-bold">
                        {doc[key as keyof typeof doc]}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 문서 유형별 진행 중 문서 테이블 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-6 bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md">
              <h2 className="font-semibold text-md mb-4">문서 진행 현황</h2>
              {tabs.map((tab) => {
                const documents = filterDocumentsByType(tab.type).filter(
                  (doc) => doc.status === "pending"
                );

                return (
                  <div key={tab.type} className="mb-6">
                    <h3 className="font-bold mb-2">{tab.name} 진행 중 문서</h3>
                    <table className="min-w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className="bg-gray-100 text-center">
                          <th className="px-4 py-2 border-b">문서 번호</th>
                          <th className="px-4 py-2 border-b">회사명</th>
                          <th className="px-4 py-2 border-b">작성일</th>
                          <th className="px-4 py-2 border-b">유효 기간</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {documents.slice(0, 3).map((doc) => (
                          <tr
                            key={doc.document_number}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-2 border-b">
                              {doc.document_number}
                            </td>
                            <td className="px-4 py-2 border-b">
                              {doc.content.company_name}
                            </td>
                            <td className="px-4 py-2 border-b">
                              {doc.created_at.slice(0, 10)}
                            </td>
                            <td className="px-4 py-2 border-b">
                              {doc.content.valid_until?.slice(0, 10) || "없음"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
            {/* 차트 */}
            <div className="bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md">
              <h2 className="font-semibold text-md mb-4">문서 상태별 개수</h2>
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
