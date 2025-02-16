import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { contacts, companyId } = body;

    if (contacts.length > 0) {
      const contactsToAdd = contacts.map((c: any) => ({
        ...c,
        company_id: companyId,
      }));

      const { error: contactsError } = await supabase
        .from("contacts")
        .insert(contactsToAdd);

      if (contactsError) {
        throw contactsError;
      }
    }

    return NextResponse.json({
      contacts: {},
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add contacts" },
      { status: 500 }
    );
  }
}
