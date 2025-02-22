"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function ContactDetailPage() {
  const { id } = useParams();
  const contactId = Array.isArray(id) ? id[0] : id || "";

  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 필터 상태 추가
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "year"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // ✅ 날짜 변환 (연도별, 분기별, 월별)
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    startDate = `${selectedYear}-${(selectedQuarter - 1) * 3 + 1}-01`;
    endDate = new Date(selectedYear, selectedQuarter * 3, 0)
      .toISOString()
      .split("T")[0];
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedMonth, 0)
      .toISOString()
      .split("T")[0];
  }

  useEffect(() => {
    async function fetchContactDetails() {
      if (!contactId) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_contact_details", {
        contact_param: contactId,
        start_date: startDate,
        end_date: endDate,
      });

      if (error) {
        console.error("Error fetching contact details:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } else {
        setContactData(data[0] || {});
      }

      setLoading(false);
    }

    fetchContactDetails();
  }, [contactId, startDate, endDate]);

  if (loading) {
    return <div className="text-center py-10">⏳ 데이터 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!contactData) {
    return (
      <div className="text-center py-10">❌ 데이터를 찾을 수 없습니다.</div>
    );
  }

  // ✅ 차트 데이터 생성 함수
  const getChartData = (items: any[]) => {
    const sorted = [...items].sort((a, b) => b.amount - a.amount);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.amount, 0);

    return {
      labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(
        Boolean
      ),
      data: [
        ...top5.map((c) => c.amount),
        otherTotal > 0 ? otherTotal : 0,
      ].filter((v) => v > 0),
    };
  };

  const estimateChart = getChartData(contactData.estimate_items || []);
  const orderChart = getChartData(contactData.order_items || []);

  return (
    <div className="text-sm text-[#333]">
      {/* 🔹 담당자 정보 */}

      <div className="mb-4">
        <Link
          href="/manage/contacts"
          className="text-blue-500 hover:font-semibold"
        >
          담당자 관리{" "}
        </Link>
        <span className="text-[#333] font-semibold">- 상세정보</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <div className="grid grid-cols-2">
            <div>
              <p>
                <span className="font-semibold">이름:</span>{" "}
                {contactData.contact_name}
              </p>
              <p>
                <span className="font-semibold">거래처:</span>{" "}
                {contactData.company_name}
              </p>
              <p>
                <span className="font-semibold">부서 / 직급:</span>{" "}
                {contactData.department || "-"} / {contactData.level || "-"}
              </p>
              <p>
                <span className="font-semibold">이메일:</span>{" "}
                {contactData.email || "-"}
              </p>
              <p>
                <span className="font-semibold">연락처:</span>{" "}
                {contactData.mobile || "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-700 text-sm">
                총 매입 금액:
                <span className="font-bold text-green-600">
                  {contactData.estimate_items
                    .reduce((sum: any, item: any) => sum + item.amount, 0)
                    .toLocaleString()}{" "}
                  원
                </span>
              </p>
              <p className="text-gray-700 text-sm">
                총 매출 금액:
                <span className="font-bold text-blue-600">
                  {contactData.order_items
                    .reduce((sum: any, item: any) => sum + item.amount, 0)
                    .toLocaleString()}{" "}
                  원
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 🔹 날짜 필터 */}
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold">📅 데이터 기간 선택</p>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <select
              className="border-2 p-2 rounded-md"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from(
                { length: new Date().getFullYear() - 2010 + 1 },
                (_, i) => (
                  <option key={i} value={new Date().getFullYear() - i}>
                    {new Date().getFullYear() - i}
                  </option>
                )
              )}
            </select>

            <select
              className="border p-2 rounded-md"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "year" | "quarter" | "month")
              }
            >
              <option value="year">연도별</option>
              <option value="quarter">분기별</option>
              <option value="month">월별</option>
            </select>

            {dateFilter === "quarter" && (
              <select
                className="border p-2 rounded-md"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              >
                <option value="1">1분기</option>
                <option value="2">2분기</option>
                <option value="3">3분기</option>
                <option value="4">4분기</option>
              </select>
            )}

            {dateFilter === "month" && (
              <select
                className="border p-2 rounded-md"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <h2 className="text-lg font-bold mb-4">상담 내역</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {contactData.consultations.map((consultation: any, index: any) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {consultation.date}
                  </span>
                </div>
                <p className="mt-2 text-gray-800 whitespace-pre-line">
                  {consultation.content}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 flex flex-col">
            <p className="text-lg font-semibold mb-4">📦 구매 품목 비중</p>

            <ReactApexChart
              options={{
                labels: estimateChart.labels,
                legend: { position: "bottom" }, // ✅ 범례 활성화 (아래 배치)
                yaxis: {
                  labels: {
                    formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
                  },
                },
              }}
              series={estimateChart.data}
              type="pie"
              height={300}
            />
          </div>

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 flex flex-col ">
            <p className="text-lg font-semibold mb-4">📦 판매 품목 비중</p>

            <ReactApexChart
              options={{
                labels: orderChart.labels,
                legend: { position: "bottom" }, // ✅ 범례 활성화 (아래 배치)
                yaxis: {
                  labels: {
                    formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
                  },
                },
              }}
              series={orderChart.data}
              type="pie"
              height={300}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <h2 className="text-lg font-bold mb-4">📜 발주 문서 목록</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contactData.order_documents.length > 0 ? (
                contactData.order_documents.map((doc: any, index: any) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="text-gray-600 text-sm">
                      📄 문서번호:{" "}
                      <span className="font-semibold">
                        {doc.document_number}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📅 생성일:{" "}
                      <span className="font-semibold">
                        {doc.created_at.split("T")[0]}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📌 상태:{" "}
                      <span className="font-semibold">
                        {doc.status === "completed" ? "완료됨" : "진행 중"}
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  발주 문서가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <h2 className="text-lg font-bold mb-4">📦 발주 품목 목록</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contactData.order_items.length > 0 ? (
                contactData.order_items.map((item: any, index: any) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="text-gray-600 text-sm">
                      📌 품목명:{" "}
                      <span className="font-semibold">{item.name}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      🏷️ 사양:{" "}
                      <span className="font-semibold">{item.spec}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      💰 금액:{" "}
                      <span className="font-semibold">
                        {item.amount.toLocaleString()} 원
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📦 수량:{" "}
                      <span className="font-semibold">{item.quantity}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  발주 품목이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <h2 className="text-lg font-bold mb-4">📜 매입 문서 목록</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contactData.estimate_documents.length > 0 ? (
                contactData.estimate_documents.map((doc: any, index: any) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="text-gray-600 text-sm">
                      📄 문서번호:{" "}
                      <span className="font-semibold">
                        {doc.document_number}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📅 생성일:{" "}
                      <span className="font-semibold">
                        {doc.created_at.split("T")[0]}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📌 상태:{" "}
                      <span className="font-semibold">
                        {doc.status === "completed" ? "완료됨" : "진행 중"}
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  매입 문서가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <h2 className="text-lg font-bold mb-4">📦 매입 품목 목록</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contactData.estimate_items.length > 0 ? (
                contactData.estimate_items.map((item: any, index: any) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="text-gray-600 text-sm">
                      📌 품목명:{" "}
                      <span className="font-semibold">{item.name}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      🏷️ 사양:{" "}
                      <span className="font-semibold">{item.spec}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      💰 금액:{" "}
                      <span className="font-semibold">
                        {item.amount.toLocaleString()} 원
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      📦 수량:{" "}
                      <span className="font-semibold">{item.quantity}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  매입 품목이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// "use client";

// import { useState, useEffect } from "react";

// import { useParams, useRouter } from "next/navigation";
// import { CircularProgress, Button } from "@mui/material";
// import dynamic from "next/dynamic";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), {
//   ssr: false,
// });
// interface Contact {
//   id: string;
//   contact_name: string;
//   mobile: string;
//   department: string;
//   level: string;
//   email: string;
//   company_name: string;
//   company_id: string;
// }

// interface Consultation {
//   id: string;
//   date: string;
//   content: string;
//   priority: string;
// }

// interface Document {
//   id: string;
//   document_number: string;
//   type: string;
//   created_at: string;
//   content: {
//     items: {
//       name: string;
//       spec: string;
//       amount: number;
//       number: number;
//       quantity: string;
//       unit_price: number;
//       unit: string;
//     }[];
//     notes: string;
//     valid_until: string;
//     company_name: string;
//     total_amount: number;
//     delivery_term: string;
//     delivery_place: string;
//     delivery_date: string;
//   };
// }

// interface RevenueAnalysis {
//   totalRevenue: number;
//   averageEstimateValue: number;
//   monthlyRevenue: Record<string, number>; // 월별 매출
//   totalPurchaseAmount: number;
// }

// export default function ContactDetailPage() {
//   const { id } = useParams();
//   const [contact, setContact] = useState<Contact | null>(null);
//   const [consultations, setConsultations] = useState<Consultation[]>([]);
//   const [revenueAnalysis, setRevenueAnalysis] =
//     useState<RevenueAnalysis | null>(null);
//   const [documents, setDocuments] = useState<Document[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // 페이지네이션 상태
//   const [consultationPage, setConsultationPage] = useState(1);
//   const [documentPage, setDocumentPage] = useState(1);
//   const itemsPerPage = 10; // 한 페이지당 표시할 아이템 개수

//   useEffect(() => {
//     const fetchContactData = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(`/api/manage/contacts/${id}`);
//         const data = await response.json();

//         if (!response.ok)
//           throw new Error(data.error || "데이터를 불러오는 데 실패했습니다.");

//         setContact(data.contact);
//         setConsultations(data.consultations);
//         setDocuments(data.documents);
//         setRevenueAnalysis(data.revenueAnalysis); // 🔹 추가된 매출 분석 데이터 저장
//       } catch (error) {
//         console.error("Error fetching contact details:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchContactData();
//   }, [id]);

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-40">
//         <CircularProgress />
//       </div>
//     );

//   // 페이지네이션 처리 함수
//   const paginate = (data: any[], page: number) =>
//     data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

//   const estimateData = documents
//     .filter((doc) => doc.type === "estimate")
//     .flatMap((doc) => doc.content.items);

//   const estimateNames = estimateData.map((item) => item.name);
//   const estimatePrices = estimateData.map((item) => item.amount);

//   // 🔹 발주서(order)에서 품명과 구매액 추출
//   const orderData = documents
//     .filter((doc) => doc.type === "order")
//     .flatMap((doc) => doc.content.items);

//   const orderNames = orderData.map((item) => item.name);
//   const orderPrices = orderData.map((item) => item.amount);

//   // 🔹 월별 매출 차트 데이터 변환
//   const monthlyLabels = revenueAnalysis
//     ? Object.keys(revenueAnalysis.monthlyRevenue)
//     : [];
//   const monthlyValues = revenueAnalysis
//     ? Object.values(revenueAnalysis.monthlyRevenue)
//     : [];

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-semibold">담당자 상세 정보</h1>

//       {/* 담당자 기본 정보 */}
//       {contact && (
//         <div className="bg-[#FBFBFB] p-4 rounded-md mt-4">
//           <p>
//             <strong>이름:</strong> {contact.contact_name}
//           </p>
//           <p>
//             <strong>전화번호:</strong> {contact.mobile}
//           </p>
//           <p>
//             <strong>이메일:</strong> {contact.email}
//           </p>
//           <p>
//             <strong>부서:</strong> {contact.department}
//           </p>
//           <p>
//             <strong>직급:</strong> {contact.level}
//           </p>
//         </div>
//       )}

//       {/* 🔹 매출 분석 데이터 표시 */}
//       {revenueAnalysis && (
//         <div className="bg-[#FBFBFB] p-4 rounded-md mt-4 flex justify-between">
//           <div>
//             <h2 className="font-semibold text-lg">총 매출</h2>
//             <p className="text-xl font-bold">
//               {revenueAnalysis.totalRevenue.toLocaleString()} 원
//             </p>
//           </div>
//           <div>
//             <h2 className="font-semibold text-lg">총 매입</h2>
//             <p className="text-xl font-bold">
//               {revenueAnalysis.totalPurchaseAmount.toLocaleString()} 원
//             </p>
//           </div>
//           <div>
//             <h2 className="font-semibold text-lg">평균 견적 금액</h2>
//             <p className="text-xl font-bold">
//               {revenueAnalysis.averageEstimateValue.toLocaleString()} 원
//             </p>
//           </div>
//         </div>
//       )}

//       {/* 🔹 월별 매출 차트 */}
//       {monthlyLabels.length > 0 && (
//         <div className="bg-[#FBFBFB] p-4 rounded-md mt-6">
//           <h2 className="font-semibold text-md mb-2">월별 매출</h2>
//           <ReactApexChart
//             options={{
//               xaxis: { categories: monthlyLabels },
//             }}
//             series={[{ name: "매출", data: monthlyValues }]}
//             type="area"
//             height={300}
//           />
//         </div>
//       )}

//       <div className="grid grid-cols-2 gap-4 mt-6">
//         {/* 견적서(estimate) 도넛 차트 */}
//         <div className="bg-[#FBFBFB] rounded-md border p-4">
//           <h2 className="font-semibold text-md mb-2">구매한 제품 (견적서)</h2>

//           <ReactApexChart
//             options={{
//               labels: estimateNames,
//               chart: { type: "donut" },
//               legend: { position: "right" },
//             }}
//             series={estimatePrices}
//             type="donut"
//             height={300}
//           />
//         </div>

//         {/* 발주서(order) 바 차트 */}
//         <div className="bg-[#FBFBFB] rounded-md border p-4">
//           <h2 className="font-semibold text-md mb-2">발주한 품목 (발주서)</h2>
//           <ReactApexChart
//             options={{
//               chart: { type: "donut" },
//               labels: orderNames, // 🔹 각 항목의 라벨 추가
//               legend: { position: "right" }, // 🔹 범례 하단 배치
//               dataLabels: { enabled: true }, // 🔹 데이터 레이블 표시
//             }}
//             series={orderPrices} // 🔹 도넛 차트는 배열만 받음
//             type="donut"
//             height={300}
//           />
//         </div>
//       </div>

//       {/* 상담 내역 & 문서 내역 테이블 */}
//       <div className="grid grid-cols-2 gap-4 mt-6">
//         {/* 상담 내역 테이블 */}
//         <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-64 flex flex-col">
//           <h2 className="font-semibold text-md mb-2">상담 내역</h2>
//           <div className="h-40 overflow-y-auto">
//             <table className="w-full text-xs border-collapse">
//               <thead className="border-b font-semibold bg-gray-100 sticky top-0">
//                 <tr>
//                   <th className="px-2 py-1">상담일</th>
//                   <th className="px-2 py-1">내용</th>
//                   <th className="px-2 py-1">우선순위</th>
//                 </tr>
//               </thead>
//               <tbody className="text-sm">
//                 {paginate(consultations, consultationPage).map((c, index) => (
//                   <tr
//                     key={index}
//                     className="border-b cursor-pointer hover:bg-gray-100"
//                     onClick={() => router.push(`/consultations/${c.id}`)}
//                   >
//                     <td className="px-2 py-1">{c.date}</td>
//                     <td className="px-2 py-1 truncate">{c.content}</td>
//                     <td className="px-2 py-1">{c.priority}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* 상담 내역 페이지네이션 */}
//           <div className="flex justify-center mt-2 space-x-2">
//             <Button
//               onClick={() =>
//                 setConsultationPage((prev) => Math.max(prev - 1, 1))
//               }
//               disabled={consultationPage === 1}
//               size="small"
//             >
//               이전
//             </Button>
//             <Button
//               onClick={() =>
//                 setConsultationPage((prev) =>
//                   Math.min(
//                     prev + 1,
//                     Math.ceil(consultations.length / itemsPerPage)
//                   )
//                 )
//               }
//               disabled={
//                 consultationPage >=
//                 Math.ceil(consultations.length / itemsPerPage)
//               }
//               size="small"
//             >
//               다음
//             </Button>
//           </div>
//         </div>

//         {/* 문서 내역 테이블 */}
//         <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-64 flex flex-col">
//           <h2 className="font-semibold text-md mb-2">문서 내역</h2>
//           <div className="h-40 overflow-y-auto">
//             <table className="w-full text-xs border-collapse">
//               <thead className="border-b font-semibold bg-gray-100 sticky top-0">
//                 <tr>
//                   <th className="px-2 py-1">문서번호</th>
//                   <th className="px-2 py-1">유형</th>
//                   <th className="px-2 py-1">작성일</th>
//                 </tr>
//               </thead>
//               <tbody className="text-sm">
//                 {paginate(documents, documentPage).map((d, index) => (
//                   <tr
//                     key={index}
//                     className="border-b cursor-pointer hover:bg-gray-100"
//                   >
//                     <td className="px-2 py-1">{d.document_number}</td>
//                     <td className="px-2 py-1">{d.type}</td>
//                     <td className="px-2 py-1">{d.created_at}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* 문서 내역 페이지네이션 추가 */}
//           <div className="flex justify-center mt-2 space-x-2">
//             <Button
//               onClick={() => setDocumentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={documentPage === 1}
//               size="small"
//             >
//               이전
//             </Button>
//             <Button
//               onClick={() =>
//                 setDocumentPage((prev) =>
//                   Math.min(prev + 1, Math.ceil(documents.length / itemsPerPage))
//                 )
//               }
//               disabled={
//                 documentPage >= Math.ceil(documents.length / itemsPerPage)
//               }
//               size="small"
//             >
//               다음
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
