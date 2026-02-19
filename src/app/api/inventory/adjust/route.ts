import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/inventory/adjust
 *
 * 수동 재고 조정 API
 * body: {
 *   product_id: string,
 *   adjustment_type: "increase" | "decrease",
 *   quantity: number,
 *   reason: string (필수),
 *   notes?: string,
 *   user_id?: string,
 * }
 *
 * increase: LOT 생성 (source_type: "adjust") + stock 증가
 * decrease: FIFO LOT 차감 + stock 감소
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, adjustment_type, quantity, reason, notes, user_id } = body;

    // 유효성 검사
    if (!product_id) {
      return NextResponse.json(
        { error: "product_id는 필수입니다." },
        { status: 400 }
      );
    }

    if (!adjustment_type || !["increase", "decrease"].includes(adjustment_type)) {
      return NextResponse.json(
        { error: "adjustment_type은 'increase' 또는 'decrease'여야 합니다." },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "수량은 0보다 커야 합니다." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "조정 사유는 필수입니다." },
        { status: 400 }
      );
    }

    // 제품 조회
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, internal_name, current_stock, unit")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const stockBefore = product.current_stock || 0;
    let stockAfter: number;
    const adjustmentNote = `수동 조정 (${adjustment_type === "increase" ? "증가" : "감소"}): ${reason}`;

    if (adjustment_type === "increase") {
      // === 재고 증가: LOT 생성 ===
      stockAfter = stockBefore + quantity;

      // LOT 번호 생성
      const { data: lotNumber, error: lotNumError } = await supabase.rpc(
        "generate_lot_number"
      );

      if (lotNumError) {
        return NextResponse.json(
          { error: "LOT 번호 생성 실패" },
          { status: 500 }
        );
      }

      // LOT 생성
      const { data: lot, error: lotError } = await supabase
        .from("inventory_lots")
        .insert({
          product_id,
          lot_number: lotNumber,
          initial_quantity: quantity,
          current_quantity: quantity,
          unit: product.unit,
          source_type: "adjust",
          status: "available",
          received_at: new Date().toISOString(),
          notes: adjustmentNote + (notes ? ` | ${notes}` : ""),
          created_by: user_id || null,
        })
        .select("id, lot_number")
        .single();

      if (lotError) {
        return NextResponse.json(
          { error: `LOT 생성 실패: ${lotError.message}` },
          { status: 500 }
        );
      }

      // lot_transaction 기록
      await supabase.from("lot_transactions").insert({
        lot_id: lot.id,
        transaction_type: "adjust",
        quantity,
        quantity_before: 0,
        quantity_after: quantity,
        notes: adjustmentNote,
        created_by: user_id || null,
      });

      // product stock 업데이트
      await supabase
        .from("products")
        .update({ current_stock: stockAfter, updated_at: new Date().toISOString() })
        .eq("id", product_id);

      // product_transactions 기록
      await supabase.from("product_transactions").insert({
        product_id,
        transaction_type: "adjustment",
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: "adjustment",
        reference_id: lot.id,
        notes: adjustmentNote,
        transaction_date: new Date().toISOString(),
        created_by: user_id || null,
      });

      // 로그 기록
      await supabase.from("logs").insert({
        table_name: "products",
        operation: "STOCK_ADJUST_INCREASE",
        record_id: product_id,
        old_data: { current_stock: stockBefore },
        new_data: { current_stock: stockAfter, lot_id: lot.id, quantity, reason },
        changed_by: user_id || null,
      });

      return NextResponse.json({
        success: true,
        message: `${product.internal_name} 재고가 ${quantity}${product.unit || "개"} 증가했습니다.`,
        adjustment: {
          type: "increase",
          product_id,
          product_name: product.internal_name,
          quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          lot_id: lot.id,
          lot_number: lot.lot_number,
        },
      });
    } else {
      // === 재고 감소: FIFO LOT 차감 ===
      if (stockBefore < quantity) {
        return NextResponse.json(
          {
            error: `재고가 부족합니다. (현재: ${stockBefore}${product.unit || "개"}, 요청: ${quantity}${product.unit || "개"})`,
          },
          { status: 400 }
        );
      }

      stockAfter = stockBefore - quantity;

      // FIFO: 오래된 LOT부터 차감
      const { data: lots } = await supabase
        .from("inventory_lots")
        .select("id, current_quantity, lot_number")
        .eq("product_id", product_id)
        .eq("status", "available")
        .gt("current_quantity", 0)
        .order("received_at", { ascending: true })
        .order("created_at", { ascending: true });

      let remaining = quantity;
      const deductedLots: { lotId: string; lotNumber: string; deducted: number }[] = [];

      for (const lot of lots || []) {
        if (remaining <= 0) break;

        const deductQty = Math.min(remaining, lot.current_quantity);
        const qtyBefore = lot.current_quantity;
        const qtyAfter = qtyBefore - deductQty;

        await supabase
          .from("inventory_lots")
          .update({
            current_quantity: qtyAfter,
            status: qtyAfter <= 0 ? "depleted" : "available",
            updated_at: new Date().toISOString(),
          })
          .eq("id", lot.id);

        await supabase.from("lot_transactions").insert({
          lot_id: lot.id,
          transaction_type: "adjust",
          quantity: deductQty,
          quantity_before: qtyBefore,
          quantity_after: qtyAfter,
          notes: adjustmentNote,
          created_by: user_id || null,
        });

        deductedLots.push({
          lotId: lot.id,
          lotNumber: lot.lot_number,
          deducted: deductQty,
        });

        remaining -= deductQty;
      }

      // product stock 업데이트
      await supabase
        .from("products")
        .update({ current_stock: stockAfter, updated_at: new Date().toISOString() })
        .eq("id", product_id);

      // product_transactions 기록
      await supabase.from("product_transactions").insert({
        product_id,
        transaction_type: "adjustment",
        quantity: -quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: "adjustment",
        reference_id: null,
        notes: adjustmentNote,
        transaction_date: new Date().toISOString(),
        created_by: user_id || null,
      });

      // 로그 기록
      await supabase.from("logs").insert({
        table_name: "products",
        operation: "STOCK_ADJUST_DECREASE",
        record_id: product_id,
        old_data: { current_stock: stockBefore },
        new_data: { current_stock: stockAfter, quantity, reason, deducted_lots: deductedLots },
        changed_by: user_id || null,
      });

      return NextResponse.json({
        success: true,
        message: `${product.internal_name} 재고가 ${quantity}${product.unit || "개"} 감소했습니다.`,
        adjustment: {
          type: "decrease",
          product_id,
          product_name: product.internal_name,
          quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          deducted_lots: deductedLots,
        },
      });
    }
  } catch (error) {
    console.error("재고 조정 에러:", error);
    return NextResponse.json(
      { error: "재고 조정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
