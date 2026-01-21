import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logApiCall, getIpFromRequest, getUserAgentFromRequest } from "@/lib/apiLogger";

interface DocumentRecord {
  id: string;
  type: string;
  status: string;
  created_at: string;
  content: {
    items?: Array<{ amount?: number }>;
  } | null;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const currentYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const previousYear = currentYear - 1;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // 1. 먼저 해당 사용자의 상담 ID들을 가져옴 (최근 2년)
    const { data: consultationIds, error: consultationError } = await supabase
      .from("consultations")
      .select("id")
      .eq("user_id", userId)
      .gte("date", `${previousYear}-01-01`)
      .lt("date", `${currentYear + 1}-01-01`);

    if (consultationError) throw consultationError;

    // 상담이 없으면 빈 데이터 반환
    if (!consultationIds || consultationIds.length === 0) {
      const emptyMonthlyData = Array(12).fill(0);
      return NextResponse.json({
        months: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        currentYear: { year: currentYear, sales: emptyMonthlyData, purchases: emptyMonthlyData },
        previousYear: { year: previousYear, sales: emptyMonthlyData, purchases: emptyMonthlyData },
      });
    }

    const ids = consultationIds.map(c => c.id);

    // 2. 해당 상담에 연결된 문서들 가져옴
    // Supabase .in() 쿼리는 URL 길이 제한이 있으므로 배치 처리
    const BATCH_SIZE = 100;
    const allDocuments: (DocumentRecord & { consultation_id: string })[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const { data: batchDocuments, error } = await supabase
        .from("documents")
        .select("id, type, status, created_at, content, consultation_id")
        .in("consultation_id", batchIds)
        .in("type", ["estimate", "order"])
        .eq("status", "completed")
        .gte("created_at", `${previousYear}-01-01`)
        .lt("created_at", `${currentYear + 1}-01-01`);

      if (error) throw error;
      if (batchDocuments) {
        allDocuments.push(...(batchDocuments as (DocumentRecord & { consultation_id: string })[]));
      }
    }

    const documents = allDocuments;

    // Initialize monthly data
    const monthlyData: Record<number, Record<number, { sales: number; purchases: number }>> = {
      [currentYear]: {},
      [previousYear]: {},
    };

    // Initialize all months
    for (let month = 1; month <= 12; month++) {
      monthlyData[currentYear][month] = { sales: 0, purchases: 0 };
      monthlyData[previousYear][month] = { sales: 0, purchases: 0 };
    }

    // Process documents
    documents.forEach((doc) => {
      const createdAt = new Date(doc.created_at);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1;

      if (!monthlyData[year]) return;

      const items = doc.content?.items || [];
      const total = items.reduce((sum: number, item: { amount?: number }) => sum + (item.amount || 0), 0);

      if (doc.type === "estimate") {
        monthlyData[year][month].sales += total;
      } else if (doc.type === "order") {
        monthlyData[year][month].purchases += total;
      }
    });

    // Format response
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    const result = {
      months,
      currentYear: {
        year: currentYear,
        sales: Object.values(monthlyData[currentYear]).map((m) => m.sales),
        purchases: Object.values(monthlyData[currentYear]).map((m) => m.purchases),
      },
      previousYear: {
        year: previousYear,
        sales: Object.values(monthlyData[previousYear]).map((m) => m.sales),
        purchases: Object.values(monthlyData[previousYear]).map((m) => m.purchases),
      },
    };

    // API 호출 로깅
    logApiCall({
      userId,
      endpoint: "/api/dashboard/yearly-comparison",
      method: "GET",
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(request),
      userAgent: getUserAgentFromRequest(request),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Yearly comparison error:", error);

    // 에러 로깅
    logApiCall({
      userId,
      endpoint: "/api/dashboard/yearly-comparison",
      method: "GET",
      statusCode: 500,
      responseTimeMs: Date.now() - startTime,
      ipAddress: getIpFromRequest(request),
      userAgent: getUserAgentFromRequest(request),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Failed to fetch yearly comparison data" }, { status: 500 });
  }
}
