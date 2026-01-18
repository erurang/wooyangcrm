import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { ProductionRecordCreateRequest, ProductionRecordFilter } from "@/types/production";

// GET: 생산 기록 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: ProductionRecordFilter = {
      product_id: searchParams.get("product_id") || undefined,
      status: searchParams.get("status") as ProductionRecordFilter["status"] || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
    };

    let query = supabase
      .from("production_records")
      .select(`
        *,
        product:products(id, internal_code, internal_name, type),
        creator:users!production_records_created_by_fkey(id, name),
        consumptions:production_consumptions(
          id,
          material_id,
          quantity_consumed,
          unit_price_at_time,
          material:products(id, internal_code, internal_name, unit)
        )
      `)
      .order("production_date", { ascending: false });

    // 필터 적용
    if (filters.product_id) {
      query = query.eq("product_id", filters.product_id);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.date_from) {
      query = query.gte("production_date", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("production_date", filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 검색어 필터 (제품명, 배치번호)
    let filteredData = data || [];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        (record) =>
          record.product?.internal_name?.toLowerCase().includes(searchLower) ||
          record.batch_number?.toLowerCase().includes(searchLower) ||
          record.notes?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ records: filteredData });
  } catch (error) {
    console.error("생산 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "생산 기록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 생산 기록 생성
export async function POST(request: Request) {
  try {
    const body: ProductionRecordCreateRequest = await request.json();
    const {
      product_id,
      quantity_produced,
      production_date,
      batch_number,
      notes,
      created_by,
      consumptions,
    } = body;

    if (!product_id || !quantity_produced || !production_date) {
      return NextResponse.json(
        { error: "제품, 생산 수량, 생산일자는 필수입니다" },
        { status: 400 }
      );
    }

    // 1. 생산 기록 생성
    const { data: record, error: recordError } = await supabase
      .from("production_records")
      .insert([
        {
          product_id,
          quantity_produced,
          production_date,
          batch_number: batch_number || null,
          notes: notes || null,
          created_by: created_by || null,
        },
      ])
      .select()
      .single();

    if (recordError) throw recordError;

    // 2. 원자재 소비 기록 및 재고 차감
    if (consumptions && consumptions.length > 0) {
      for (const consumption of consumptions) {
        // 원자재 현재 재고 조회
        const { data: material, error: materialError } = await supabase
          .from("products")
          .select("current_stock, unit_price, internal_name")
          .eq("id", consumption.material_id)
          .single();

        if (materialError) throw materialError;

        const stockBefore = material.current_stock;
        const stockAfter = stockBefore - consumption.quantity_consumed;

        // 재고 부족 체크
        if (stockAfter < 0) {
          // 생산 기록 롤백 (삭제)
          await supabase.from("production_records").delete().eq("id", record.id);
          return NextResponse.json(
            { error: `원자재 '${material.internal_name}'의 재고가 부족합니다. 현재 재고: ${stockBefore}` },
            { status: 400 }
          );
        }

        // 소비 기록 생성
        const { error: consumptionError } = await supabase
          .from("production_consumptions")
          .insert([
            {
              production_record_id: record.id,
              material_id: consumption.material_id,
              quantity_consumed: consumption.quantity_consumed,
              unit_price_at_time: material.unit_price || null,
            },
          ]);

        if (consumptionError) throw consumptionError;

        // 원자재 재고 차감
        const { error: stockError } = await supabase
          .from("products")
          .update({
            current_stock: stockAfter,
            updated_at: new Date().toISOString(),
          })
          .eq("id", consumption.material_id);

        if (stockError) throw stockError;

        // 재고 트랜잭션 기록
        const { error: transactionError } = await supabase
          .from("product_transactions")
          .insert([
            {
              product_id: consumption.material_id,
              transaction_type: "production",
              quantity: -consumption.quantity_consumed,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_type: "production_record",
              reference_id: record.id,
              notes: `생산 기록 #${record.id.slice(0, 8)} - ${batch_number || '배치번호 없음'}`,
              transaction_date: production_date,
              created_by: created_by || null,
            },
          ]);

        if (transactionError) throw transactionError;
      }
    }

    // 3. 생산 기록 상세 조회하여 반환
    const { data: fullRecord, error: fetchError } = await supabase
      .from("production_records")
      .select(`
        *,
        product:products(id, internal_code, internal_name, type),
        creator:users!production_records_created_by_fkey(id, name),
        consumptions:production_consumptions(
          id,
          material_id,
          quantity_consumed,
          unit_price_at_time,
          material:products(id, internal_code, internal_name, unit)
        )
      `)
      .eq("id", record.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { message: "생산 기록이 등록되었습니다", record: fullRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error("생산 기록 생성 오류:", error);
    return NextResponse.json(
      { error: "생산 기록 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
