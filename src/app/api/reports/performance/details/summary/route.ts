import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get("companyId");
  const startDate = searchParams.get("startDate"); // `startDate`만 받아옴
  const userId = "c79219a1-7ac0-41bd-92c5-94e665313a7e"; // 현재 유저 ID
  const type = searchParams.get("type"); // type (order or estimate)

  // 필수 파라미터 체크
  if (!companyId || !startDate || !userId || !type) {
    return NextResponse.json(
      { error: "Missing companyId, startDate, userId, or type" },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ 현재 년도 매출 데이터 (status = 'completed') - type에 따라 필터링 (order or estimate)
    const startYear = startDate.split("-")[0]; // "YYYY-MM-DD"에서 년도만 추출
    const currentYearStartDate = `${startYear}-01-01`; // 현재 년도 시작일 (1월 1일)
    const currentYearEndDate = new Date().toISOString().split("T")[0]; // 오늘 날짜

    const { data: currentYearData, error: currentYearError } = await supabase
      .from("documents")
      .select("content -> total_amount, content -> items, created_at")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", currentYearStartDate)
      .lte("created_at", currentYearEndDate);

    console.log("current", currentYearData);
    if (currentYearError) throw currentYearError;

    // 2️⃣ 전년도 매출 데이터 (status = 'completed') - type에 따라 필터링
    const lastYearStartDate = `${startYear - 1}-01-01`; // 전년 1월 1일
    const lastYearEndDate = `${startYear - 1}-12-31`; // 전년 12월 31일

    const { data: lastYearData, error: lastYearError } = await supabase
      .from("documents")
      .select("content -> total_amount, content -> items, created_at")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", lastYearStartDate)
      .lte("created_at", lastYearEndDate);

    if (lastYearError) throw lastYearError;

    console.log("lastyeardat", lastYearData);

    // 3️⃣ 데이터 집계: 월별 매출 계산 (금액)
    const currentYearMonthlySales = Array(12).fill(0); // 12개월을 초기화
    const lastYearMonthlySales = Array(12).fill(0); // 12개월을 초기화

    // 현재년도 매출 집계
    currentYearData.forEach((doc: any) => {
      const month = new Date(doc.created_at).getMonth(); // 월 가져오기 (0: 1월, 11: 12월)
      currentYearMonthlySales[month] += doc.total_amount; // 월별로 총액을 더합니다
    });

    // 전년도 매출 집계
    lastYearData.forEach((doc: any) => {
      const month = new Date(doc.created_at).getMonth(); // 월 가져오기 (0: 1월, 11: 12월)
      lastYearMonthlySales[month] += doc.total_amount; // 전년도 월별로 총액을 더합니다
    });

    // 4️⃣ 데이터 집계: 월별 아이템 매출
    const currentYearItemSales = Array(12).fill(0); // 아이템별 월별 매출
    const lastYearItemSales = Array(12).fill(0);

    currentYearData.forEach((doc: any) => {
      const month = new Date(doc.created_at).getMonth();
      const items = doc["content"]?.items || [];
      items.forEach((item: any) => {
        const itemSales = item.amount * item.unit_price; // 아이템 금액
        currentYearItemSales[month] += itemSales;
      });
    });

    lastYearData.forEach((doc: any) => {
      const month = new Date(doc.created_at).getMonth();
      const items = doc["content"]?.items || [];
      items.forEach((item: any) => {
        const itemSales = item.amount * item.unit_price;
        lastYearItemSales[month] += itemSales;
      });
    });

    console.log("currentYearItemSales", currentYearItemSales);
    console.log("lastYearItemSales", lastYearItemSales);

    // 5️⃣ 결과 반환
    return NextResponse.json(
      {
        currentYear: currentYearMonthlySales,
        lastYear: lastYearMonthlySales,
        currentYearItemSales: currentYearItemSales,
        lastYearItemSales: lastYearItemSales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
