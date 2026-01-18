import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { StockAdjustmentRequest } from "@/types/production";

// POST: 재고 조정
export async function POST(request: Request) {
  try {
    const body: StockAdjustmentRequest & { created_by?: string } = await request.json();
    const { product_id, quantity, notes, created_by } = body;

    if (!product_id || quantity === undefined) {
      return NextResponse.json(
        { error: "제품 ID와 수량은 필수입니다" },
        { status: 400 }
      );
    }

    // 현재 재고 조회
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("current_stock, internal_name")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const stockBefore = product.current_stock;
    const stockAfter = stockBefore + quantity;

    // 음수 재고 방지
    if (stockAfter < 0) {
      return NextResponse.json(
        { error: `재고가 부족합니다. 현재 재고: ${stockBefore}` },
        { status: 400 }
      );
    }

    // 트랜잭션 기록
    const { error: transactionError } = await supabase
      .from("product_transactions")
      .insert([
        {
          product_id,
          transaction_type: "adjustment",
          quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: "manual",
          notes: notes || null,
          transaction_date: new Date().toISOString().split("T")[0],
          created_by: created_by || null,
        },
      ]);

    if (transactionError) throw transactionError;

    // 재고 업데이트
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        current_stock: stockAfter,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: `재고가 ${quantity > 0 ? "증가" : "감소"}되었습니다 (${stockBefore} → ${stockAfter})`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("재고 조정 오류:", error);
    return NextResponse.json(
      { error: "재고 조정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
