import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    if (!id || !startDate || !endDate) {
      return NextResponse.json(
        { error: "userId, startDate, endDate가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ Supabase RPC 호출
    const { data, error } = await supabase.rpc("get_user_transactions", {
      user_uuid: id,
      start_date: startDate,
      end_date: endDate,
    });

    console.log("data", data);

    if (error) throw error;

    // ✅ 데이터 가공
    const salesCompanies: any[] = [];
    const purchaseCompanies: any[] = [];
    const salesProducts: any[] = [];
    const purchaseProducts: any[] = [];

    data.forEach((item: any) => {
      // 거래처 데이터 분류
      if (item.total_sales > 0) {
        salesCompanies.push({
          name: item.company_name,
          total: item.total_sales,
        });
      }
      if (item.total_purchases > 0) {
        purchaseCompanies.push({
          name: item.company_name,
          total: item.total_purchases,
        });
      }

      // 제품 데이터 분류
      if (item.type === "estimate") {
        salesProducts.push({
          name: item.product_name,
          spec: item.spec,
          total: item.amount,
          quantity: item.quantity,
        });
      } else if (item.type === "order") {
        purchaseProducts.push({
          name: item.product_name,
          spec: item.spec,
          total: item.amount,
          quantity: item.quantity,
        });
      }
    });

    return NextResponse.json(
      {
        salesCompanies,
        purchaseCompanies,
        salesProducts,
        purchaseProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 유저 거래 내역 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
