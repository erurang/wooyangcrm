import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consultationId = searchParams.get("consultationId");
  const type = searchParams.get("type");

  if (!consultationId || !type) {
    return NextResponse.json(
      { error: "consultationId 또는 type이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "*, contacts_documents(contacts(contact_name,level,mobile), users(name,level))"
      )
      .eq("consultation_id", consultationId)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 목록을 가져오는 중 오류 발생" },
      { status: 500 }
    );
  }
}
