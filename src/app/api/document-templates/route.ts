import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 모든 템플릿 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("document_notes_templates")
      .select("*, users:created_by(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: 새 템플릿 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, created_by } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("document_notes_templates")
      .insert({
        title,
        content,
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
