import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RndContact {
  id?: string;
  name: string;
  phone?: string;
  department?: string;
  level?: string;
  email?: string;
}

/**
 * GET /api/manage/orgs
 * - page, limit이 있으면: 페이지네이션 목록 (rnds_contacts 포함)
 * - 없으면: 전체 목록
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const name = searchParams.get("name") || "";

  try {
    // 페이지네이션 목록
    if (page && limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      let query = supabase
        .from("rnd_orgs")
        .select("*, rnds_contacts(*)", { count: "exact" })
        .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)
        .order("created_at", { ascending: false });

      if (name) query = query.ilike("name", `%${name}%`);

      const { data, count, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        data,
        total: count || 0,
      });
    }

    // 전체 목록
    const { data, error } = await supabase
      .from("rnd_orgs")
      .select("*", { count: "exact" })
      .order("name", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching orgs list:", error);
    return NextResponse.json(
      { error: "Failed to fetch orgs list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/orgs
 * 기관 추가
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, fax, address, phone } = body;

    const { data: orgs, error: orgError } = await supabase
      .from("rnd_orgs")
      .insert([{ name, email, fax, address, phone }])
      .select()
      .single();

    if (orgError || !orgs) {
      throw new Error("org 추가 실패");
    }

    return NextResponse.json({ orgs }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to add org" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/orgs
 * 기관 수정 (담당자 포함)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, fax, address, phone, notes, RnDs_contacts } = body;

    if (!id) {
      return NextResponse.json({ error: "기관 ID가 없습니다." }, { status: 400 });
    }

    // 기관 정보 업데이트
    const { error: orgsError } = await supabase
      .from("rnd_orgs")
      .update({ name, email, fax, address, phone, notes })
      .eq("id", id);

    if (orgsError) throw orgsError;

    // 기존 담당자 목록 가져오기
    const { data: existingContacts, error: fetchError } = await supabase
      .from("rnds_contacts")
      .select("id")
      .eq("org_id", id);

    if (fetchError) throw fetchError;

    // 삭제할 담당자 찾기
    const existingContactIds = new Set(
      existingContacts.map((contact) => contact.id)
    );
    const newContactIds = new Set(
      (RnDs_contacts as RndContact[]).filter((c) => c.id).map((c) => c.id)
    );

    const contactsToDelete = [...existingContactIds].filter(
      (id) => !newContactIds.has(id)
    );

    // 삭제할 담당자 처리
    if (contactsToDelete.length > 0) {
      await supabase.from("rnds_contacts").delete().in("id", contactsToDelete);
    }

    // 기존 담당자 업데이트
    const contactsToUpdate = (RnDs_contacts as RndContact[]).filter((c) => c.id);
    for (const contact of contactsToUpdate) {
      const { error: updateError } = await supabase
        .from("rnds_contacts")
        .update({
          name: contact.name,
          phone: contact.phone,
          department: contact.department,
          level: contact.level,
          email: contact.email,
        })
        .eq("id", contact.id);

      if (updateError) throw updateError;
    }

    // 신규 담당자 추가
    const contactsToAdd = (RnDs_contacts as RndContact[])
      .filter((c) => !c.id)
      .map((c) => ({
        org_id: id,
        name: c.name,
        phone: c.phone,
        department: c.department,
        level: c.level,
        email: c.email,
      }));

    if (contactsToAdd.length > 0) {
      await supabase.from("rnds_contacts").insert(contactsToAdd);
    }

    // 업데이트된 담당자 목록 가져오기
    const { data: updatedContacts, error: updatedContactsError } =
      await supabase
        .from("rnds_contacts")
        .select("id, org_id, name, phone, department, level, email")
        .eq("org_id", id);

    if (updatedContactsError) throw updatedContactsError;

    return NextResponse.json({
      message: "업데이트 성공",
      contacts: updatedContacts,
    });
  } catch (error) {
    console.error("Error updating orgs:", error);
    return NextResponse.json({ error: "기관 수정 실패" }, { status: 500 });
  }
}
