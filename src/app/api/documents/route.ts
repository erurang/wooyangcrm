import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const role = searchParams.get("role") || "";
    const userId = searchParams.get("userId") || null;

    // 현재 날짜 기준으로 30일 전 날짜 계산
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    // const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // 🔹 `documents` 테이블에서 데이터 가져오기
    let documentsQuery = supabase
      .from("documents")
      .select(
        "id, type, status, content, user_id, document_number, created_at"
      );
    // .gte("created_at", thirtyDaysAgoISO);

    if (role === "user" && userId) {
      documentsQuery = documentsQuery.eq("user_id", userId);
    }

    const { data: documents, error: documentsError } = await documentsQuery;

    if (documentsError) {
      throw new Error(`Error fetching documents: ${documentsError.message}`);
    }

    // 🔹 `documents` 데이터 요약 처리
    const documentsSummary = documents.reduce(
      (acc: Record<string, any>, doc) => {
        const status = doc.status || "unknown";
        const type = doc.type || "unknown";

        if (!acc[type]) {
          acc[type] = { pending: 0, completed: 0, canceled: 0, unknown: 0 };
        }

        acc[type][status] = (acc[type][status] || 0) + 1;
        return acc;
      },
      {}
    );

    // 🔹 JSON 응답 반환
    return NextResponse.json({
      documents: Object.entries(documentsSummary).map(
        ([type, statusCounts]) => ({
          type,
          statusCounts,
        })
      ),
      documentDetails: documents, // 🔥 문서 상세 정보 추가
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
