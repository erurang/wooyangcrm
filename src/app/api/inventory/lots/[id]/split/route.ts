import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { SplitLotRequest, SplitLotResponse } from "@/types/inventory";

/**
 * LOT 분할
 * POST /api/inventory/lots/[id]/split
 *
 * A(10m) → 분할 → B(3m, 사용분) + C(7m, 잔재)
 * - A는 status='split'으로 변경
 * - B, C는 새 LOT로 생성
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: SplitLotRequest & { user_id?: string } = await req.json();

    const { split_quantity, reason = "order", notes, user_id } = body;

    if (!split_quantity || split_quantity <= 0) {
      return NextResponse.json(
        { error: "분할 수량은 0보다 커야 합니다." },
        { status: 400 }
      );
    }

    // DB 함수로 분할 처리
    const { data, error } = await supabase.rpc("split_lot", {
      p_source_lot_id: id,
      p_split_quantity: split_quantity,
      p_reason: reason,
      p_notes: notes || null,
      p_user_id: user_id || null,
    });

    if (error) {
      console.error("Error splitting lot:", error);
      // 에러 메시지에서 사용자 친화적인 메시지 추출
      if (error.message.includes("LOT를 찾을 수 없거나")) {
        return NextResponse.json(
          { error: "LOT를 찾을 수 없거나 사용 불가 상태입니다." },
          { status: 400 }
        );
      }
      if (error.message.includes("분할 수량이 현재 수량보다")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "LOT 분할에 실패했습니다." },
        { status: 500 }
      );
    }

    // 결과는 배열로 반환됨 (RETURNS TABLE)
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.output_lot_id || !result.remnant_lot_id) {
      return NextResponse.json(
        { error: "LOT 분할 결과가 올바르지 않습니다." },
        { status: 500 }
      );
    }

    // 생성된 LOT들 조회
    const { data: outputLot } = await supabase
      .from("inventory_lots")
      .select(
        `
        *,
        product:products!inventory_lots_product_id_fkey (
          id, internal_code, internal_name, unit
        )
      `
      )
      .eq("id", result.output_lot_id)
      .single();

    const { data: remnantLot } = await supabase
      .from("inventory_lots")
      .select(
        `
        *,
        product:products!inventory_lots_product_id_fkey (
          id, internal_code, internal_name, unit
        )
      `
      )
      .eq("id", result.remnant_lot_id)
      .single();

    const response: SplitLotResponse = {
      success: true,
      output_lot_id: result.output_lot_id,
      remnant_lot_id: result.remnant_lot_id,
      split_id: result.split_id,
      output_lot: outputLot || undefined,
      remnant_lot: remnantLot || undefined,
    };

    return NextResponse.json({
      ...response,
      message: `LOT가 분할되었습니다. 사용분: ${outputLot?.lot_number}, 잔재: ${remnantLot?.lot_number}`,
    });
  } catch (error) {
    console.error("Error in POST /api/inventory/lots/[id]/split:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * LOT 분할 이력 조회
 * GET /api/inventory/lots/[id]/split
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 이 LOT에서 분할된 기록 (원본으로서)
    const { data: splitFrom, error: splitFromError } = await supabase
      .from("lot_splits")
      .select(
        `
        *,
        output_lot:inventory_lots!lot_splits_output_lot_id_fkey (
          id, lot_number, current_quantity, status
        ),
        remnant_lot:inventory_lots!lot_splits_remnant_lot_id_fkey (
          id, lot_number, current_quantity, status
        ),
        splitter:users!lot_splits_split_by_fkey (
          id, name
        )
      `
      )
      .eq("source_lot_id", id)
      .order("split_at", { ascending: false });

    if (splitFromError) {
      console.error("Error fetching split history:", splitFromError);
    }

    // 이 LOT가 분할로 생성된 경우 (output 또는 remnant로서)
    const { data: splitTo, error: splitToError } = await supabase
      .from("lot_splits")
      .select(
        `
        *,
        source_lot:inventory_lots!lot_splits_source_lot_id_fkey (
          id, lot_number
        ),
        splitter:users!lot_splits_split_by_fkey (
          id, name
        )
      `
      )
      .or(`output_lot_id.eq.${id},remnant_lot_id.eq.${id}`)
      .order("split_at", { ascending: false });

    if (splitToError) {
      console.error("Error fetching split origin:", splitToError);
    }

    return NextResponse.json({
      split_from: splitFrom || [], // 이 LOT에서 분할됨
      split_to: splitTo || [], // 이 LOT의 분할 원본
    });
  } catch (error) {
    console.error("Error in GET /api/inventory/lots/[id]/split:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
