import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const searchCompany =
    searchParams.get("company_name")?.trim().toLowerCase() || "";
  const searchProduct =
    searchParams.get("product_name")?.trim().toLowerCase() || "";
  const searchSpec =
    searchParams.get("specification")?.trim().toLowerCase() || "";
  const searchType = searchParams.get("type")?.trim().toLowerCase() || "";

  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const status = searchParams.get("status") || ""; // 상태 필터 추가

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("documents")
      .select("id, content, created_at, status, users(name,level)")
      .eq("type", searchType)
      .ilike("content->>company_name", `%${searchCompany}%`)
      .order("created_at", { ascending: false });

    // 상태 필터 추가
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환 및 필터링
    const allProducts = data.flatMap((doc: any) =>
      doc.content.items
        .filter((item: any) => {
          // 물품명 필터
          if (
            searchProduct &&
            !item.name.toLowerCase().includes(searchProduct)
          ) {
            return false;
          }
          // 규격 필터
          if (searchSpec && !item.spec.toLowerCase().includes(searchSpec)) {
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
          quantity: item.quantity,
          status: doc.status,
          user_name: doc.users?.name || "",
          user_level: doc.users?.level || "",
        }))
    );

    // 페이지네이션 적용
    const paginatedProducts = allProducts.slice(from, to + 1);

    return NextResponse.json(
      {
        products: paginatedProducts,
        total: allProducts.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
