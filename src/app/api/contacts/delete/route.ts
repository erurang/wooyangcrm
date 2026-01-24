import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logContactOperation, logUserActivity } from "@/lib/apiLogger";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
    }

    // 삭제 전 기존 데이터 조회
    const { data: existingContact, error: fetchError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    if (userId && existingContact) {
      await logContactOperation(
        "DELETE",
        contactId,
        existingContact as Record<string, unknown>,
        null,
        userId
      );

      await logUserActivity({
        userId: userId,
        action: "담당자 삭제",
        actionType: "crud",
        targetType: "contact",
        targetId: contactId,
        targetName: existingContact.contact_name,
      });
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
