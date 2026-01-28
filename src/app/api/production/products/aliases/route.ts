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
        product:products(id, internal_code, internal_name, type, unit, spec, current_stock)
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
    const body = await request.json() as CompanyProductAliasCreateRequest & { notes?: string };
    const {
      company_id,
      product_id,
      alias_type,
      external_code,
      external_name,
      external_spec,
      external_unit_price,
      notes,
    } = body;

    console.log("[AliasAPI] POST request:", body);

    // 필수 필드 검증
    if (!company_id || !product_id) {
      return NextResponse.json(
        { error: "회사 ID와 제품 ID는 필수입니다" },
        { status: 400 }
      );
    }

    if (!external_name || !external_name.trim()) {
      return NextResponse.json(
        { error: "외부 제품명은 필수입니다" },
        { status: 400 }
      );
    }

    // alias_type 기본값 설정 (DB는 'purchase' 또는 'sales'만 허용)
    const finalAliasType = alias_type || "purchase";

    // 기존 별칭 존재 여부 확인 (alias_type 포함)
    const { data: existingAliases, error: queryError } = await supabase
      .from("company_product_aliases")
      .select("id")
      .eq("company_id", company_id)
      .eq("product_id", product_id)
      .eq("alias_type", finalAliasType);

    if (queryError) {
      console.error("[AliasAPI] Query error:", queryError);
      throw queryError;
    }

    const existing = existingAliases && existingAliases.length > 0 ? existingAliases[0] : null;

    if (existing) {
      // 업데이트
      console.log("[AliasAPI] Updating existing alias:", existing.id);
      const { data, error } = await supabase
        .from("company_product_aliases")
        .update({
          external_code: external_code || null,
          external_name: external_name.trim(),
          external_spec: external_spec || null,
          external_unit_price: external_unit_price || null,
          notes: notes || null,
          alias_type: finalAliasType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select(`
          *,
          company:companies(id, name),
          product:products(id, internal_code, internal_name, type, unit, spec, current_stock)
        `)
        .single();

      if (error) {
        console.error("[AliasAPI] Update error:", error);
        throw error;
      }

      console.log("[AliasAPI] Alias updated:", data);
      return NextResponse.json({
        message: "별칭이 수정되었습니다",
        alias: data,
      });
    } else {
      // 신규 등록
      console.log("[AliasAPI] Creating new alias");
      const { data, error } = await supabase
        .from("company_product_aliases")
        .insert([
          {
            company_id,
            product_id,
            alias_type: finalAliasType,
            external_code: external_code || null,
            external_name: external_name.trim(),
            external_spec: external_spec || null,
            external_unit_price: external_unit_price || null,
            notes: notes || null,
          },
        ])
        .select(`
          *,
          company:companies(id, name),
          product:products(id, internal_code, internal_name, type, unit, spec, current_stock)
        `)
        .single();

      if (error) {
        console.error("[AliasAPI] Insert error:", error);
        throw error;
      }

      console.log("[AliasAPI] Alias created:", data);
      return NextResponse.json(
        { message: "별칭이 등록되었습니다", alias: data },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("별칭 등록/수정 오류:", error);
    const errorMessage = error instanceof Error ? error.message : "별칭 등록/수정 중 오류가 발생했습니다";
    return NextResponse.json(
      { error: errorMessage },
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
