"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Skeleton } from "@mui/material";

import { useLoginUser } from "@/context/login";
import { calculateMonthlySales } from "@/utils/calculateMonthlySales";

import UserGreeting from "@/components/dashboard/UserGreeting";
import GreetingComponent from "@/components/dashboard/Greeting";
import SnackbarComponent from "@/components/Snackbar";

import { useDocumentsList } from "@/hooks/dashboard/useDocumentsList";
import { useClientSummary } from "@/hooks/dashboard/useClientSummary";
import { useCompaniesByDocument } from "@/hooks/dashboard/useCompaniesByDocument";
import { calculateNewSales } from "@/utils/calculateNewSales";
import { useNewConsultations } from "@/hooks/dashboard/useNewConsultations";
import { useRecentActivities } from "@/hooks/dashboard/useRecentActivities";
import TodoList from "@/components/dashboard/Todos";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function SalesDashboard() {
  const user = useLoginUser();

  // 이번 달의 정확한 일 수 계산
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript에서 0부터 시작하므로 +1
  const daysInMonth = new Date(year, month, 0).getDate();
  // 1일부터 마지막 날짜까지 숫자로 변환하여 리스트 생성
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    (i + 1).toString()
  );
  const formatDate = (day: string) =>
    `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${day.padStart(2, "0")}`;
  //

  // snackbar
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  //// swr test ///////
  const { documents } = useDocumentsList(user?.id ? user.id : "");

  const { companies } = useCompaniesByDocument(documents ?? []);

  const { followUpClients, clients } = useClientSummary(
    user?.id ? user.id : ""
  );

  const { newConsultations } = useNewConsultations(
    user?.id && documents ? user.id : ""
  );

  // swr test //////////
  const {
    expectedSales,
    expiringDocuments, // dz
    salesData,
    totalPurchases,
    totalSales,
  } = calculateMonthlySales(documents, today, sevenDaysLater);

  const { newSales, current_month_performance } =
    documents && companies && newConsultations
      ? calculateNewSales(documents, companies, newConsultations)
      : { newSales: null, current_month_performance: null };

  const { recentActivities, recentActivitiesIsLoading: isLoading } =
    useRecentActivities(user?.id ? user.id : "");

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

  // 📊 차트 데이터 정리 (한 달 기준)
  const totalSalesData = monthDays.map(
    (day) => salesData[formatDate(day)]?.totalSales || 0
  );
  const totalPurchasesData = monthDays.map(
    (day) => salesData[formatDate(day)]?.totalPurchases || 0
  );
  const expectedSalesData = monthDays.map(
    (day) => salesData[formatDate(day)]?.expectedSales || 0
  );

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
  //

  if (!user) {
    return null;
  }

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

        {isLoading ? (
          <Skeleton style={{ height: "8rem", width: "100%" }} />
        ) : (
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-md mb-2">📊 이달의 성과</div>

                <ul className="list-disc pl-4">
                  <li>총 매입: {(totalPurchases ?? 0).toLocaleString()} </li>
                  <li>총 매출: {(totalSales ?? 0).toLocaleString()} </li>
                  <li>영업 기회: {(expectedSales ?? 0).toLocaleString()} </li>
                </ul>
              </div>
              <div>
                <div>
                  <h2 className="font-semibold text-md mb-2">🏢 주요 고객</h2>
                  <ul className="list-disc pl-4">
                    {clients.map((client: any) => (
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
          {isLoading ? (
            <Skeleton style={{ height: "16rem", width: "100%" }} />
          ) : followUpClients.length ? (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <h2 className="font-semibold text-md mb-2">
                🔔 후속 상담 필요 고객
              </h2>
              <ul className="list-disc pl-4">
                {followUpClients.map((client: any) => (
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
              <p>후속 상담이 필요한 고객 없음</p>
            </div>
          )}

          {isLoading ? (
            <Skeleton style={{ height: "16rem", width: "100%" }} />
          ) : (
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <h2 className="font-semibold text-md mb-2">
                  📌 곧 만료되는 견적서
                </h2>
              </div>
              {expiringDocuments.length ? (
                <ul className="list-disc pl-4">
                  {expiringDocuments.map((doc: any) => (
                    <li key={doc.id}>
                      <strong>{doc.content.company_name}</strong> -{" "}
                      <span>{doc.content.total_amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>유효기간 7일 내 만료 임박한 견적서 없음</p>
              )}
            </div>
          )}
        </div>
        {isLoading ? (
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
                        {newSales?.new_clients_count}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 상담</p>
                      <p className="text-lg font-bold">
                        {newSales?.new_consultations_count}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 영업 기회</p>
                      <p className="text-lg font-bold">
                        {newSales?.new_opportunities.toLocaleString()}{" "}
                      </p>
                    </div>
                    <div className=" shadow-md rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">신규 발주 완료</p>
                      <p className="text-lg font-bold">
                        {newSales?.new_estimate_completed.toLocaleString()}{" "}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div></div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">상담</p>
                    <p className="text-lg font-bold">
                      {current_month_performance?.total_consultations}
                    </p>
                  </div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">영업 기회</p>
                    <p className="text-lg font-bold">
                      {current_month_performance?.total_opportunities.toLocaleString()}{" "}
                    </p>
                  </div>
                  <div className=" shadow-md rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">발주 완료</p>
                    <p className="text-lg font-bold">
                      {current_month_performance?.total_estimate_completed.toLocaleString()}{" "}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <Skeleton style={{ height: "18rem", width: "100%" }} />
          ) : (
            // <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            //   <div className="flex justify-between">
            //     <span className="font-semibold text-md mb-4">
            //       🏢 내 담당 회사
            //     </span>
            //     <Link href={`/manage/customers`} className="cursor-pointer">
            //       <span className="text-gray-400 hover:text-black cursor-pointer text-sm">
            //         + 더보기
            //       </span>
            //     </Link>
            //   </div>
            //   <div>
            //     {clients.length > 0 ? (
            //       clients.map((client: any) => (
            //         <div
            //           key={client.company_id}
            //           className="flex justify-between hover:bg-gray-100 p-2 rounded-md cursor-pointer"
            //           // onClick={() => router.push(`/manage/myCustomers/${client.company_id}`)}
            //         >
            //           <span>{client.company_name}</span>
            //           <span className="text-gray-500">
            //             상담 {client.total_consultations}회 · 문서{" "}
            //             {client.total_estimates + client.total_orders}건
            //           </span>
            //         </div>
            //       ))
            //     ) : (
            //       <p className="text-gray-400">내 담당 회사가 없습니다.</p>
            //     )}
            //   </div>
            // </div>
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <span className="font-semibold text-md mb-4">
                  최근 상담 고객
                </span>
              </div>
              <div>
                {recentActivities?.recent_consultations.map(
                  (doc: any, i: any) => (
                    <div className="flex justify-between" key={i}>
                      <span>{doc.contact_name}</span>
                      <span>{doc.created_at.slice(0, 10)}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {isLoading ? (
            <Skeleton style={{ height: "18rem", width: "100%" }} />
          ) : (
            // <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            //   <div className="flex justify-between">
            //     <span className="font-semibold text-md mb-4">
            //       👤 내 담당 담당자
            //     </span>
            //     <Link href={`/manage/contacts`} className="cursor-pointer">
            //       <span className="text-gray-400 hover:text-black cursor-pointer text-sm">
            //         + 더보기
            //       </span>
            //     </Link>
            //   </div>
            //   <div>
            //     {clients.length > 0 ? (
            //       clients.map((client: any) => (
            //         <div
            //           key={client.contact_id}
            //           className="flex justify-between hover:bg-gray-100 p-2 rounded-md cursor-pointer"
            //           // onClick={() => router.push(`/manage/contacts/${client.contact_id}`)}
            //         >
            //           <span>
            //             {client.contact_name} ({client.company_name})
            //           </span>
            //           <span className="text-gray-500">
            //             {client.contact_level}
            //           </span>
            //         </div>
            //       ))
            //     ) : (
            //       <p className="text-gray-400">내 담당 담당자가 없습니다.</p>
            //     )}
            //   </div>
            // </div>
            <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
              <div className="flex justify-between">
                <span className="font-semibold text-md mb-4">
                  최근 생성된 문서
                </span>
              </div>
              <div>
                {recentActivities?.recent_documents.map((doc: any, i: any) => (
                  <div className="flex justify-between" key={i}>
                    <span>{doc.company_name}</span>
                    <span>{doc.created_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
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
        <TodoList userId={user.id} />
      </div>
      <SnackbarComponent
        severity="success"
        message={snackbarMessage}
        onClose={() => setSnackbarMessage(null)}
      />
    </div>
  );
}
