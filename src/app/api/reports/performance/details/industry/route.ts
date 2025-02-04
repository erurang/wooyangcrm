import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const industryType = searchParams.get("industryType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!industryType || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("type, content")
      .eq("industry", industryType)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) throw error;

    let totalSales = 0;
    let totalPurchases = 0;
    let companyCount = data.length;

    data.forEach((doc) => {
      const amount = doc.content.total_amount || 0;
      if (doc.type === "estimate") totalSales += amount;
      else if (doc.type === "order") totalPurchases += amount;
    });

    return NextResponse.json(
      {
        avgSales: totalSales / companyCount,
        avgPurchases: totalPurchases / companyCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching industry data:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
