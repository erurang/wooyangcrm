import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ✅ API 요청 핸들러
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!contactId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.rpc("get_contact_details", {
      contact_param: contactId,
      start_date: startDate,
      end_date: endDate,
    });

    if (error) {
      console.error("Error fetching contact details:", error);
      return NextResponse.json(
        { error: "데이터를 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data[0] || {} }, { status: 200 });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
