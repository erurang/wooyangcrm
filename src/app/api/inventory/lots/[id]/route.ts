import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { UpdateLotRequest } from "@/types/inventory";

/**
 * LOT 상세 조회
 * GET /api/inventory/lots/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
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
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching lot:", error);
      return NextResponse.json(
        { error: "LOT를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ lot: data });
  } catch (error) {
    console.error("Error in GET /api/inventory/lots/[id]:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * LOT 수정
 * PATCH /api/inventory/lots/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateLotRequest & { user_id?: string } = await req.json();

    const { location, unit_cost, expiry_date, notes, status, user_id } = body;

    // 현재 LOT 조회
    const { data: currentLot, error: fetchError } = await supabase
      .from("inventory_lots")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentLot) {
      return NextResponse.json(
        { error: "LOT를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 분할/소진/폐기 상태인 경우 수정 제한
    if (["split", "depleted", "scrapped"].includes(currentLot.status)) {
      if (status && status !== currentLot.status) {
        return NextResponse.json(
          { error: "분할/소진/폐기된 LOT의 상태는 변경할 수 없습니다." },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (location !== undefined) updateData.location = location;
    if (unit_cost !== undefined) {
      updateData.unit_cost = unit_cost;
      updateData.total_cost = unit_cost * currentLot.current_quantity;
    }
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("inventory_lots")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating lot:", error);
      return NextResponse.json({ error: "LOT 수정 실패" }, { status: 500 });
    }

    // 상태 변경 시 트랜잭션 기록
    if (status && status !== currentLot.status) {
      let transactionType = "adjust";
      if (status === "scrapped") transactionType = "scrap";
      else if (status === "reserved") transactionType = "reserve";
      else if (
        currentLot.status === "reserved" &&
        status === "available"
      )
        transactionType = "unreserve";

      await supabase.from("lot_transactions").insert({
        lot_id: id,
        transaction_type: transactionType,
        quantity: 0,
        quantity_before: currentLot.current_quantity,
        quantity_after: currentLot.current_quantity,
        notes: `상태 변경: ${currentLot.status} → ${status}`,
        created_by: user_id || null,
      });
    }

    return NextResponse.json({
      success: true,
      lot: data,
      message: "LOT가 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error in PATCH /api/inventory/lots/[id]:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * LOT 삭제 (soft delete - 상태를 scrapped로 변경)
 * DELETE /api/inventory/lots/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    // 현재 LOT 조회
    const { data: currentLot, error: fetchError } = await supabase
      .from("inventory_lots")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentLot) {
      return NextResponse.json(
        { error: "LOT를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 분할된 LOT는 삭제 불가
    if (currentLot.status === "split") {
      return NextResponse.json(
        { error: "분할된 LOT는 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // soft delete: 상태를 scrapped로 변경
    const { data, error } = await supabase
      .from("inventory_lots")
      .update({
        status: "scrapped",
        updated_at: new Date().toISOString(),
        notes: `${currentLot.notes || ""}\n[폐기됨] ${new Date().toISOString()}`,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting lot:", error);
      return NextResponse.json({ error: "LOT 삭제 실패" }, { status: 500 });
    }

    // 폐기 트랜잭션 기록
    await supabase.from("lot_transactions").insert({
      lot_id: id,
      transaction_type: "scrap",
      quantity: -currentLot.current_quantity,
      quantity_before: currentLot.current_quantity,
      quantity_after: 0,
      notes: "LOT 폐기",
      created_by: user_id || null,
    });

    return NextResponse.json({
      success: true,
      message: `LOT ${currentLot.lot_number}이(가) 폐기되었습니다.`,
    });
  } catch (error) {
    console.error("Error in DELETE /api/inventory/lots/[id]:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
