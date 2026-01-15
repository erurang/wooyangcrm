import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, user_id, file_url, file_name } = body;

    if (!post_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: "필수 필드(post_id, file_url, file_name)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("post_files")
      .insert([
        {
          post_id,
          user_id: user_id || null,
          file_url,
          file_name,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding file:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("post_files").delete().eq("id", fileId);

  if (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
