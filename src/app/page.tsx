"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Skeleton } from "@mui/material";
import { useLoginUser } from "./context/login";
import UserGreeting from "@/components/dashboard/UserGreeting";
import GreetingComponent from "@/components/dashboard/Greeting";
import Link from "next/link";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
interface DocumentStatus {
  type: "estimate" | "order";
  status: "pending" | "completed" | "canceled";
  count: number;
}

interface DashboardData {
  salesData: Record<
    string,
    { totalSales: number; totalPurchases: number; expectedSales: number }
  >;
  monthlyPerformance: {
    totalSales: number;
    totalPurchases: number;
    expectedSales: number;
    lastMonthSales: number;
    lastMonthPurchases: number;
  };
  clients: {
    company_id: string;
    company_name: string;
    total_consultations: number;
    total_estimates: number;
    total_orders: number;
  }[];
  recentDocuments: {
    type: "estimate" | "order";
    document_number: string;
    created_at: string;
    company_name: string;
    status: "pending" | "completed" | "canceled";
    total_amount: number;
  }[];
  expiringDocuments: {
    id: string;
    document_number: string;
    content: {
      valid_until: string;
      company_name: string;
      total_amount: number;
    };
  }[];
  followUpClients: {
    company_id: string;
    company_name: string;
    last_consultation: string;
  }[];
  documentStatusCounts: DocumentStatus[];
  new_sales: {
    new_clients_count: number;
    new_consultations_count: number;
    new_opportunities: number;
    new_estimate_completed: number;
  };
  current_month_performance: {
    total_consultations: number;
    total_opportunities: number;
    total_estimate_completed: number;
  };

  recent_consultations: {
    created_at: string;
    contact_name: string;
  }[];

  recent_documents: {
    company_name: string;
    created_at: string;
  }[];
}

export default function SalesDashboard() {
  const user = useLoginUser();
  const initialDashboardData: DashboardData = {
    salesData: {},
    monthlyPerformance: {
      totalSales: 0,
      totalPurchases: 0,
      expectedSales: 0,
      lastMonthSales: 0,
      lastMonthPurchases: 0,
    },
    clients: [],
    recentDocuments: [],
    expiringDocuments: [],
    followUpClients: [],
    documentStatusCounts: [],
    new_sales: {
      new_clients_count: 0,
      new_consultations_count: 0,
      new_opportunities: 0,
      new_estimate_completed: 0,
    },
    current_month_performance: {
      total_consultations: 0,
      total_opportunities: 0,
      total_estimate_completed: 0,
    },
    recent_consultations: [
      {
        created_at: "",
        contact_name: "",
      },
    ],
    recent_documents: [
      {
        company_name: "",
        created_at: "",
      },
    ],
  };

  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialDashboardData);

  const [loading, setLoading] = useState<boolean>(true);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?userId=${user?.id}`);
      const data = await response.json();

      // 데이터가 유효한 경우에만 상태 업데이트
      if (response.ok) {
        setDashboardData(data);
      } else {
        setSnackbarMessage(
          "대시보드 데이터를 불러오는 중 문제가 발생했습니다."
        );
      }
    } catch (error) {
      setSnackbarMessage("대시보드 데이터를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript에서 0부터 시작하므로 +1

  // 이번 달의 정확한 일 수 계산
  const daysInMonth = new Date(year, month, 0).getDate();

  // 1일부터 마지막 날짜까지 숫자로 변환하여 리스트 생성
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    (i + 1).toString()
  );

  // 📊 차트 데이터 정리 (한 달 기준)
  const formatDate = (day: string) =>
    `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${day.padStart(2, "0")}`;

  const totalSalesData = monthDays.map(
    (day) => dashboardData.salesData[formatDate(day)]?.totalSales || 0
  );
  const totalPurchasesData = monthDays.map(
    (day) => dashboardData.salesData[formatDate(day)]?.totalPurchases || 0
  );
  const expectedSalesData = monthDays.map(
    (day) => dashboardData.salesData[formatDate(day)]?.expectedSales || 0
  );

  // 📈 차트 옵션
  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: "smooth" },
    xaxis: {
      categories: monthDays, // ✅ X축을 "1, 2, 3..." 형식으로 변경
      labels: { rotate: -45 },
    },
    yaxis: { labels: { formatter: (val) => `${val.toLocaleString()} ` } },
    tooltip: { y: { formatter: (val) => `${val.toLocaleString()} ` } },
  };

  const defaultChartData = Array(daysInMonth).fill(0);

  const chartSeries = [
    {
      name: "총 매출",
      data: totalSalesData.length ? totalSalesData : defaultChartData,
    },
    {
      name: "총 매입",
      data: totalPurchasesData.length ? totalPurchasesData : defaultChartData,
    },
    {
      name: "영업 기회",
      data: expectedSalesData.length ? expectedSalesData : defaultChartData,
    },
  ];

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">대시보드</p>

      {/* ✅ 사용자 인사 & 후속 상담 필요 고객 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <UserGreeting
            level={user.level}
            name={user.name}
            position={user.position}
          />
          <GreetingComponent />
        </div>

        {loading ? (
          <Skeleton style={{ height: "8rem", width: "100%" }} />
        ) : (
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-md mb-2">📊 이달의 성과</div>

                <ul className="list-disc pl-4">
                  <li>
                    총 매입:{" "}
                    {dashboardData?.monthlyPerformance.totalPurchases.toLocaleString()}{" "}
                  </li>
                  <li>
                    총 매출:{" "}
                    {dashboardData?.monthlyPerformance.totalSales.toLocaleString()}{" "}
                  </li>
                  <li>
                    영업 기회:{" "}
                    {dashboardData?.monthlyPerformance.expectedSales.toLocaleString()}{" "}
                  </li>
                </ul>
              </div>
              <div>
                <div>
                  <h2 className="font-semibold text-md mb-2">🏢 주요 고객</h2>
                  <ul className="list-disc pl-4">
                    {dashboardData?.clients.map((client) => (
                      <li key={client.company_id}>
                        <strong>{client.company_name}</strong>: 상담{" "}
                        {client.total_consultations}회, 견적{" "}
                        {client.total_estimates}건, 발주 {client.total_orders}건
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <Skeleton style={{ height: "16rem", width: "100%" }} />
          ) : dashboardData?.followUpClients.length ? (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <h2 className="font-semibold text-md mb-2">
                🔔 후속 상담 필요 고객
              </h2>
              <ul className="list-disc pl-4">
                {dashboardData.followUpClients.map((client) => (
                  <li key={client.company_id}>
                    <strong>{client.company_name}</strong>: 마지막 상담일{" "}
                    {new Date(client.last_consultation).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <h2 className="font-semibold text-md mb-2">
                🔔 후속 상담 필요 고객
              </h2>
              <p>✅ 후속 상담이 필요한 고객 없음</p>
            </div>
          )}

          {loading ? (
            <Skeleton style={{ height: "16rem", width: "100%" }} />
          ) : (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <h2 className="font-semibold text-md mb-2">
                  📌 곧 만료되는 견적서
                </h2>
                {/* <Link
                  href={`/documents/details?type=estimate&status=pending`}
                  className="cursor-pointer"
                >
                  <span className="text-gray-400 hover:text-black cursor-pointer text-sm">
                    + 더보기
                  </span>
                </Link> */}
              </div>
              {dashboardData?.expiringDocuments.length ? (
                <ul className="list-disc pl-4">
                  {dashboardData.expiringDocuments.map((doc) => (
                    <li key={doc.id}>
                      <strong>{doc.content.company_name}</strong> -{" "}
                      <span>{doc.content.total_amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>📅 만료 임박한 견적서 없음</p>
              )}
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton style={{ height: "16rem", width: "100%" }} />
        ) : (
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <div>
              <div className="flex justify-between">
                <span className="font-semibold text-md mb-4">
                  당월 영업 실적
                </span>
              </div>
              <div className="grid gap-4">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 고객</p>
                      <p className="text-lg font-bold">
                        {dashboardData?.new_sales.new_clients_count}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 상담</p>
                      <p className="text-lg font-bold">
                        {dashboardData?.new_sales.new_consultations_count}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 영업 기회</p>
                      <p className="text-lg font-bold">
                        {dashboardData?.new_sales.new_opportunities.toLocaleString()}{" "}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 발주 완료</p>
                      <p className="text-lg font-bold">
                        {dashboardData?.new_sales.new_estimate_completed.toLocaleString()}{" "}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div></div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">상담</p>
                    <p className="text-lg font-bold">
                      {
                        dashboardData?.current_month_performance
                          .total_consultations
                      }
                    </p>
                  </div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">영업 기회</p>
                    <p className="text-lg font-bold">
                      {dashboardData?.current_month_performance.total_opportunities.toLocaleString()}{" "}
                    </p>
                  </div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">발주 완료</p>
                    <p className="text-lg font-bold">
                      {dashboardData?.current_month_performance.total_estimate_completed.toLocaleString()}{" "}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <Skeleton style={{ height: "18rem", width: "100%" }} />
          ) : (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <span className="font-semibold text-md mb-4">
                  최근 상담 고객
                </span>
                <Link href={`/myContacts`} className="cursor-pointer">
                  <span className="text-gray-400 hover:text-black cursor-pointer text-sm">
                    + 더보기
                  </span>
                </Link>
              </div>
              <div>
                {dashboardData?.recent_consultations.map((doc, i) => (
                  <div className="flex justify-between" key={i}>
                    <span>{doc.contact_name}</span>
                    <span>{doc.created_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <Skeleton style={{ height: "18rem", width: "100%" }} />
          ) : (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <span className="font-semibold text-md mb-4">
                  최근 생성된 문서
                </span>
                <Link href={`/documents`} className="cursor-pointer">
                  <span className="text-gray-400 hover:text-black cursor-pointer text-sm">
                    + 더보기
                  </span>
                </Link>
              </div>
              <div>
                {dashboardData?.recent_documents.map((doc, i) => (
                  <div className="flex justify-between" key={i}>
                    <span>{doc.company_name}</span>
                    <span>{doc.created_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <Skeleton style={{ height: "18rem", width: "100%" }} />
        ) : (
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 ">
            <h2 className="font-semibold text-md mb-4">📈 당월 영업 차트</h2>
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="line"
              height={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}
