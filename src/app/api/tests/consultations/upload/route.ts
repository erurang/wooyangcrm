import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const { consultationId, fileUrl, userId } = await request.json();

  if (!consultationId || !fileUrl || !userId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data, error } = await supabase.from("consultation_files").insert([
    {
      consultation_id: consultationId,
      file_url: fileUrl,
      uploaded_by: userId,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}
