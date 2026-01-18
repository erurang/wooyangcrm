import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CreateProductRequest, ProductType } from "@/types/production";

// GET: 제품 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ProductType | null;
    const category = searchParams.get("category");
    const is_active = searchParams.get("is_active");
    const search = searchParams.get("search");
    const low_stock = searchParams.get("low_stock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("internal_name", { ascending: true });

    // 타입 필터
    if (type) {
      query = query.eq("type", type);
    }

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 활성 상태 필터
    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    // 검색어 필터
    if (search) {
      query = query.or(`internal_code.ilike.%${search}%,internal_name.ilike.%${search}%`);
    }

    // 저재고 필터 - min_stock_alert가 설정된 제품 중 재고 부족인 것만 조회
    // Supabase에서 두 컬럼 비교가 안되므로 서버에서 필터링
    let filterLowStock = false;
    if (low_stock) {
      query = query.not("min_stock_alert", "is", null);
      filterLowStock = true;
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // 저재고 필터링 (서버사이드)
    let filteredProducts = data || [];
    if (filterLowStock) {
      filteredProducts = filteredProducts.filter(
        (p) => p.min_stock_alert !== null && p.current_stock < p.min_stock_alert
      );
    }

    return NextResponse.json({
      products: filteredProducts,
      total: filterLowStock ? filteredProducts.length : (count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error("제품 조회 오류:", error);
    return NextResponse.json(
      { error: "제품 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 제품 생성
export async function POST(request: Request) {
  try {
    const body: CreateProductRequest & { created_by?: string } = await request.json();
    const {
      internal_code,
      internal_name,
      type,
      category,
      spec,
      unit,
      description,
      current_stock,
      min_stock_alert,
      unit_price,
      created_by,
    } = body;

    if (!internal_code || !internal_name || !type) {
      return NextResponse.json(
        { error: "제품 코드, 제품명, 타입은 필수입니다" },
        { status: 400 }
      );
    }

    // 코드 중복 확인
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("internal_code", internal_code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 제품 코드입니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          internal_code,
          internal_name,
          type,
          category: category || null,
          spec: spec || null,
          unit: unit || "개",
          description: description || null,
          current_stock: current_stock || 0,
          min_stock_alert: min_stock_alert || null,
          unit_price: unit_price || null,
          created_by: created_by || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "제품이 등록되었습니다",
      product: data,
    });
  } catch (error) {
    console.error("제품 등록 오류:", error);
    return NextResponse.json(
      { error: "제품 등록 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
