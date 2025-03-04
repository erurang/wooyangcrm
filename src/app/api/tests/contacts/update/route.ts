import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { contact, companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "거래처 ID가 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 1️⃣ 기존 담당자 목록 가져오기
    const { data: existingContacts, error: contactsFetchError } = await supabase
      .from("contacts")
      .select(
        "id, company_id, contact_name, mobile, department, level, email,resign"
      )
      .eq("company_id", companyId);

    if (contactsFetchError) throw contactsFetchError;

    // 🔹 3️⃣ 새 담당자 Map 생성 (id를 키로 사용, 없으면 새로운 데이터로 간주)
    const newContactsMap = new Map(contact.map((c: any) => [c.id, c]));

    // 🔹 4️⃣ 삭제해야 할 기존 담당자 찾기
    const contactsToDelete = existingContacts.filter(
      (c) => !newContactsMap.has(c.id)
    );

    // 🔹 5️⃣ 추가해야 할 담당자 찾기 (id가 없는 경우)
    const contactsToAdd = contact
      .filter((c: any) => !c.id)
      .map((c: any) => ({
        company_id: companyId,
        contact_name: c.contact_name,
        mobile: c.mobile,
        department: c.department,
        level: c.level,
        email: c.email,
        resign: c.resign,
      }));

    // 🔹 6️⃣ 기존 담당자 업데이트 (id가 있는 경우)
    const contactsToUpdate = contact.filter((c: any) => c.id);

    // 🔹 7️⃣ 기존 담당자 수정 (UPDATE)
    for (const updatedContact of contactsToUpdate) {
      await supabase
        .from("contacts")
        .update({
          contact_name: updatedContact.contact_name,
          mobile: updatedContact.mobile,
          department: updatedContact.department,
          level: updatedContact.level,
          email: updatedContact.email,
          resign: updatedContact.resign,
        })
        .eq("id", updatedContact.id);
    }

    // 🔹 8️⃣ 신규 담당자 추가 (INSERT)
    if (contactsToAdd.length > 0) {
      await supabase.from("contacts").insert(contactsToAdd);
    }

    // 🔹 9️⃣ 삭제할 담당자 처리 (DELETE)
    if (contactsToDelete.length > 0) {
      await supabase
        .from("contacts")
        .delete()
        .in(
          "id",
          contactsToDelete.map((c) => c.id)
        );
    }

    // 🔹 10️⃣ 업데이트된 담당자 목록 가져오기
    const { data: updatedContacts, error: updatedContactsError } =
      await supabase
        .from("contacts")
        .select(
          "id, company_id, contact_name, mobile, department, level, email,resign"
        )
        .eq("company_id", companyId);

    if (updatedContactsError) throw updatedContactsError;

    return NextResponse.json({ contacts: updatedContacts });
  } catch (error) {
    console.error("Error updating contacts:", error);
    return NextResponse.json({ error: "담당자 수정 실패" }, { status: 500 });
  }
}
