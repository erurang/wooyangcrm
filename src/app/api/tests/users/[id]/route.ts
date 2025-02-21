import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = new URL(req.url).searchParams;
  const dateFilter = searchParams.get("filter") || "year";

  if (!id) {
    return NextResponse.json(
      { error: "userId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // ✅ 유저 기본 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, position, email, level")
      .eq("id", id)
      .single();

    if (userError) throw userError;

    // ✅ 유저의 매출/발주 요약 정보 가져오기 (연도/분기/월별 필터 적용)
    const { data: salesSummary, error: salesError } = await supabase.rpc(
      "get_user_sales_summary",
      { user_uuid: id, filter: dateFilter }
    );

    if (salesError) throw salesError;

    // ✅ 유저가 거래한 회사 목록 가져오기
    const { data: companyTransactions, error: companyError } =
      await supabase.rpc("get_user_company_transactions", {
        user_uuid: id,
        filter: dateFilter,
      });

    if (companyError) throw companyError;

    // ✅ 유저가 거래한 제품 목록 가져오기
    const { data: productTransactions, error: productError } =
      await supabase.rpc("get_user_product_transactions", {
        user_uuid: id,
        filter: dateFilter,
      });

    if (productError) throw productError;

    return NextResponse.json(
      {
        user,
        salesSummary,
        companyTransactions,
        productTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("유저 상세 정보 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
