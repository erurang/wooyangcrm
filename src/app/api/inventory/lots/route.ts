import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type {
  InventoryLotWithDetails,
  CreateLotRequest,
  LotFilters,
} from "@/types/inventory";

/**
 * LOT 목록 조회
 * GET /api/inventory/lots?product_id=xxx&status=available&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get("product_id");
    const status = searchParams.get("status") || "all";
    const source_type = searchParams.get("source_type");
    const supplier_company_id = searchParams.get("supplier_company_id");
    const location = searchParams.get("location");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("inventory_lots")
      .select(
        `
        *,
        product:products!inventory_lots_product_id_fkey (
          id, internal_code, internal_name, unit
        ),
        source_lot:inventory_lots!inventory_lots_source_lot_id_fkey (
          id, lot_number
        ),
        source_document:documents!inventory_lots_source_document_id_fkey (
          id, document_number, type
        ),
        supplier_company:companies!inventory_lots_supplier_company_id_fkey (
          id, name
        ),
        creator:users!inventory_lots_created_by_fkey (
          id, name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // 필터 적용
    if (product_id) {
      query = query.eq("product_id", product_id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (source_type) {
      query = query.eq("source_type", source_type);
    }

    if (supplier_company_id) {
      query = query.eq("supplier_company_id", supplier_company_id);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (search) {
      query = query.or(
        `lot_number.ilike.%${search}%,spec_value.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching lots:", error);
      return NextResponse.json(
        { error: "LOT 목록 조회 실패", lots: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      lots: data as InventoryLotWithDetails[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error in GET /api/inventory/lots:", error);
    return NextResponse.json({ error: "서버 오류", lots: [] }, { status: 500 });
  }
}

/**
 * LOT 생성
 * POST /api/inventory/lots
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateLotRequest & { user_id?: string } = await req.json();

    const {
      product_id,
      initial_quantity,
      unit,
      spec_value,
      spec_description,
      source_type = "purchase",
      source_document_id,
      supplier_company_id,
      location,
      unit_cost,
      received_at,
      expiry_date,
      notes,
      user_id,
    } = body;

    if (!product_id || initial_quantity === undefined) {
      return NextResponse.json(
        { error: "제품과 수량은 필수입니다." },
        { status: 400 }
      );
    }

    // LOT 번호 생성 (DB 함수 사용)
    const { data: lotNumberData, error: lotNumberError } = await supabase.rpc(
      "generate_lot_number"
    );

    if (lotNumberError) {
      console.error("Error generating lot number:", lotNumberError);
      return NextResponse.json(
        { error: "LOT 번호 생성 실패" },
        { status: 500 }
      );
    }

    const lot_number = lotNumberData;

    // LOT 생성
    const newLot = {
      product_id,
      lot_number,
      initial_quantity,
      current_quantity: initial_quantity,
      unit: unit || null,
      spec_value: spec_value || null,
      spec_description: spec_description || null,
      source_type,
      source_document_id: source_document_id || null,
      supplier_company_id: supplier_company_id || null,
      status: "available",
      location: location || null,
      unit_cost: unit_cost || null,
      total_cost: unit_cost ? unit_cost * initial_quantity : null,
      received_at: received_at || new Date().toISOString(),
      expiry_date: expiry_date || null,
      notes: notes || null,
      created_by: user_id || null,
    };

    const { data, error } = await supabase
      .from("inventory_lots")
      .insert(newLot)
      .select(
        `
        *,
        product:products!inventory_lots_product_id_fkey (
          id, internal_code, internal_name, unit
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating lot:", error);
      return NextResponse.json({ error: "LOT 생성 실패" }, { status: 500 });
    }

    // 입고 트랜잭션 기록
    await supabase.from("lot_transactions").insert({
      lot_id: data.id,
      transaction_type: "inbound",
      quantity: initial_quantity,
      quantity_before: 0,
      quantity_after: initial_quantity,
      document_id: source_document_id || null,
      notes: "LOT 생성 (입고)",
      created_by: user_id || null,
    });

    return NextResponse.json({
      success: true,
      lot: data,
      message: `LOT ${lot_number}이(가) 생성되었습니다.`,
    });
  } catch (error) {
    console.error("Error in POST /api/inventory/lots:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
