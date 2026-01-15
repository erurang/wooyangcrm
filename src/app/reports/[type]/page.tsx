"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  useSalesReports,
  usePurchaseReports,
} from "@/hooks/reports/useReports";

interface ReportItem {
  name: string;
  spec?: string;
  quantity?: string | number;
  unit_price?: number;
  amount?: number;
}

interface ReportUser {
  name: string;
  level: string;
}

const ReportsPage = () => {
  const { type } = useParams(); // 🔥 URL에서 type(estimate, order) 가져오기
  const params = useSearchParams();
  const date = params.get("date");

  // ✅ URL에 date 값이 없으면 오늘 날짜로 설정
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = date || today;

  // ✅ 날짜 형식 확인 (YYYY-MM이면 월보, YYYY-MM-DD면 일보)
  const isMonthlyReport = selectedDate.length === 7; // YYYY-MM 형식이면 월보
  const reportTitle = isMonthlyReport ? "월보" : "일보";

  // ✅ 매출/매입 데이터 가져오기
  const { salesReports, isLoading: isSalesLoading } =
    useSalesReports(selectedDate);
  const { purchaseReports, isLoading: isPurchaseLoading } =
    usePurchaseReports(selectedDate);

  // 🔥 type에 따라 데이터 선택
  const reports = type === "estimate" ? salesReports : purchaseReports;
  const isLoading = type === "estimate" ? isSalesLoading : isPurchaseLoading;

  if (isLoading) return <p>Loading...</p>;

  // ✅ 총 매출액/총 매입액 계산
  const totalAmount = reports.reduce(
    (sum, report) => sum + (report.total_amount ?? 0),
    0
  );

  return (
    <div className="text-sm">
      {/* 🔹 총 매출액 / 매입액 표시 */}
      <div className="mb-4 text-lg font-semibold">
        총 {type === "estimate" ? "매출액" : "매입액"}:{" "}
        <span className="text-blue-600">{totalAmount.toLocaleString()} 원</span>
      </div>

      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-r-[1px] px-4 py-2 w-4">No</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/6">
                회사명
              </th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/6">품명</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/6">규격</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/12">수량</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/12">단가</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/12">금액</th>
              <th className="border-b border-r-[1px] px-4 py-2 w-1/12">합계</th>
              <th className="border-b px-4 py-2 w-1/6">
                {type === "estimate" ? "견적자" : "발주자"}
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => {
              const companyName = report.company_name || "";
              const totalAmt = report.total_amount ?? 0;

              return (
              <tr key={report.id}>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {index + 1}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {companyName}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {(report.content.items as ReportItem[] | undefined)?.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 py-1">
                      {item.name}
                    </div>
                  ))}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {(report.content.items as ReportItem[] | undefined)?.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 py-1">
                      {item.spec}
                    </div>
                  ))}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {(report.content.items as ReportItem[] | undefined)?.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 py-1">
                      {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {(report.content.items as ReportItem[] | undefined)?.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 py-1">
                      {item.unit_price?.toLocaleString()}
                    </div>
                  ))}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  {(report.content.items as ReportItem[] | undefined)?.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 py-1">
                      {item.amount?.toLocaleString()}
                    </div>
                  ))}
                </td>
                <td className="border-b border-r-[1px] px-4 py-2">
                  <p>{totalAmt?.toLocaleString()}</p>
                </td>
                <td className="border-b  px-4 py-2">
                  <p>
                    {(report.users as unknown as ReportUser)?.name} {(report.users as unknown as ReportUser)?.level}
                  </p>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
