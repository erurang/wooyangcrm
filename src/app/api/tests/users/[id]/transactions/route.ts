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

    if (error) throw error;

    // ✅ 응답 데이터가 없을 경우 예외 처리
    if (!data || data.length === 0) {
      console.log("❌ 데이터 없음, 빈 배열 반환");
      return NextResponse.json(
        {
          salesCompanies: [],
          purchaseCompanies: [],
          salesProducts: [],
          purchaseProducts: [],
        },
        { status: 200 }
      );
    }

    // ✅ data가 배열 형태라면 첫 번째 요소만 사용
    const responseData = Array.isArray(data) ? data[0] : data;

    // ✅ 올바른 데이터 가공
    return NextResponse.json(
      {
        salesCompanies: responseData?.salescompanies ?? [],
        purchaseCompanies: responseData?.purchasecompanies ?? [],
        salesProducts: responseData?.salesproducts ?? [],
        purchaseProducts: responseData?.purchaseproducts ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 유저 거래 내역 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
