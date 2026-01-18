import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId)
    return NextResponse.json(
      { error: "Company ID is required" },
      { status: 400 }
    );

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) throw error;

    // contacts 테이블에서 담당자 조회
    const { data: contactsData } = await supabase
      .from("contacts")
      .select("id, contact_name, email, mobile, department, level")
      .eq("company_id", companyId)
      .order("sort_order", { ascending: true });

    const contacts = contactsData?.map((c) => ({
      id: c.id,
      name: c.contact_name,
      email: c.email,
      mobile: c.mobile,
      department: c.department,
      position: c.level,
    })) || [];

    return NextResponse.json({ ...data, contacts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
