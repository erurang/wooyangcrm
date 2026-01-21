import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 결재 카테고리 목록 조회
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("approval_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching approval categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/approvals/categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval categories" },
      { status: 500 }
    );
  }
}

/**
 * 결재 카테고리 생성 (관리자용)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, sort_order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "카테고리 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("approval_categories")
      .insert({
        name,
        description: description || null,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating approval category:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 존재하는 카테고리 이름입니다." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/approvals/categories:", error);
    return NextResponse.json(
      { error: "Failed to create approval category" },
      { status: 500 }
    );
  }
}
