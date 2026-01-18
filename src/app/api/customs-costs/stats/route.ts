import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 통관비용 통계 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const month = searchParams.get("month") || ""; // 비어있으면 연간 통계
    const companyId = searchParams.get("company_id") || "";

    let query = supabase.from("customs_costs").select("*");

    // 기간 필터링
    if (month) {
      // 월별 통계
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = new Date(Number(year), Number(month), 0)
        .toISOString()
        .split("T")[0];
      query = query.gte("clearance_date", startDate).lte("clearance_date", endDate);
    } else {
      // 연간 통계
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte("clearance_date", startDate).lte("clearance_date", endDate);
    }

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: costs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 통계 계산
    const stats = {
      period: month ? `${year}-${month.padStart(2, "0")}` : year,
      total_count: costs?.length || 0,
      total_air_freight: 0,
      total_sea_freight: 0,
      total_customs_duty: 0,
      total_port_charges: 0,
      total_domestic_transport: 0,
      total_express_freight: 0,
      total_subtotal: 0,
      total_vat: 0,
      total_amount: 0,
    };

    costs?.forEach((cost) => {
      stats.total_air_freight += Number(cost.air_freight || 0);
      stats.total_sea_freight += Number(cost.sea_freight || 0);
      stats.total_customs_duty += Number(cost.customs_duty || 0);
      stats.total_port_charges += Number(cost.port_charges || 0);
      stats.total_domestic_transport += Number(cost.domestic_transport || 0);
      stats.total_express_freight += Number(cost.express_freight || 0);
      stats.total_subtotal += Number(cost.subtotal || 0);
      stats.total_vat += Number(cost.vat || 0);
      stats.total_amount += Number(cost.total || 0);
    });

    // 월별 breakdown 생성 (연간 통계일 때만)
    let monthlyBreakdown = null;
    if (!month && costs) {
      const monthlyMap = new Map<string, typeof stats>();

      costs.forEach((cost) => {
        const costMonth = cost.clearance_date.substring(0, 7); // YYYY-MM

        if (!monthlyMap.has(costMonth)) {
          monthlyMap.set(costMonth, {
            period: costMonth,
            total_count: 0,
            total_air_freight: 0,
            total_sea_freight: 0,
            total_customs_duty: 0,
            total_port_charges: 0,
            total_domestic_transport: 0,
            total_express_freight: 0,
            total_subtotal: 0,
            total_vat: 0,
            total_amount: 0,
          });
        }

        const monthStats = monthlyMap.get(costMonth)!;
        monthStats.total_count++;
        monthStats.total_air_freight += Number(cost.air_freight || 0);
        monthStats.total_sea_freight += Number(cost.sea_freight || 0);
        monthStats.total_customs_duty += Number(cost.customs_duty || 0);
        monthStats.total_port_charges += Number(cost.port_charges || 0);
        monthStats.total_domestic_transport += Number(cost.domestic_transport || 0);
        monthStats.total_express_freight += Number(cost.express_freight || 0);
        monthStats.total_subtotal += Number(cost.subtotal || 0);
        monthStats.total_vat += Number(cost.vat || 0);
        monthStats.total_amount += Number(cost.total || 0);
      });

      monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
      );
    }

    return NextResponse.json({
      stats,
      monthlyBreakdown,
    });
  } catch (error) {
    console.error("Error fetching customs cost stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch customs cost stats" },
      { status: 500 }
    );
  }
}
