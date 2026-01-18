import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";

// ✅ 한국 시간(KST) 기준 날짜 변환 함수
const getKSTDateRange = (date: string) => {
  if (!date) throw new Error("Date is required");

  let startDate, endDate;

  if (date.length === 7) {
    // 🔹 YYYY-MM 형식이면 월보 조회
    startDate = new Date(`${date}-01T00:00:00.000Z`);
    endDate = new Date(
      new Date(startDate).setMonth(startDate.getMonth() + 1, 0)
    ); // 해당 월의 마지막 날짜
    endDate.setUTCHours(23, 59, 59, 999);
  } else {
    // 🔹 YYYY-MM-DD 형식이면 일보 조회
    startDate = new Date(`${date}T00:00:00.000Z`);
    endDate = new Date(`${date}T23:59:59.999Z`);
  }

  // ✅ UTC+9 시간 보정
  startDate.setUTCHours(startDate.getUTCHours() - 9);
  endDate.setUTCHours(endDate.getUTCHours() - 9);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

// ✅ 문서 조회 함수 (매출, 매입 공통)
const fetchReports = async (type: "estimate" | "order", date: string) => {
  if (!date) return []; // 날짜가 없으면 빈 배열 반환

  const { startDate, endDate } = getKSTDateRange(date); // ✅ 한국 시간 변환

  const { data, error } = await supabase
    .from("documents")
    .select("id, document_number, content, created_at, company_id, type, status, users(name,level), total_amount, companies(name)")
    .eq("type", type)
    .gte("created_at", startDate) // ✅ 한국 시간 기준 시작
    .lte("created_at", endDate) // ✅ 한국 시간 기준 끝
    .order("created_at", { ascending: false });

  if (error) throw error;

  // companies.name을 company_name으로 매핑
  return (data || []).map((doc: any) => ({
    ...doc,
    company_name: doc.companies?.name || doc.content?.company_name || "-",
  }));
};

// ✅ 매출 (estimate)
export const useSalesReports = (date: string) => {
  const { data, error, isLoading } = useSWR(
    date ? `sales_reports_${date}` : null, // 🔥 date가 없으면 요청 안 함
    () => fetchReports("estimate", date)
  );
  return { salesReports: data || [], isLoading, error };
};

// ✅ 매입 (order)
export const usePurchaseReports = (date: string) => {
  const { data, error, isLoading } = useSWR(
    date ? `purchase_reports_${date}` : null, // 🔥 date가 없으면 요청 안 함
    () => fetchReports("order", date)
  );
  return { purchaseReports: data || [], isLoading, error };
};
