"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUsersList } from "@/hooks/useUserList";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
import { useLoginUser } from "@/context/login";

export default function UsersListPage() {
  const router = useRouter();
  const loginUser = useLoginUser();

  if (loginUser?.role !== "admin") {
    router.push(`/reports/users/${loginUser?.id}`);
    return <div>잘못된 접근입니다</div>;
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "year"
  ); // 기본 연도별

  // ✅ 직원 목록 가져오기
  const { users, isLoading } = useUsersList();
  const userIds = users.map((user: any) => user.id);

  // ✅ 날짜 필터링 설정
  const today = new Date();
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${today.getFullYear()}-01-01`;
    endDate = `${today.getFullYear()}-12-31`;
  } else if (dateFilter === "quarter") {
    const quarter = Math.floor(today.getMonth() / 3) + 1;
    startDate = `${today.getFullYear()}-${String(
      (quarter - 1) * 3 + 1
    ).padStart(2, "0")}-01`;
    endDate = new Date(today.getFullYear(), quarter * 3, 0)
      .toISOString()
      .split("T")[0];
  } else {
    // dateFilter === "month"
    startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
  }

  // ✅ 문서 총 견적 & 발주 금액 가져오기
  const { salesSummary, isLoading: isSalesLoading } = useUserSalesSummary(
    userIds,
    startDate,
    endDate
  );

  // ✅ 상담 개수 가져오기
  const { documents, isLoading: isConsultationsLoading } =
    useUserDocumentsCount(userIds, startDate, endDate);

  // 🔹 검색 필터 적용
  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-sm text-[#333]">
      {/* 🔍 검색 & 필터 */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="직원 이름 검색..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
      </div>

      {isLoading || isSalesLoading || isConsultationsLoading ? (
        <p className="text-gray-500 text-center">데이터 로딩 중...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: any) => {
            const userSales = salesSummary?.[user.id] || {
              estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
              orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
            };

            const userConsultations = documents?.[user.id] || {
              estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
              orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
            };

            return (
              <div
                key={user.id}
                className="rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all bg-[#FBFBFB]"
                onClick={() => router.push(`/reports/users/${user.id}`)}
              >
                <p className="font-bold text-blue-500">
                  {user.name} ({user.position})
                </p>
                <div className="grid grid-cols-2">
                  {/* 🔹 견적 상담 개수 & 금액 */}
                  <div className="mt-2 text-sm">
                    <p>
                      총 견적 상담:{" "}
                      <span className="font-bold">
                        {userConsultations.estimates.total.toLocaleString()} 건
                      </span>
                    </p>
                    <p className="text-gray-600">
                      - 진행 중:{" "}
                      {userConsultations.estimates.pending.toLocaleString()} 건
                    </p>
                    <p className="text-gray-600">
                      - 완료:{" "}
                      {userConsultations.estimates.completed.toLocaleString()}{" "}
                      건
                    </p>
                    <p className="text-gray-600">
                      - 취소:{" "}
                      {userConsultations.estimates.canceled.toLocaleString()} 건
                    </p>

                    <p className="mt-1 text-blue-600 font-semibold">
                      완료된 견적 금액:{" "}
                      {userSales.estimates.completed.toLocaleString()} 원
                    </p>
                    <p className="text-red-500 font-semibold">
                      취소된 견적 금액:{" "}
                      {userSales.estimates.canceled.toLocaleString()} 원
                    </p>
                  </div>

                  {/* 🔹 발주 상담 개수 & 금액 */}
                  <div className="mt-2 text-sm">
                    <p>
                      총 발주 상담:{" "}
                      <span className="font-bold">
                        {userConsultations.orders.total.toLocaleString()} 건
                      </span>
                    </p>
                    <p className="text-gray-600">
                      - 진행 중:{" "}
                      {userConsultations.orders.pending.toLocaleString()} 건
                    </p>
                    <p className="text-gray-600">
                      - 완료:{" "}
                      {userConsultations.orders.completed.toLocaleString()} 건
                    </p>
                    <p className="text-gray-600">
                      - 취소:{" "}
                      {userConsultations.orders.canceled.toLocaleString()} 건
                    </p>

                    <p className="mt-1 text-blue-600 font-semibold">
                      완료된 발주 금액:{" "}
                      {userSales.orders.completed.toLocaleString()} 원
                    </p>
                    <p className="text-red-500 font-semibold">
                      취소된 발주 금액:{" "}
                      {userSales.orders.canceled.toLocaleString()} 원
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
