import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface CompanyData {
  id: string;
  name: string;
}

interface DocumentRow {
  id: string;
  type: string;
  status: string;
  total_amount: number | null;
  created_at: string;
  date: string;
  company_id: string;
  user_id: string;
  companies: CompanyData | CompanyData[] | null;
  users: { id: string; name: string } | { id: string; name: string }[] | null;
}

interface MonthlySummary {
  month: string; // YYYY-MM format
  estimate: number;
  order: number;
  requestQuote: number;
  total: number;
}

interface CompanySummary {
  company_id: string;
  company_name: string;
  estimate_amount: number;
  order_amount: number;
  estimate_count: number;
  order_count: number;
}

interface TypeStatusSummary {
  type: string;
  pending: number;
  completed: number;
  canceled: number;
  expired: number;
  total: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const userId = searchParams.get("userId") || "";
    const companyId = searchParams.get("companyId") || "";

    // 기본 쿼리 생성
    let query = supabase
      .from("documents")
      .select(`
        id,
        type,
        status,
        total_amount,
        created_at,
        date,
        company_id,
        user_id,
        companies:company_id (id, name),
        users:user_id (id, name)
      `)
      .in("type", ["estimate", "order", "requestQuote"]);

    // 필터 적용
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // 타입별 상태별 합계
    const typeStatusSummary: Record<string, TypeStatusSummary> = {
      estimate: { type: "estimate", pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      order: { type: "order", pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      requestQuote: { type: "requestQuote", pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
    };

    // 월별 합계
    const monthlyMap = new Map<string, MonthlySummary>();

    // 거래처별 합계
    const companyMap = new Map<string, CompanySummary>();

    // 전체 합계
    let totalSales = 0; // 견적서 완료 금액
    let totalPurchase = 0; // 발주서 완료 금액
    let totalPending = 0; // 진행 중 금액

    (documents || []).forEach((doc: DocumentRow) => {
      const amount = doc.total_amount || 0;
      const docType = doc.type as "estimate" | "order" | "requestQuote";
      const status = doc.status as "pending" | "completed" | "canceled" | "expired";

      // 타입별 상태별 합계
      if (typeStatusSummary[docType] && status in typeStatusSummary[docType]) {
        typeStatusSummary[docType][status] += amount;
        typeStatusSummary[docType].total += amount;
      }

      // 월별 합계 (date 필드 기준)
      const dateStr = doc.date || doc.created_at;
      if (dateStr) {
        const month = dateStr.substring(0, 7); // YYYY-MM
        const monthData = monthlyMap.get(month) || {
          month,
          estimate: 0,
          order: 0,
          requestQuote: 0,
          total: 0,
        };

        // 완료된 문서만 월별 합계에 포함
        if (status === "completed") {
          monthData[docType] += amount;
          monthData.total += amount;
        }
        monthlyMap.set(month, monthData);
      }

      // 거래처별 합계 (완료 문서만)
      if (status === "completed" && doc.company_id) {
        const company = Array.isArray(doc.companies) ? doc.companies[0] : doc.companies;
        const companyData = companyMap.get(doc.company_id) || {
          company_id: doc.company_id,
          company_name: company?.name || "알 수 없음",
          estimate_amount: 0,
          order_amount: 0,
          estimate_count: 0,
          order_count: 0,
        };

        if (docType === "estimate") {
          companyData.estimate_amount += amount;
          companyData.estimate_count += 1;
        } else if (docType === "order") {
          companyData.order_amount += amount;
          companyData.order_count += 1;
        }

        companyMap.set(doc.company_id, companyData);
      }

      // 전체 합계
      if (status === "completed") {
        if (docType === "estimate") {
          totalSales += amount;
        } else if (docType === "order") {
          totalPurchase += amount;
        }
      } else if (status === "pending") {
        totalPending += amount;
      }
    });

    // 월별 데이터 정렬 (날짜순)
    const monthlySummary = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    // 거래처별 데이터 정렬 (총 금액순)
    const companySummary = Array.from(companyMap.values())
      .sort((a, b) => (b.estimate_amount + b.order_amount) - (a.estimate_amount + a.order_amount))
      .slice(0, 20); // 상위 20개

    // 문서 건수
    const documentCounts = {
      estimate: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      order: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      requestQuote: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
    };

    (documents || []).forEach((doc: DocumentRow) => {
      const docType = doc.type as "estimate" | "order" | "requestQuote";
      const status = doc.status as "pending" | "completed" | "canceled" | "expired";
      if (documentCounts[docType] && status in documentCounts[docType]) {
        documentCounts[docType][status] += 1;
        documentCounts[docType].total += 1;
      }
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalPurchase,
        totalPending,
        profit: totalSales - totalPurchase,
      },
      typeStatusSummary: Object.values(typeStatusSummary),
      monthlySummary,
      companySummary,
      documentCounts,
    });
  } catch (error) {
    console.error("Error in documents/costs/summary API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
