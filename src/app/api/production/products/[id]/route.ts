import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { UpdateProductRequest } from "@/types/production";

// GET: 제품 상세 조회 (BOM 포함)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 제품 기본 정보 조회
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (productError) throw productError;

    if (!product) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // BOM 조회 (완제품인 경우)
    let materials = [];
    if (product.type === "finished") {
      const { data: bomData } = await supabase
        .from("product_materials")
        .select(`
          *,
          material:products!product_materials_material_id_fkey(
            id, internal_code, internal_name, type, unit, current_stock, unit_price
          )
        `)
        .eq("product_id", id);

      materials = bomData || [];
    }

    // 회사별 별칭 조회
    const { data: aliases } = await supabase
      .from("company_product_aliases")
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq("product_id", id);

    return NextResponse.json({
      product: {
        ...product,
        materials,
        aliases: aliases || [],
      },
    });
  } catch (error) {
    console.error("제품 조회 오류:", error);
    return NextResponse.json(
      { error: "제품 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 제품 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateProductRequest = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.internal_code !== undefined) updateData.internal_code = body.internal_code;
    if (body.internal_name !== undefined) updateData.internal_name = body.internal_name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.spec !== undefined) updateData.spec = body.spec;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.min_stock_alert !== undefined) updateData.min_stock_alert = body.min_stock_alert;
    if (body.unit_price !== undefined) updateData.unit_price = body.unit_price;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "제품이 수정되었습니다",
      product: data,
    });
  } catch (error) {
    console.error("제품 수정 오류:", error);
    return NextResponse.json(
      { error: "제품 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 제품 삭제 (비활성화)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 실제 삭제 대신 비활성화
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "제품이 비활성화되었습니다" });
  } catch (error) {
    console.error("제품 삭제 오류:", error);
    return NextResponse.json(
      { error: "제품 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
