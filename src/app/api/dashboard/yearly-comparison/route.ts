import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentRecord {
  id: string;
  type: string;
  status: string;
  created_at: string;
  content: {
    items?: Array<{ amount?: number }>;
  } | null;
  consultations: Array<{
    id: string;
    user_id: string;
    date: string;
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const currentYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const previousYear = currentYear - 1;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Fetch documents for both years
    const { data: documents, error } = await supabase
      .from("documents")
      .select(`
        id,
        type,
        status,
        created_at,
        content,
        consultations!inner(
          id,
          user_id,
          date
        )
      `)
      .eq("consultations.user_id", userId)
      .in("type", ["estimate", "order"])
      .eq("status", "completed")
      .gte("created_at", `${previousYear}-01-01`)
      .lt("created_at", `${currentYear + 1}-01-01`);

    if (error) throw error;

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
    (documents as DocumentRecord[] | null)?.forEach((doc) => {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Yearly comparison error:", error);
    return NextResponse.json({ error: "Failed to fetch yearly comparison data" }, { status: 500 });
  }
}
