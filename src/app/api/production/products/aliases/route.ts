import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CompanyProductAliasCreateRequest } from "@/types/production";

// GET: 회사별 제품 별칭 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get("company_id");
    const product_id = searchParams.get("product_id");

    let query = supabase
      .from("company_product_aliases")
      .select(`
        *,
        company:companies(id, name),
        product:products(id, internal_code, internal_name, type, unit)
      `)
      .order("created_at", { ascending: false });

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    if (product_id) {
      query = query.eq("product_id", product_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ aliases: data || [] });
  } catch (error) {
    console.error("별칭 조회 오류:", error);
    return NextResponse.json(
      { error: "별칭 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 회사별 제품 별칭 등록/수정
export async function POST(request: Request) {
  try {
    const body: CompanyProductAliasCreateRequest = await request.json();
    const {
      company_id,
      product_id,
      external_code,
      external_name,
      external_spec,
      external_unit_price,
      notes,
    } = body;

    if (!company_id || !product_id) {
      return NextResponse.json(
        { error: "회사 ID와 제품 ID는 필수입니다" },
        { status: 400 }
      );
    }

    // 기존 별칭 존재 여부 확인
    const { data: existing } = await supabase
      .from("company_product_aliases")
      .select("id")
      .eq("company_id", company_id)
      .eq("product_id", product_id)
      .single();

    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from("company_product_aliases")
        .update({
          external_code: external_code || null,
          external_name: external_name || null,
          external_spec: external_spec || null,
          external_unit_price: external_unit_price || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select(`
          *,
          company:companies(id, name),
          product:products(id, internal_code, internal_name, type, unit)
        `)
        .single();

      if (error) throw error;

      return NextResponse.json({
        message: "별칭이 수정되었습니다",
        alias: data,
      });
    } else {
      // 신규 등록
      const { data, error } = await supabase
        .from("company_product_aliases")
        .insert([
          {
            company_id,
            product_id,
            external_code: external_code || null,
            external_name: external_name || null,
            external_spec: external_spec || null,
            external_unit_price: external_unit_price || null,
            notes: notes || null,
          },
        ])
        .select(`
          *,
          company:companies(id, name),
          product:products(id, internal_code, internal_name, type, unit)
        `)
        .single();

      if (error) throw error;

      return NextResponse.json(
        { message: "별칭이 등록되었습니다", alias: data },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("별칭 등록/수정 오류:", error);
    return NextResponse.json(
      { error: "별칭 등록/수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 회사별 제품 별칭 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alias_id = searchParams.get("alias_id");
    const company_id = searchParams.get("company_id");
    const product_id = searchParams.get("product_id");

    if (alias_id) {
      // ID로 삭제
      const { error } = await supabase
        .from("company_product_aliases")
        .delete()
        .eq("id", alias_id);

      if (error) throw error;
    } else if (company_id && product_id) {
      // 회사+제품 조합으로 삭제
      const { error } = await supabase
        .from("company_product_aliases")
        .delete()
        .eq("company_id", company_id)
        .eq("product_id", product_id);

      if (error) throw error;
    } else {
      return NextResponse.json(
        { error: "삭제할 별칭 ID 또는 회사/제품 ID 조합이 필요합니다" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "별칭이 삭제되었습니다" });
  } catch (error) {
    console.error("별칭 삭제 오류:", error);
    return NextResponse.json(
      { error: "별칭 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
