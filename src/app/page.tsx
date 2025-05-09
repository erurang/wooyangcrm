"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Skeleton } from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Users,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { useLoginUser } from "@/context/login";
import { calculateMonthlySales } from "@/utils/calculateMonthlySales";

import UserGreeting from "@/components/dashboard/UserGreeting";
import GreetingComponent from "@/components/dashboard/Greeting";
import SnackbarComponent from "@/components/Snackbar";
import TodoList from "@/components/dashboard/Todos";

import { useDocumentsList } from "@/hooks/dashboard/useDocumentsList";
import { useClientSummary } from "@/hooks/dashboard/useClientSummary";
import { useCompaniesByDocument } from "@/hooks/dashboard/useCompaniesByDocument";
import { calculateNewSales } from "@/utils/calculateNewSales";
import { useNewConsultations } from "@/hooks/dashboard/useNewConsultations";
import { useRecentActivities } from "@/hooks/dashboard/useRecentActivities";
import { useLoginLogs } from "@/hooks/dashboard/useLoginLogs";

// 동적으로 차트 컴포넌트 불러오기
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ApexCharts 타입 선언
declare type ApexCharts = any;

export default function SalesDashboard() {
  const user = useLoginUser();
  const router = useRouter();

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

  // snackbar
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  //// SWR 데이터 가져오기 ///////
  const { documents } = useDocumentsList(user?.id ? user.id : "");
  const { loginLogs } = useLoginLogs(user?.email || "");
  const { companies } = useCompaniesByDocument(documents ?? []);
  const { followUpClients, clients } = useClientSummary(
    user?.id ? user.id : ""
  );
  const { newConsultations } = useNewConsultations(
    user?.id && documents ? user.id : ""
  );

  // 월간 매출 계산
  const {
    expectedSales,
    expiringDocuments,
    salesData,
    totalPurchases,
    totalSales,
  } = calculateMonthlySales(documents, today, sevenDaysLater);

  // 신규 매출 계산
  const { newSales, current_month_performance } =
    documents && companies && newConsultations
      ? calculateNewSales(documents, companies, newConsultations)
      : { newSales: null, current_month_performance: null };

  // 최근 활동 가져오기
  const { recentActivities, recentActivitiesIsLoading: isLoading } =
    useRecentActivities(user?.id ? user.id : "");

  // 📈 차트 옵션
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, sans-serif",
      background: "transparent",
      dropShadow: {
        enabled: true,
        top: 3,
        left: 2,
        blur: 4,
        opacity: 0.1,
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: ["#4f46e5", "#64748b", "#0ea5e9"],
    xaxis: {
      categories: monthDays,
      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${val.toLocaleString()} `,
        style: {
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => `${val.toLocaleString()} ` },
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      markers: {
        size: 8,
        strokeWidth: 0,
        shape: "circle",
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      row: {
        colors: ["transparent", "transparent"],
      },
    },
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

  if (!user) {
    return null;
  }

  function convertToKST(utcDate: any) {
    const date = new Date(utcDate);
    const kstOffset = 9 * 60; // 한국은 UTC+9 (분 단위)
    const kstDate = new Date(date?.getTime() + kstOffset * 60 * 1000);

    return kstDate?.toISOString().replace("T", " ").split(".")[0]; // 'YYYY-MM-DD HH:mm:ss' 형식
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="w-full">
        {/* 상단 영역 (유저 인사 + 이달의 성과) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 p-5">
          {/* 좌측: 사용자 인사 */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <UserGreeting
              level={user.level}
              name={user.name}
              position={user.position}
            />
            <GreetingComponent />
            <div className="mt-4 text-end text-slate-500 text-xs">
              <p>최근 접속IP : {loginLogs?.ip_address}</p>
              <p>
                최근 로그인 :{" "}
                {loginLogs?.login_time && convertToKST(loginLogs.login_time)}
              </p>
            </div>
          </div>

          {/* 우측: 이달의 성과 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "12rem", width: "100%" }}
            />
          ) : (
            <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  이달의 성과
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">총 매입</span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">
                      {month}월
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {(totalPurchases ?? 0).toLocaleString()} 원
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">총 매출</span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">
                      {month}월
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {(totalSales ?? 0).toLocaleString()} 원
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">
                      영업 기회
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">
                      {month}월
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {(expectedSales ?? 0).toLocaleString()} 원
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 중간 영역: 당월 영업 실적 + 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 pt-0">
          {/* 당월 영업 실적 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  당월 영업 실적
                </h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-indigo-600 text-xs mb-1">신규 고객</p>
                    <p className="text-xl font-bold text-slate-800">
                      {newSales?.new_clients_count || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-indigo-600 text-xs mb-1">신규 상담</p>
                    <p className="text-xl font-bold text-slate-800">
                      {newSales?.new_consultations_count || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-indigo-600 text-xs mb-1">
                      신규 영업 기회
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {(newSales?.new_opportunities || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-indigo-600 text-xs mb-1">
                      신규 발주 완료
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {(newSales?.new_estimate_completed || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-slate-500 text-xs mb-1">상담</p>
                    <p className="text-lg font-bold text-slate-800">
                      {current_month_performance?.total_consultations || 0}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-slate-500 text-xs mb-1">영업 기회</p>
                    <p className="text-lg font-bold text-slate-800">
                      {(
                        current_month_performance?.total_opportunities || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                    <p className="text-slate-500 text-xs mb-1">발주 완료</p>
                    <p className="text-lg font-bold text-slate-800">
                      {(
                        current_month_performance?.total_estimate_completed || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 당월 영업 차트 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  당월 영업 차트
                </h2>
              </div>
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="area"
                height={250}
              />
            </div>
          )}
        </div>

        {/* 하단 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 pt-0">
          {/* 주요 고객 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  주요 고객
                </h2>
              </div>

              <div className="space-y-3">
                {clients.length > 0 ? (
                  clients.map((client: any) => (
                    <div
                      key={client.company_id}
                      className="p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors shadow-sm"
                    >
                      <div className="font-medium text-slate-800">
                        {client.company_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>상담: {client.total_consultations}회</span>
                        <span>견적: {client.total_estimates}건</span>
                        <span>발주: {client.total_orders}건</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <div className="bg-indigo-50 p-3 rounded-full mb-2">
                      <Users className="h-6 w-6 text-indigo-400" />
                    </div>
                    <p>등록된 주요 고객이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 후속 상담 필요 거래처 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  후속 상담 필요 거래처
                </h2>
              </div>

              {followUpClients.length ? (
                <ul className="space-y-3">
                  {followUpClients.map((client: any) => (
                    <li
                      key={client.company_id}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                      <div
                        className="text-slate-800 font-medium cursor-pointer hover:text-indigo-600 transition-colors flex items-center justify-between"
                        onClick={() =>
                          router.push(`/consultations/${client.company_id}`)
                        }
                      >
                        <span>{client.company_name}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        마지막 상담일:{" "}
                        {new Date(
                          client.last_consultation
                        ).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <Clock className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>후속 상담이 필요한 고객이 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 만료 임박 견적서 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  곧 만료되는 견적서
                </h2>
              </div>

              {expiringDocuments.length ? (
                <ul className="space-y-3">
                  {expiringDocuments.map((doc: any) => (
                    <li
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                      <div className="font-medium text-slate-800">
                        {doc.content.company_name}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">
                          만료일:{" "}
                          {new Date(
                            doc.content.valid_until
                          ).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-medium text-indigo-600">
                          {doc.content.total_amount.toLocaleString()}원
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>유효기간 7일 내 만료 임박한 견적서가 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 최근 활동 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 pt-0">
          {/* 할 일 리스트 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-50 p-2 rounded-md mr-3">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                할 일 목록
              </h2>
            </div>
            <TodoList userId={user.id} />
          </div>

          {/* 최근 상담 고객 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  최근 상담 고객
                </h2>
              </div>

              {recentActivities?.recent_consultations?.length ? (
                <div className="space-y-3">
                  {recentActivities.recent_consultations.map(
                    (doc: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors"
                      >
                        <span className="font-medium text-slate-800">
                          {doc.contact_name}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                          {doc.created_at.slice(0, 10)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <Users className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>최근 상담 고객이 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 최근 생성 문서 */}
          {isLoading ? (
            <Skeleton
              variant="rounded"
              style={{ height: "16rem", width: "100%" }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-md mr-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  최근 생성된 문서
                </h2>
              </div>

              {recentActivities?.recent_documents?.length ? (
                <div className="space-y-3">
                  {recentActivities.recent_documents.map(
                    (doc: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors"
                      >
                        <span className="font-medium text-slate-800">
                          {doc.company_name}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                          {doc.created_at.slice(0, 10)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <div className="bg-indigo-50 p-3 rounded-full mb-2">
                    <FileText className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p>최근 생성된 문서가 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 스낵바 */}
      <SnackbarComponent
        severity="success"
        message={snackbarMessage}
        onClose={() => setSnackbarMessage(null)}
      />
    </div>
  );
}
