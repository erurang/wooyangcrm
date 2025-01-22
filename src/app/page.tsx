"use client";

import { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { Bar } from "react-chartjs-2";
import "chart.js/auto"; // Chart.js 자동 설정
import { useLoginUser } from "./context/login";
import UserGreeting from "@/components/dashboard/UserGreeting";
import GreetingComponent from "@/components/dashboard/Greeting";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

interface Document {
  type: "estimate" | "order" | "requestQuote";
  document_number: string;
  date: string;
  content: {
    company_name: string;
    valid_until: string;
  };
  contact: string;
  created_at: string;
  status: "pending" | "completed" | "canceled";
}

interface DashboardData {
  documents: {
    type: "estimate" | "order" | "requestQuote";
    statusCounts: {
      pending: number;
      completed: number;
      canceled: number;
      unknown: number;
    };
  }[];
  documentDetails: Document[]; // 추가
}

export default function SalesDashboard() {
  const user = useLoginUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?userId=${user?.id}`);
      const data = await response.json();

      // `documents` 데이터 가공
      const sortedDocuments = data.documents.sort(
        (a: Document, b: Document) => {
          const order = { estimate: 1, order: 2, requestQuote: 3 };
          return order[a.type] - order[b.type];
        }
      );

      // `dashboardData`에 상세 정보 포함
      setDashboardData({
        documents: sortedDocuments,
        documentDetails: data.documentDetails, // Include detailed documents
      });
    } catch (error) {
      setSnackbarMessage("대시보드 데이터를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return null;
  }
  const pendingDocuments = dashboardData?.documentDetails.filter(
    (doc) => doc.status === "pending"
  );
  const completedDocuments = dashboardData?.documentDetails.filter(
    (doc) => doc.status === "completed"
  );
  const canceledDocuments = dashboardData?.documentDetails.filter(
    (doc) => doc.status === "canceled"
  );
  const expiredPendingDocuments = pendingDocuments?.filter(
    (doc) => new Date(doc.content.valid_until) < new Date()
  );

  // 문서 상태별 막대 그래프 데이터
  const barData = {
    labels: ["견적서", "발주서", "의뢰서"],
    datasets: [
      {
        label: "진행 중",
        backgroundColor: "#42A5F5",
        data: [
          pendingDocuments?.filter((doc) => doc.type === "estimate").length ||
            0,
          pendingDocuments?.filter((doc) => doc.type === "order").length || 0,
          pendingDocuments?.filter((doc) => doc.type === "requestQuote")
            .length || 0,
        ],
      },
      {
        label: "완료",
        backgroundColor: "#66BB6A",
        data: [
          completedDocuments?.filter((doc) => doc.type === "estimate").length ||
            0,
          completedDocuments?.filter((doc) => doc.type === "order").length || 0,
          completedDocuments?.filter((doc) => doc.type === "requestQuote")
            .length || 0,
        ],
      },
      {
        label: "취소",
        backgroundColor: "#8E24AA",
        data: [
          canceledDocuments?.filter((doc) => doc.type === "estimate").length ||
            0,
          canceledDocuments?.filter((doc) => doc.type === "order").length || 0,
          canceledDocuments?.filter((doc) => doc.type === "requestQuote")
            .length || 0,
        ],
      },
    ],
  };

  return (
    <div className="text-sm text-[#37352F]">
      {/* 사용자 맞춤 인사 */}
      <p className="mb-4 font-semibold">대시보드</p>
      <div>
        <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4 mb-6 col-span-1">
          <UserGreeting
            level={user.level}
            name={user.name}
            position={user.position}
          />
          <GreetingComponent />
        </div>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <div>
          <div>
            <div className="grid grid-cols-2 space-x-4">
              <div className="col-span-1">
                <h2 className="font-semibold text-md mb-4">상태별 문서 내역</h2>
                <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4">
                  <section className="mb-8">
                    {[
                      {
                        title: "진행 중 문서",
                        documents: pendingDocuments,
                      },
                      {
                        title: "유효 기간 만료된 진행 중 문서",
                        documents: expiredPendingDocuments,
                      },
                      {
                        title: "취소된 문서",
                        documents: canceledDocuments,
                      },
                      {
                        title: "완료된 문서",
                        documents: completedDocuments,
                      },
                    ].map(({ title, documents }) => (
                      <div key={uuidv4()} className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold">{title}</h3>
                          <Link
                            href={`/documents`}
                            // href={`/documents/${title
                            //   .replace(/\s/g, "-")
                            //   .toLowerCase()}`}
                            className="text-xs  hover:text-blue-500 cursor-pointer text-gray-400"
                          >
                            전체보기
                          </Link>
                        </div>
                        <table className="min-w-full table-auto border-collapse text-left">
                          <thead>
                            <tr className="bg-gray-100 text-center">
                              <th className="px-4 py-2 border-b">유형</th>
                              <th className="px-4 py-2 border-b">회사명</th>
                              <th className="px-4 py-2 border-b">문서 번호</th>
                              <th className="px-4 py-2 border-b">작성일</th>
                              <th className="px-4 py-2 border-b">유효 기간</th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {documents?.slice(0, 3).map((doc) => (
                              <tr key={uuidv4()} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">
                                  {doc.type === "estimate" && "견적서"}
                                  {doc.type === "order" && "발주서"}
                                  {doc.type === "requestQuote" && "의뢰서"}
                                </td>
                                <td className="px-4 py-2 border-b">
                                  {doc.content.company_name}
                                </td>
                                <td className="px-4 py-2 border-b">
                                  {doc.document_number}
                                </td>
                                <td className="px-4 py-2 border-b">
                                  {doc.created_at?.slice(0, 10)}
                                </td>
                                <td className="px-4 py-2 border-b">
                                  {doc.content.valid_until?.slice(0, 10)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="col-span-1">
                <section className="mb-8">
                  <h2 className="font-semibold text-md mb-4">문서 내역</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4">
                      <p className="font-semibold text-gray-700">총 문서 수</p>
                      <h3 className="text-xl font-bold">
                        {dashboardData?.documentDetails.length || 0}
                      </h3>
                    </div>
                    <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4">
                      <p className="font-semibold text-gray-700">
                        진행 중 문서
                      </p>
                      <h3 className="text-xl font-bold">
                        {pendingDocuments?.length || 0}
                      </h3>
                    </div>
                    <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4">
                      <p className="font-semibold text-gray-700">완료된 문서</p>
                      <h3 className="text-xl font-bold">
                        {completedDocuments?.length || 0}
                      </h3>
                    </div>
                  </div>
                </section>

                {/* 문서 상태 요약 */}
                <section className="mb-8">
                  <h2 className="font-semibold text-md mb-4">문서 상태 요약</h2>
                  <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4 min-h-[32rem]">
                    <Bar
                      data={barData}
                      options={{
                        plugins: {
                          legend: { display: true },
                        },
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                          y: {
                            ticks: {
                              precision: 0, // 소수점 제거
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스낵바 */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
