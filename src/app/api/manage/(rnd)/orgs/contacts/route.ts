import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/manage/orgs/contacts
 * 지원기관 담당자 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, orgId } = body;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: "담당자 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const contactsToAdd = contacts.map((c: any) => ({
      ...c,
      org_id: orgId,
    }));

    const { error: contactsError } = await supabase
      .from("rnds_contacts")
      .insert(contactsToAdd);

    if (contactsError) {
      throw contactsError;
    }

    return NextResponse.json({ contacts }, { status: 201 });
  } catch (error) {
    console.error("Error adding orgs contacts:", error);
    return NextResponse.json(
      { error: "Failed to add orgs contacts" },
      { status: 500 }
    );
  }
}
