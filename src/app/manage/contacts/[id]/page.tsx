"use client";

import { useState, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";
import { CircularProgress, Button } from "@mui/material";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  company_name: string;
  company_id: string;
}

interface Consultation {
  id: string;
  date: string;
  content: string;
  priority: string;
}

interface Document {
  id: string;
  document_number: string;
  type: string;
  created_at: string;
  content: {
    items: {
      name: string;
      spec: string;
      amount: number;
      number: number;
      quantity: string;
      unit_price: number;
      unit: string;
    }[];
    notes: string;
    valid_until: string;
    company_name: string;
    total_amount: number;
    delivery_term: string;
    delivery_place: string;
    delivery_date: string;
  };
}

interface RevenueAnalysis {
  totalRevenue: number;
  averageEstimateValue: number;
  monthlyRevenue: Record<string, number>; // 월별 매출
  totalPurchaseAmount: number;
}

export default function ContactDetailPage() {
  const { id } = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [revenueAnalysis, setRevenueAnalysis] =
    useState<RevenueAnalysis | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 페이지네이션 상태
  const [consultationPage, setConsultationPage] = useState(1);
  const [documentPage, setDocumentPage] = useState(1);
  const itemsPerPage = 10; // 한 페이지당 표시할 아이템 개수

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/manage/contacts/${id}`);
        const data = await response.json();

        if (!response.ok)
          throw new Error(data.error || "데이터를 불러오는 데 실패했습니다.");

        setContact(data.contact);
        setConsultations(data.consultations);
        setDocuments(data.documents);
        setRevenueAnalysis(data.revenueAnalysis); // 🔹 추가된 매출 분석 데이터 저장
      } catch (error) {
        console.error("Error fetching contact details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <CircularProgress />
      </div>
    );

  // 페이지네이션 처리 함수
  const paginate = (data: any[], page: number) =>
    data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const estimateData = documents
    .filter((doc) => doc.type === "estimate")
    .flatMap((doc) => doc.content.items);

  const estimateNames = estimateData.map((item) => item.name);
  const estimatePrices = estimateData.map((item) => item.amount);

  // 🔹 발주서(order)에서 품명과 구매액 추출
  const orderData = documents
    .filter((doc) => doc.type === "order")
    .flatMap((doc) => doc.content.items);

  const orderNames = orderData.map((item) => item.name);
  const orderPrices = orderData.map((item) => item.amount);

  // 🔹 월별 매출 차트 데이터 변환
  const monthlyLabels = revenueAnalysis
    ? Object.keys(revenueAnalysis.monthlyRevenue)
    : [];
  const monthlyValues = revenueAnalysis
    ? Object.values(revenueAnalysis.monthlyRevenue)
    : [];

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">담당자 상세 정보</h1>

      {/* 담당자 기본 정보 */}
      {contact && (
        <div className="bg-[#FBFBFB] p-4 rounded-md mt-4">
          <p>
            <strong>이름:</strong> {contact.contact_name}
          </p>
          <p>
            <strong>전화번호:</strong> {contact.mobile}
          </p>
          <p>
            <strong>이메일:</strong> {contact.email}
          </p>
          <p>
            <strong>부서:</strong> {contact.department}
          </p>
          <p>
            <strong>직급:</strong> {contact.level}
          </p>
        </div>
      )}

      {/* 🔹 매출 분석 데이터 표시 */}
      {revenueAnalysis && (
        <div className="bg-[#FBFBFB] p-4 rounded-md mt-4 flex justify-between">
          <div>
            <h2 className="font-semibold text-lg">총 매출</h2>
            <p className="text-xl font-bold">
              {revenueAnalysis.totalRevenue.toLocaleString()} 원
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-lg">총 매입</h2>
            <p className="text-xl font-bold">
              {revenueAnalysis.totalPurchaseAmount.toLocaleString()} 원
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-lg">평균 견적 금액</h2>
            <p className="text-xl font-bold">
              {revenueAnalysis.averageEstimateValue.toLocaleString()} 원
            </p>
          </div>
        </div>
      )}

      {/* 🔹 월별 매출 차트 */}
      {monthlyLabels.length > 0 && (
        <div className="bg-[#FBFBFB] p-4 rounded-md mt-6">
          <h2 className="font-semibold text-md mb-2">월별 매출</h2>
          <ReactApexChart
            options={{
              xaxis: { categories: monthlyLabels },
            }}
            series={[{ name: "매출", data: monthlyValues }]}
            type="area"
            height={300}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* 견적서(estimate) 도넛 차트 */}
        <div className="bg-[#FBFBFB] rounded-md border p-4">
          <h2 className="font-semibold text-md mb-2">구매한 제품 (견적서)</h2>

          <ReactApexChart
            options={{
              labels: estimateNames,
              chart: { type: "donut" },
              legend: { position: "right" },
            }}
            series={estimatePrices}
            type="donut"
            height={300}
          />
        </div>

        {/* 발주서(order) 바 차트 */}
        <div className="bg-[#FBFBFB] rounded-md border p-4">
          <h2 className="font-semibold text-md mb-2">발주한 품목 (발주서)</h2>
          <ReactApexChart
            options={{
              chart: { type: "donut" },
              labels: orderNames, // 🔹 각 항목의 라벨 추가
              legend: { position: "right" }, // 🔹 범례 하단 배치
              dataLabels: { enabled: true }, // 🔹 데이터 레이블 표시
            }}
            series={orderPrices} // 🔹 도넛 차트는 배열만 받음
            type="donut"
            height={300}
          />
        </div>
      </div>

      {/* 상담 내역 & 문서 내역 테이블 */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* 상담 내역 테이블 */}
        <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-64 flex flex-col">
          <h2 className="font-semibold text-md mb-2">상담 내역</h2>
          <div className="h-40 overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="border-b font-semibold bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-2 py-1">상담일</th>
                  <th className="px-2 py-1">내용</th>
                  <th className="px-2 py-1">우선순위</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginate(consultations, consultationPage).map((c, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/consultations/${c.id}`)}
                  >
                    <td className="px-2 py-1">{c.date}</td>
                    <td className="px-2 py-1 truncate">{c.content}</td>
                    <td className="px-2 py-1">{c.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 상담 내역 페이지네이션 */}
          <div className="flex justify-center mt-2 space-x-2">
            <Button
              onClick={() =>
                setConsultationPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={consultationPage === 1}
              size="small"
            >
              이전
            </Button>
            <Button
              onClick={() =>
                setConsultationPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(consultations.length / itemsPerPage)
                  )
                )
              }
              disabled={
                consultationPage >=
                Math.ceil(consultations.length / itemsPerPage)
              }
              size="small"
            >
              다음
            </Button>
          </div>
        </div>

        {/* 문서 내역 테이블 */}
        <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-64 flex flex-col">
          <h2 className="font-semibold text-md mb-2">문서 내역</h2>
          <div className="h-40 overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="border-b font-semibold bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-2 py-1">문서번호</th>
                  <th className="px-2 py-1">유형</th>
                  <th className="px-2 py-1">작성일</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginate(documents, documentPage).map((d, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-100"
                  >
                    <td className="px-2 py-1">{d.document_number}</td>
                    <td className="px-2 py-1">{d.type}</td>
                    <td className="px-2 py-1">{d.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 문서 내역 페이지네이션 추가 */}
          <div className="flex justify-center mt-2 space-x-2">
            <Button
              onClick={() => setDocumentPage((prev) => Math.max(prev - 1, 1))}
              disabled={documentPage === 1}
              size="small"
            >
              이전
            </Button>
            <Button
              onClick={() =>
                setDocumentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(documents.length / itemsPerPage))
                )
              }
              disabled={
                documentPage >= Math.ceil(documents.length / itemsPerPage)
              }
              size="small"
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
