// pages/api/dashboard.ts

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

    // Base queries
    let consultationsQuery = supabase
      .from("consultations")
      .select("id", { count: "exact" })
      .gte("created_at", thirtyDaysAgo.toISOString()); // 30일 기준 필터 추가

    let documentsQuery = supabase
      .from("documents")
      .select(
        "id, type, status, content, contact, user_id, document_number, created_at",
        { count: "exact" }
      )
      .gte("created_at", thirtyDaysAgo.toISOString()); // 30일 기준 필터 추가

    // Role-based filtering
    if (role === "user" && userId) {
      consultationsQuery = consultationsQuery.eq("user_id", userId);
      documentsQuery = documentsQuery.eq("user_id", userId);
    }

    // Fetch consultations data
    const { count: totalConsultations, error: consultationsError } =
      await consultationsQuery;

    if (consultationsError) {
      throw new Error(
        `Error fetching consultations: ${consultationsError.message}`
      );
    }

    // Fetch documents data
    const { data: documents, error: documentsError } = await documentsQuery;

    if (documentsError) {
      throw new Error(`Error fetching documents: ${documentsError.message}`);
    }

    // Process documents summary
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

    // Format the response
    return NextResponse.json({
      consultations: {
        total: totalConsultations || 0,
      },
      documents: Object.entries(documentsSummary).map(
        ([type, statusCounts]) => ({
          type,
          statusCounts,
        })
      ),
      documentDetails: documents, // Add detailed documents
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
