import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { contacts, orgId } = body;

    if (contacts.length > 0) {
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
    }

    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add orgs contacts" },
      { status: 500 }
    );
  }
}
