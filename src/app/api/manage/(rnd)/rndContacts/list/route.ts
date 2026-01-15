import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactTerm = searchParams.get("contactTerm") || "";
    const rndsId = searchParams.get("rndsId")?.split(",") || [];

    // 🔹 1️⃣ 검색어가 있을 경우 `contact_name` 기준으로 검색
    if (contactTerm) {
      const { data: contacts, error } = await supabase
        .from("rnds_contacts")
        .select("org_id")
        .ilike("name", `%${contactTerm}%`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        rndsId: contacts.map((c) => c.org_id),
      });
    }

    // 🔹 2️⃣ 특정 companyIds에 속한 contacts 리스트 가져오기
    if (rndsId.length > 0) {
      const { data: contacts, error } = await supabase
        .from("rnds_contacts")
        .select("id,org_id, name, phone, department, level, email")
        .in("org_id", rndsId)
        .order("org_id", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ contacts });
    }

    // 🔹 3️⃣ 아무 조건도 없으면 빈 배열 반환
    return NextResponse.json({ contacts: [] });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
