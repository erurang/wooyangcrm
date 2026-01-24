import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logContactOperation, logUserActivity } from "@/lib/apiLogger";

interface ContactInput {
  id?: string;
  contact_name: string;
  mobile?: string;
  department?: string;
  level?: string;
  email?: string;
  resign?: boolean;
  sort_order?: number;
}

/**
 * GET /api/contacts
 * Query params:
 * - contactTerm: 담당자 이름 검색 (company_id 목록 반환)
 * - companyIds: 콤마 구분 회사 ID 목록 (contacts 목록 반환)
 * - company_id: 단일 회사 ID (contacts 목록 반환)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const contactTerm = searchParams.get("contactTerm") || "";
  const companyIdsParam = searchParams.get("companyIds")?.split(",") || [];
  const companyId = searchParams.get("company_id");

  try {
    // 담당자 이름 검색 → company_id 목록 반환
    if (contactTerm) {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("company_id")
        .ilike("contact_name", `%${contactTerm}%`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        companyIds: contacts.map((c) => c.company_id),
      });
    }

    // companyIds로 조회
    if (companyIdsParam.length > 0) {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select(
          "id, company_id, contact_name, mobile, department, level, email, resign, sort_order"
        )
        .in("company_id", companyIdsParam)
        .order("company_id", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("contact_name", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ contacts });
    }

    // company_id로 조회
    if (companyId) {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", companyId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 200 });
    }

    // 조건 없으면 빈 배열
    return NextResponse.json({ contacts: [] });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * 담당자 일괄 추가
 * Body: { contacts: ContactInput[], companyId: string, user_id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contacts, companyId, user_id } = body;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    const contactsToAdd = contacts.map((c: ContactInput) => ({
      ...c,
      company_id: companyId,
    }));

    const { data: insertedContacts, error: contactsError } = await supabase
      .from("contacts")
      .insert(contactsToAdd)
      .select("*");

    if (contactsError) {
      console.error(contactsError);
      throw contactsError;
    }

    // 감사 로그 및 사용자 활동 로그 기록
    if (insertedContacts && user_id) {
      for (const contact of insertedContacts) {
        await logContactOperation(
          "INSERT",
          contact.id,
          null,
          contact as Record<string, unknown>,
          user_id
        );

        await logUserActivity({
          userId: user_id,
          action: "담당자 등록",
          actionType: "crud",
          targetType: "contact",
          targetId: contact.id,
          targetName: contact.contact_name,
        });
      }
    }

    return NextResponse.json({ contacts: insertedContacts }, { status: 201 });
  } catch (error) {
    console.error("Error adding contacts:", error);
    return NextResponse.json(
      { error: "Failed to add contacts" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contacts
 * 담당자 일괄 수정 (companyId 기준)
 * Body: { contact: ContactInput[], companyId: string, user_id?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let { contact, companyId, user_id } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "거래처 ID가 없습니다." },
        { status: 400 }
      );
    }

    contact = (contact as ContactInput[]).map((c, index) => ({
      ...c,
      sort_order: index + 1,
    }));

    // 기존 담당자 목록 가져오기
    const { data: existingContacts, error: contactsFetchError } = await supabase
      .from("contacts")
      .select(
        "id, company_id, contact_name, mobile, department, level, email, resign, sort_order"
      )
      .eq("company_id", companyId);

    if (contactsFetchError) throw contactsFetchError;

    const existingContactsMap = new Map(existingContacts.map((c) => [c.id, c]));
    const newContactsMap = new Map(
      (contact as ContactInput[]).map((c) => [c.id, c])
    );

    // 삭제할 담당자
    const contactsToDelete = existingContacts.filter(
      (c) => !newContactsMap.has(c.id)
    );

    // 추가할 담당자 (id가 없는 경우)
    const contactsToAdd = (contact as ContactInput[])
      .filter((c) => !c.id)
      .map((c) => ({
        company_id: companyId,
        contact_name: c.contact_name,
        mobile: c.mobile,
        department: c.department,
        level: c.level,
        email: c.email,
        resign: c.resign,
        sort_order: c.sort_order,
      }));

    // 업데이트할 담당자 (id가 있는 경우)
    const contactsToUpdate = (contact as ContactInput[]).filter((c) => c.id);

    // 기존 담당자 수정
    for (const updatedContact of contactsToUpdate) {
      const oldData = existingContactsMap.get(updatedContact.id);
      const newData = {
        contact_name: updatedContact.contact_name,
        mobile: updatedContact.mobile,
        department: updatedContact.department,
        level: updatedContact.level,
        email: updatedContact.email,
        resign: updatedContact.resign,
        sort_order: updatedContact.sort_order,
      };

      await supabase
        .from("contacts")
        .update(newData)
        .eq("id", updatedContact.id);

      if (user_id) {
        await logContactOperation(
          "UPDATE",
          updatedContact.id!,
          oldData as Record<string, unknown>,
          newData as Record<string, unknown>,
          user_id
        );

        await logUserActivity({
          userId: user_id,
          action: "담당자 수정",
          actionType: "crud",
          targetType: "contact",
          targetId: updatedContact.id!,
          targetName: updatedContact.contact_name,
        });
      }
    }

    // 신규 담당자 추가
    if (contactsToAdd.length > 0) {
      const { data: insertedContacts } = await supabase
        .from("contacts")
        .insert(contactsToAdd)
        .select("*");

      if (insertedContacts && user_id) {
        for (const contact of insertedContacts) {
          await logContactOperation(
            "INSERT",
            contact.id,
            null,
            contact as Record<string, unknown>,
            user_id
          );

          await logUserActivity({
            userId: user_id,
            action: "담당자 등록",
            actionType: "crud",
            targetType: "contact",
            targetId: contact.id,
            targetName: contact.contact_name,
          });
        }
      }
    }

    // 삭제할 담당자 처리
    if (contactsToDelete.length > 0) {
      if (user_id) {
        for (const contact of contactsToDelete) {
          await logContactOperation(
            "DELETE",
            contact.id,
            contact as Record<string, unknown>,
            null,
            user_id
          );

          await logUserActivity({
            userId: user_id,
            action: "담당자 삭제",
            actionType: "crud",
            targetType: "contact",
            targetId: contact.id,
            targetName: contact.contact_name,
          });
        }
      }

      await supabase
        .from("contacts")
        .delete()
        .in(
          "id",
          contactsToDelete.map((c) => c.id)
        );
    }

    // 업데이트된 담당자 목록 반환
    const { data: updatedContacts, error: updatedContactsError } =
      await supabase
        .from("contacts")
        .select(
          "id, company_id, contact_name, mobile, department, level, email, resign, sort_order"
        )
        .eq("company_id", companyId);

    if (updatedContactsError) throw updatedContactsError;

    return NextResponse.json({ contacts: updatedContacts });
  } catch (error) {
    console.error("Error updating contacts:", error);
    return NextResponse.json({ error: "담당자 수정 실패" }, { status: 500 });
  }
}
