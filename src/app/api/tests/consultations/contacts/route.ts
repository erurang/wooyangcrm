import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consultationIds = searchParams.get("consultationIds");

  if (!consultationIds) {
    return NextResponse.json(
      { message: "Missing consultationIds" },
      { status: 400 }
    );
  }

  const consultationIdArray = consultationIds.split(",");

  try {
    const { data, error } = await supabase
      .from("contacts_consultations")
      .select(
        "consultation_id, contacts(id, contact_name, level, email, mobile)"
      )
      .in("consultation_id", consultationIdArray);

    if (error) {
      throw error;
    }

    return NextResponse.json({ contactsConsultations: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch contacts for consultations",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
