import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  if (!type || !status) {
    return NextResponse.json(
      { error: "Missing required query parameters: type and status." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("type", type)
      .eq("status", status);

    if (error) {
      throw error;
    }

    return NextResponse.json({ documents: data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, status, content, document_number, created_at } = body;

    if (!type || !status || !content || !document_number) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: type, status, content, document_number.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("documents").insert([
      {
        type,
        status,
        content,
        document_number,
        created_at: created_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.error("Error adding document:", error);
    return NextResponse.json(
      { error: "Failed to add document." },
      { status: 500 }
    );
  }
}
