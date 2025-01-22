"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { Tab } from "@headlessui/react";
import { v4 as uuidv4 } from "uuid";
import { useLoginUser } from "../context/login";
import { useRouter } from "next/navigation";

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
        const response = await fetch(`/api/dashboard?userId=${user?.id}`);
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

  const getStatusCounts = (documents: Document[]) => ({
    total: documents.length,
    pending: documents.filter((doc) => doc.status === "pending").length,
    completed: documents.filter((doc) => doc.status === "completed").length,
    canceled: documents.filter((doc) => doc.status === "canceled").length,
  });

  const groupByDateAndStatus = (documents: Document[]) => {
    const grouped: Record<string, Record<string, number>> = {};

    documents.forEach((doc) => {
      const date = doc.created_at?.slice(0, 10);
      const status = doc.status;

      if (!grouped[date]) {
        grouped[date] = { pending: 0, completed: 0, canceled: 0, expired: 0 };
      }

      if (status === "pending") {
        grouped[date].pending += 1;
        if (
          doc.content.valid_until &&
          new Date(doc.content.valid_until) < new Date()
        ) {
          grouped[date].expired += 1;
        }
      } else {
        grouped[date][status] += 1;
      }
    });

    return grouped;
  };

  const tabs = [
    { name: "견적서", type: "estimate" },
    { name: "발주서", type: "order" },
    { name: "의뢰서", type: "requestQuote" },
  ];

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold ">문서 관리</p>
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <Tab.Group>
          <Tab.List className="flex space-x-4 mb-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.type}
                className={({ selected }) =>
                  `px-4 py-2 rounded-md ${
                    selected
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {tabs.map((tab) => {
              const documents = filterDocumentsByType(tab.type);
              const { total, pending, completed, canceled } =
                getStatusCounts(documents);

              const groupedData = groupByDateAndStatus(documents);

              const dates = Object.keys(groupedData).sort();
              const pendingData = dates.map(
                (date) => groupedData[date].pending
              );
              const completedData = dates.map(
                (date) => groupedData[date].completed
              );
              const canceledData = dates.map(
                (date) => groupedData[date].canceled
              );
              const expiredData = dates.map(
                (date) => groupedData[date].expired
              );

              const lineData = {
                labels: dates,
                datasets: [
                  {
                    label: "진행 중",
                    data: pendingData,
                    borderColor: "#42A5F5",
                    backgroundColor: "rgba(66, 165, 245, 0.2)",
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: "완료됨",
                    data: completedData,
                    borderColor: "#66BB6A",
                    backgroundColor: "rgba(102, 187, 106, 0.2)",
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: "취소됨",
                    data: canceledData,
                    borderColor: "#8E24AA",
                    backgroundColor: "rgba(142, 36, 170, 0.2)",
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: "유효 기간 만료",
                    data: expiredData,
                    borderColor: "#FF7043",
                    backgroundColor: "rgba(255, 112, 67, 0.2)",
                    fill: true,
                    tension: 0.4,
                  },
                ],
              };

              return (
                <Tab.Panel key={tab.type}>
                  {/* 상태 요약 */}
                  <div className="mb-6 bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md">
                    <h2 className="font-semibold mb-2">{tab.name} 상태 요약</h2>
                    <div className="grid grid-cols-4 gap-4">
                      {/* 진행 중 */}
                      <div
                        className="bg-gray-100 p-4 rounded-md text-center cursor-pointer hover:bg-gray-200"
                        onClick={() =>
                          router.push(
                            `/documents/details?type=${tab.type}&status=pending`
                          )
                        }
                      >
                        <p className="font-semibold text-gray-700">진행 중</p>
                        <h3 className="text-xl font-bold">{pending}</h3>
                      </div>

                      {/* 유효 기간 경과 */}
                      <div
                        className="bg-gray-100 p-4 rounded-md text-center cursor-pointer hover:bg-gray-200"
                        onClick={() =>
                          router.push(
                            `/documents/details?type=${tab.type}&status=pending&expired=true`
                          )
                        }
                      >
                        <p className="font-semibold text-gray-700">
                          유효 기간 만료
                        </p>
                        <h3 className="text-xl font-bold">
                          {
                            documents.filter(
                              (doc) =>
                                doc.status === "pending" &&
                                new Date(doc.content.valid_until || "") <
                                  new Date()
                            ).length
                          }
                        </h3>
                      </div>

                      {/* 완료됨 */}
                      <div
                        className="bg-gray-100 p-4 rounded-md text-center cursor-pointer hover:bg-gray-200"
                        onClick={() =>
                          router.push(
                            `/documents/details?type=${tab.type}&status=completed`
                          )
                        }
                      >
                        <p className="font-semibold text-gray-700">완료됨</p>
                        <h3 className="text-xl font-bold">{completed}</h3>
                      </div>

                      {/* 취소됨 */}
                      <div
                        className="bg-gray-100 p-4 rounded-md text-center cursor-pointer hover:bg-gray-200"
                        onClick={() =>
                          router.push(
                            `/documents/details?type=${tab.type}&status=canceled`
                          )
                        }
                      >
                        <p className="font-semibold text-gray-700">취소됨</p>
                        <h3 className="text-xl font-bold">{canceled}</h3>
                      </div>
                    </div>
                  </div>

                  {/* 상태별 문서 테이블 및 차트 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1 bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md">
                      <h2 className="font-semibold text-md mb-4">
                        {tab.name} 상태별 문서
                      </h2>
                      {[
                        { title: "진행 중 문서", documents },
                        {
                          title: "유효 기간 만료 문서",
                          documents: documents.filter(
                            (doc) =>
                              doc.status === "pending" &&
                              new Date(doc.content.valid_until || "") <
                                new Date()
                          ),
                        },
                        {
                          title: "취소된 문서",
                          documents: documents.filter(
                            (doc) => doc.status === "canceled"
                          ),
                        },
                        {
                          title: "완료된 문서",
                          documents: documents.filter(
                            (doc) => doc.status === "completed"
                          ),
                        },
                      ].map(({ title, documents }) => (
                        <div key={uuidv4()} className="mb-6">
                          <h3 className="font-bold mb-2">{title}</h3>
                          <table className="min-w-full table-auto border-collapse text-left">
                            <thead>
                              <tr className="bg-gray-100 text-center">
                                <th className="px-4 py-2 border-b">
                                  문서 번호
                                </th>
                                <th className="px-4 py-2 border-b">회사명</th>
                                <th className="px-4 py-2 border-b">작성일</th>
                                <th className="px-4 py-2 border-b">
                                  유효 기간
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-center">
                              {documents.slice(0, 3).map((doc) => (
                                <tr key={uuidv4()} className="hover:bg-gray-50">
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
                                    {doc.content.valid_until?.slice(0, 10) ||
                                      "없음"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>

                    <div className="col-span-1 bg-[#FBFBFB] rounded-md border-[1px] p-6 shadow-md">
                      <h2 className="font-semibold text-md mb-4">
                        {tab.name} 상태 요약
                      </h2>
                      <div className="min-h-[24rem]">
                        <Line
                          data={lineData}
                          options={{
                            plugins: {
                              legend: { display: true },
                            },
                            maintainAspectRatio: false,
                            responsive: true,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
              );
            })}
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
}
