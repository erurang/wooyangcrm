import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // 각 테이블의 레코드 수 조회
    const tables = [
      "users",
      "companies",
      "contacts",
      "consultations",
      "documents",
      "products",
      "notifications",
      "board_posts",
    ];

    const tableStats: { name: string; value: number }[] = [];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (!error) {
        tableStats.push({ name: table, value: count || 0 });
      }
    }

    // 총 레코드 수
    const totalRecords = tableStats.reduce((sum, t) => sum + t.value, 0);

    // 이번 달 vs 지난 달 데이터 증가율 계산
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // 이번 달 상담 수
    const { count: thisMonthConsultations } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart);

    // 지난 달 상담 수
    const { count: lastMonthConsultations } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd);

    // 이번 달 문서 수
    const { count: thisMonthDocuments } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart);

    // 지난 달 문서 수
    const { count: lastMonthDocuments } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd);

    // 변화율 계산
    const consultationChange = lastMonthConsultations
      ? (((thisMonthConsultations || 0) - lastMonthConsultations) / lastMonthConsultations) * 100
      : 0;
    const documentChange = lastMonthDocuments
      ? (((thisMonthDocuments || 0) - lastMonthDocuments) / lastMonthDocuments) * 100
      : 0;

    // 월별 데이터 (최근 6개월)
    const monthlyData: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = `${monthStart.getMonth() + 1}월`;

      const { count } = await supabase
        .from("consultations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      monthlyData.push({ month: monthName, value: count || 0 });
    }

    // 개별 테이블 카운트 추출
    const usersCount = tableStats.find(t => t.name === "users")?.value || 0;
    const companiesCount = tableStats.find(t => t.name === "companies")?.value || 0;
    const documentsCount = tableStats.find(t => t.name === "documents")?.value || 0;

    return NextResponse.json({
      overview: {
        totalRecords,
        users: usersCount,
        companies: companiesCount,
        documents: documentsCount,
        consultationChange: Math.round(consultationChange * 10) / 10,
        documentChange: Math.round(documentChange * 10) / 10,
      },
      tableStats,
      monthlyData,
    });
  } catch (error) {
    console.error("Statistics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
