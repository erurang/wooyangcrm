"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useContactDetails } from "@/hooks/manage/contacts/detail/useContactDetails";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function ContactDetailPage() {
  const { id } = useParams();
  const contactId = Array.isArray(id) ? id[0] : id || "";

  // ✅ 필터 상태 추가
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "month"
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

  const { contactData, isLoading, error } = useContactDetails(
    contactId,
    startDate,
    endDate
  );

  if (isLoading) {
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

  // ✅ 상태별로 문서 필터링
  const confirmedDocuments = contactData.consultations.flatMap((c: any) =>
    c.documents.filter((doc: any) => doc.status === "completed")
  );
  const expectedDocuments = contactData.consultations.flatMap((c: any) =>
    c.documents.filter((doc: any) => doc.status === "pending")
  );
  const canceledDocuments = contactData.consultations.flatMap((c: any) =>
    c.documents.filter((doc: any) => doc.status === "canceled")
  );

  // ✅ 상태별 매입/매출 금액 계산
  // ✅ 상태별 매입/매출 금액 계산
  const confirmedPurchases = confirmedDocuments
    .filter((doc: any) => doc.type === "order") // 🟢 실제 매입 (우리가 이 담당자에게서 구매한 금액)
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  const confirmedSales = confirmedDocuments
    .filter((doc: any) => doc.type === "estimate") // 🟢 실제 매출 (이 담당자가 우리에게서 구매한 금액)
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  const expectedPurchases = expectedDocuments
    .filter((doc: any) => doc.type === "order") // 🟡 진행 중인 매입
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  const expectedSales = expectedDocuments
    .filter((doc: any) => doc.type === "estimate") // 🟡 진행 중인 매출
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  const canceledPurchases = canceledDocuments
    .filter((doc: any) => doc.type === "order") // 🔴 취소된 매입
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  const canceledSales = canceledDocuments
    .filter((doc: any) => doc.type === "estimate") // 🔴 취소된 매출
    .reduce(
      (sum: any, doc: any) =>
        sum +
        doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
      0
    );

  // ✅ 상담 데이터 가공
  const userConsultationStats = contactData.consultations.reduce(
    (acc: any, consultation: any) => {
      const userName = consultation.documents?.[0]?.user?.name || "미지정"; // 상담자 정보
      const status = consultation.documents?.[0]?.status || "pending"; // 상태 (기본값 pending)

      if (!acc[userName]) {
        acc[userName] = { completed: 0, pending: 0, canceled: 0, count: 0 };
      }

      acc[userName][status] += consultation.documents.reduce(
        (sum: any, doc: any) =>
          sum +
          doc.items.reduce((subSum: any, item: any) => subSum + item.amount, 0),
        0
      );

      acc[userName].count += 1; // 상담 건수 증가
      return acc;
    },
    {}
  );

  // ✅ 차트 데이터 변환

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "진행 중";
      case "completed":
        return "완료됨";
      case "canceled":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  return (
    <div className="text-sm text-[#333]">
      <div className="mb-4">
        <Link
          href="/manage/contacts"
          className="text-blue-500 hover:font-semibold"
        >
          담당자 관리{" "}
        </Link>
        <span className="text-[#333] font-semibold">- 상세정보</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-6 shadow-sm">
          {/* 🔹 유저 정보 섹션 */}
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
              <p className="text-xl font-bold text-gray-800">
                {contactData.contact_name}{" "}
                <span className="text-gray-600">
                  {contactData.department || "-"} / {contactData.level || "-"}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {contactData.company_name}{" "}
                <span className="font-semibold text-blue-600">
                  {contactData.mobile || "-"} {contactData.email || "-"}
                </span>
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-2 grid grid-cols-3">
            <p>
              🟢 확정된 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {confirmedSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🟢 확정된 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {confirmedPurchases.toLocaleString()} 원 원
              </span>
            </p>
            <p>
              🟡 진행 중 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {expectedSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🟡 진행 중 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {expectedPurchases.toLocaleString()} 원
              </span>
            </p>
            <p>
              🔴 취소된 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {canceledSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🔴 취소된 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {canceledPurchases.toLocaleString()} 원
              </span>
            </p>
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
      </div>

      {/* <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <h2 className="text-lg font-bold mb-4">📊 상담자별 상담 현황</h2>

          <div className="grid grid-cols-[1fr_2fr] gap-6">
            <ul className="space-y-2">
              {Object.entries(userConsultationStats).map(
                ([user, stats]: any) => (
                  <li
                    key={user}
                    className="flex justify-between items-center text-sm p-2 border rounded-md "
                  >
                    <span className="font-semibold">{user}</span>
                    <span className="text-gray-500">{stats.count}건</span>
                  </li>
                )
              )}
            </ul>

            <div className="p-4 border rounded-md bg-white shadow-sm"></div>
          </div>
        </div>
        
      </div> */}
      {/*  */}
      <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 mt-4">
        <h2 className="text-lg font-bold mb-4">상담 내역 & 문서 & 품목</h2>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[2fr_1fr_2fr] gap-6 min-w-[900px] font-semibold text-gray-700">
            <div>상담 기록</div>
            <div>관련 문서</div>
            <div>품목 리스트</div>
          </div>

          {/* 🔹 스크롤 가능 영역 */}
          <div className="space-y-4 mt-2 overflow-y-auto max-h-[700px]">
            {contactData.consultations.map((consultation: any, index: any) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_2fr] gap-6 items-center border-b pb-4"
              >
                {/* 🔹 상담 기록 */}
                <div className="p-3 border rounded-md bg-white">
                  <div className="text-sm text-gray-600">
                    {consultation.date}
                  </div>
                  <p className="text-gray-800 whitespace-pre-line">
                    {consultation.content}
                  </p>
                </div>

                {/* 🔹 관련 문서 (문서 유형 추가) */}
                <div className="p-3 border rounded-md bg-white">
                  {consultation.documents.length > 0 ? (
                    consultation.documents.map((doc: any, docIndex: number) => (
                      <div
                        key={docIndex}
                        className="p-2 border rounded-md bg-gray-50 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-blue-600">
                          {doc.type === "estimate" ? "📄 견적서" : "📑 발주서"}
                          <span className="pl-2">
                            ({getStatusText(doc.status)})
                          </span>
                        </p>
                        <p className="text-xs text-gray-700">
                          문서번호:{" "}
                          <span className="font-semibold">
                            {doc.document_number}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          생성일: {doc.created_at.split("T")[0]}
                        </p>
                        <p className="text-xs">
                          담당자:{" "}
                          <span className="font-semibold">{doc.user.name}</span>{" "}
                          ({doc.user.level})
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">📂 관련 문서 없음</p>
                  )}
                </div>

                {/* 🔹 품목 리스트 (quantity 추가 + 순서 변경) */}
                <div className="p-3 border rounded-md bg-white">
                  {consultation.documents.length > 0 ? (
                    consultation.documents.map((doc: any) =>
                      doc.items.map((item: any, itemIndex: number) => (
                        <div
                          key={itemIndex}
                          className="grid grid-cols-4 gap-4 p-2 border rounded-md bg-gray-50 text-sm"
                        >
                          <span className="text-gray-700">{item.name}</span>
                          <span className="text-gray-500">{item.spec}</span>
                          <span className="text-gray-500">{item.quantity}</span>
                          <span className="text-blue-600 font-semibold">
                            {Number(item.amount).toLocaleString()} 원
                          </span>
                        </div>
                      ))
                    )
                  ) : (
                    <p className="text-gray-400 text-sm">📦 품목 없음</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/*  */}
    </div>
  );
}
