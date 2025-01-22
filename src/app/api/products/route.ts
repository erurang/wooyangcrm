import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET 요청: /api/products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const searchCompany =
    searchParams.get("company_name")?.toLowerCase().trim() || "";
  const searchProduct =
    searchParams.get("product_name")?.toLowerCase().trim() || "";
  const searchSpec =
    searchParams.get("specification")?.toLowerCase().trim() || "";
  const searchType = searchParams.get("type")?.toLowerCase().trim() || "";

  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const status = searchParams.get("status") || ""; // status 필터 추가

  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  try {
    // Query 생성
    let query = supabase
      .from("documents")
      .select("content, created_at, status")
      .eq("type", searchType)
      .ilike("content->>company_name", `%${searchCompany}%`);

    // status 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    console.log(data);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환 및 필터링
    const filteredProducts = data.flatMap((doc: any) =>
      doc.content.items
        .filter((item: any) => {
          // 물품명 필터
          if (
            searchProduct &&
            !item.name.toLowerCase().trim().includes(searchProduct)
          ) {
            return false;
          }

          // 규격 필터
          if (
            searchSpec &&
            !item.spec.toLowerCase().trim().includes(searchSpec)
          ) {
            return false;
          }

          // 단가 필터
          if (minPrice && parseFloat(item.unit_price) < parseFloat(minPrice)) {
            return false;
          }
          if (maxPrice && parseFloat(item.unit_price) > parseFloat(maxPrice)) {
            return false;
          }

          return true;
        })
        .map((item: any) => ({
          id: doc.id,
          estimate_date: doc.created_at,
          company_name: doc.content.company_name,
          name: item.name,
          spec: item.spec,
          unit_price: parseFloat(item.unit_price),
          quantity: item.quantity, // quantity를 문자열로 유지
          status: doc.status,
        }))
    );

    // 전체 데이터 반환
    return NextResponse.json(
      {
        products: filteredProducts,
        total: filteredProducts.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
