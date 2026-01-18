import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: BOM 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("product_materials")
      .select(`
        *,
        material:products!product_materials_material_id_fkey(
          id, internal_code, internal_name, type, unit, current_stock, unit_price
        )
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ materials: data || [] });
  } catch (error) {
    console.error("BOM 조회 오류:", error);
    return NextResponse.json(
      { error: "BOM 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: BOM 항목 추가
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { material_id, quantity_required, notes } = body;

    if (!material_id || !quantity_required) {
      return NextResponse.json(
        { error: "원자재와 소요량은 필수입니다" },
        { status: 400 }
      );
    }

    // 자기 자신을 BOM에 추가하는 것 방지
    if (material_id === id) {
      return NextResponse.json(
        { error: "자기 자신을 원자재로 추가할 수 없습니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("product_materials")
      .upsert(
        {
          product_id: id,
          material_id,
          quantity_required,
          notes: notes || null,
        },
        { onConflict: "product_id,material_id" }
      )
      .select(`
        *,
        material:products!product_materials_material_id_fkey(
          id, internal_code, internal_name, type, unit, current_stock, unit_price
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "BOM 항목이 추가되었습니다",
      material: data,
    });
  } catch (error) {
    console.error("BOM 추가 오류:", error);
    return NextResponse.json(
      { error: "BOM 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: BOM 항목 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const material_id = searchParams.get("material_id");

    if (!material_id) {
      return NextResponse.json(
        { error: "삭제할 원자재 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("product_materials")
      .delete()
      .eq("product_id", id)
      .eq("material_id", material_id);

    if (error) throw error;

    return NextResponse.json({ message: "BOM 항목이 삭제되었습니다" });
  } catch (error) {
    console.error("BOM 삭제 오류:", error);
    return NextResponse.json(
      { error: "BOM 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
