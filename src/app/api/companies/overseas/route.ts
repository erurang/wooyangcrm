import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 해외 거래처 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const name = searchParams.get("name") || "";

    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .eq("is_overseas", true)
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    const { data: companies, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 각 회사의 담당자 조회
    const companyIds = companies?.map((c) => c.id) || [];
    let contactsMap: Record<string, any[]> = {};

    if (companyIds.length > 0) {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, company_id, contact_name, mobile, department, level, email")
        .in("company_id", companyIds)
        .order("sort_order", { ascending: true });

      // 회사별로 담당자 그룹화
      contacts?.forEach((contact) => {
        if (!contactsMap[contact.company_id]) {
          contactsMap[contact.company_id] = [];
        }
        contactsMap[contact.company_id].push({
          id: contact.id,
          name: contact.contact_name,
          email: contact.email,
          mobile: contact.mobile,
          department: contact.department,
          position: contact.level,
        });
      });
    }

    // 회사 데이터에 담당자 추가
    const companiesWithContacts = companies?.map((company) => ({
      ...company,
      contacts: contactsMap[company.id] || [],
    }));

    return NextResponse.json({
      companies: companiesWithContacts,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching overseas companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch overseas companies" },
      { status: 500 }
    );
  }
}

// POST: 해외 거래처 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, email, website, notes, contacts } = body;

    // 동일 이름 거래처 확인
    const { data: existing, error: existingError } = await supabase
      .from("companies")
      .select("name")
      .eq("name", name.trim())
      .eq("is_overseas", true);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 해외 거래처입니다." },
        { status: 400 }
      );
    }

    // 해외 거래처 추가
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert([
        {
          name: name.trim(),
          address,
          email,
          website,
          notes,
          is_overseas: true,
        },
      ])
      .select()
      .single();

    if (companyError || !newCompany) {
      throw new Error("해외 거래처 추가 실패");
    }

    // 담당자 추가 (contacts 테이블 사용)
    if (contacts && contacts.length > 0) {
      const contactsToAdd = contacts.map((c: any, index: number) => ({
        company_id: newCompany.id,
        contact_name: c.name,
        email: c.email || null,
        mobile: c.mobile || null,
        department: c.department || null,
        level: c.position || null,
        sort_order: index,
      }));

      const { error: contactsError } = await supabase
        .from("contacts")
        .insert(contactsToAdd);

      if (contactsError) {
        console.error("Error adding contacts:", contactsError);
      }
    }

    return NextResponse.json({ company: newCompany });
  } catch (error) {
    console.error("Error adding overseas company:", error);
    return NextResponse.json(
      { error: "Failed to add overseas company" },
      { status: 500 }
    );
  }
}
