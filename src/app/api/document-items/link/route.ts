import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 품목-제품 연결 API
 * POST /api/document-items/link
 *
 * 단일 연결:
 * { item_id: "uuid", product_id: "uuid" }
 *
 * 일괄 연결 (같은 이름의 모든 품목):
 * { name: "품목명", spec: "규격", product_id: "uuid" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, name, spec, product_id, user_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: "product_id는 필수입니다" },
        { status: 400 }
      );
    }

    // 제품 정보 조회 (internal_name, spec)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, internal_code, internal_name, spec")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    let updatedCount = 0;

    if (item_id) {
      // 단일 품목 연결
      const { error } = await supabase
        .from("document_items")
        .update({
          product_id,
          internal_name: product.internal_name,
          internal_spec: product.spec,
        })
        .eq("id", item_id);

      if (error) {
        throw new Error(`품목 연결 실패: ${error.message}`);
      }
      updatedCount = 1;
    } else if (name) {
      // 같은 이름의 모든 품목 일괄 연결
      let query = supabase
        .from("document_items")
        .update({
          product_id,
          internal_name: product.internal_name,
          internal_spec: product.spec,
        })
        .eq("name", name)
        .is("product_id", null); // 미연결 품목만

      if (spec !== undefined) {
        if (spec === null || spec === "") {
          query = query.is("spec", null);
        } else {
          query = query.eq("spec", spec);
        }
      }

      const { data, error } = await query.select("id");

      if (error) {
        throw new Error(`일괄 연결 실패: ${error.message}`);
      }
      updatedCount = data?.length || 0;
    } else {
      return NextResponse.json(
        { error: "item_id 또는 name이 필요합니다" },
        { status: 400 }
      );
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "document_items",
      operation: "LINK_PRODUCT",
      record_id: item_id || null,
      old_data: { name, spec },
      new_data: { product_id, product_name: product.internal_name, updated_count: updatedCount },
      changed_by: user_id || null,
    });

    return NextResponse.json({
      success: true,
      message: `${updatedCount}개 품목이 연결되었습니다`,
      updated_count: updatedCount,
      product: {
        id: product.id,
        internal_code: product.internal_code,
        internal_name: product.internal_name,
      },
    });
  } catch (error) {
    console.error("품목 연결 에러:", error);
    return NextResponse.json(
      { error: "품목 연결 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * 품목-제품 연결 해제 API
 * DELETE /api/document-items/link?item_id=uuid
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("item_id");
    const user_id = searchParams.get("user_id");

    if (!item_id) {
      return NextResponse.json(
        { error: "item_id는 필수입니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("document_items")
      .update({
        product_id: null,
        internal_name: null,
        internal_spec: null,
      })
      .eq("id", item_id);

    if (error) {
      throw new Error(`연결 해제 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "document_items",
      operation: "UNLINK_PRODUCT",
      record_id: item_id,
      old_data: null,
      new_data: { product_id: null },
      changed_by: user_id || null,
    });

    return NextResponse.json({
      success: true,
      message: "연결이 해제되었습니다",
    });
  } catch (error) {
    console.error("연결 해제 에러:", error);
    return NextResponse.json(
      { error: "연결 해제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
