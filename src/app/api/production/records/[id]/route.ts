import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 생산 기록 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("production_records")
      .select(`
        *,
        product:products(id, internal_code, internal_name, type, unit),
        creator:users!production_records_created_by_fkey(id, name),
        canceler:users!production_records_canceled_by_fkey(id, name),
        consumptions:production_consumptions(
          id,
          material_id,
          quantity_consumed,
          unit_price_at_time,
          material:products(id, internal_code, internal_name, unit, unit_price)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "생산 기록을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ record: data });
  } catch (error) {
    console.error("생산 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "생산 기록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 생산 기록 취소 (재고 복구)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const canceled_by = searchParams.get("canceled_by");
    const cancel_reason = searchParams.get("cancel_reason");

    // 1. 기존 기록 조회
    const { data: record, error: fetchError } = await supabase
      .from("production_records")
      .select(`
        *,
        consumptions:production_consumptions(
          id,
          material_id,
          quantity_consumed
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "생산 기록을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    if (record.status === "canceled") {
      return NextResponse.json(
        { error: "이미 취소된 생산 기록입니다" },
        { status: 400 }
      );
    }

    // 2. 원자재 재고 복구
    if (record.consumptions && record.consumptions.length > 0) {
      for (const consumption of record.consumptions) {
        // 현재 재고 조회
        const { data: material, error: materialError } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", consumption.material_id)
          .single();

        if (materialError) throw materialError;

        const stockBefore = material.current_stock;
        const stockAfter = stockBefore + consumption.quantity_consumed;

        // 재고 복구
        const { error: stockError } = await supabase
          .from("products")
          .update({
            current_stock: stockAfter,
            updated_at: new Date().toISOString(),
          })
          .eq("id", consumption.material_id);

        if (stockError) throw stockError;

        // 재고 트랜잭션 기록 (복구)
        const { error: transactionError } = await supabase
          .from("product_transactions")
          .insert([
            {
              product_id: consumption.material_id,
              transaction_type: "adjustment",
              quantity: consumption.quantity_consumed,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_type: "production_record",
              reference_id: id,
              notes: `생산 취소로 인한 재고 복구 - 기록 #${id.slice(0, 8)}`,
              transaction_date: new Date().toISOString().split("T")[0],
              created_by: canceled_by || null,
            },
          ]);

        if (transactionError) throw transactionError;
      }
    }

    // 3. 생산 기록 취소 처리
    const { data: updatedRecord, error: updateError } = await supabase
      .from("production_records")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        canceled_by: canceled_by || null,
        cancel_reason: cancel_reason || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: "생산 기록이 취소되었습니다. 원자재 재고가 복구되었습니다.",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("생산 기록 취소 오류:", error);
    return NextResponse.json(
      { error: "생산 기록 취소 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
