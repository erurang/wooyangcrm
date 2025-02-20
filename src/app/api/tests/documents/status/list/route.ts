import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "estimate";
    const status = searchParams.get("status") || "pending";
    const searchTerm = searchParams.get("searchTerm") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data, error, count } = await supabase
      .from("documents")
      .select(
        `*, contacts_documents(contacts(contact_name,level,mobile)), users(name,level)`,
        { count: "exact" }
      )
      .eq("type", type)
      .eq("status", status)
      .eq("user_id", userId)
      .ilike("content->>company_name", `%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    const transformedDocuments = data.map((doc) => {
      const contact = doc.contacts_documents?.[0]?.contacts || {};
      const user = doc.users || {};

      return {
        ...doc,
        contact_level: contact.level || "",
        contact_name: contact.contact_name || "",
        contact_mobile: contact.contact_mobile || "",
        user_name: user.name || "",
        user_level: user.level || "",
        contacts_documents: undefined,
        users: undefined,
      };
    });

    return NextResponse.json(
      { documents: transformedDocuments, total: count },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error },
      { status: 500 }
    );
  }
}
