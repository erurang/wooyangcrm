import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, fax, address, phone, notes, RnDs_contacts } = body;

    if (!id) {
      return NextResponse.json(
        { error: "기관 ID가 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 1. 기관 정보 업데이트
    const { error: orgsError } = await supabase
      .from("rnd_orgs")
      .update({
        name,
        email,
        fax,
        address,
        phone,
        notes,
      })
      .eq("id", id);

    if (orgsError) throw orgsError;

    // 🔹 2. 기존 담당자 목록 가져오기
    const { data: existingContacts, error: fetchError } = await supabase
      .from("RnDs_contacts")
      .select("id")
      .eq("org_id", id);

    if (fetchError) throw fetchError;

    // 🔹 3. 기존 담당자 목록에서 삭제해야 할 담당자 찾기
    const existingContactIds = new Set(
      existingContacts.map((contact) => contact.id)
    );
    const newContactIds = new Set(
      RnDs_contacts.filter((c: any) => c.id).map((c: any) => c.id)
    );

    const contactsToDelete = [...existingContactIds].filter(
      (id) => !newContactIds.has(id)
    );

    // 🔹 4. 삭제할 담당자 처리 (DELETE)
    if (contactsToDelete.length > 0) {
      await supabase.from("RnDs_contacts").delete().in("id", contactsToDelete);
    }

    // 🔹 5. 기존 담당자 업데이트 (UPDATE)
    const contactsToUpdate = RnDs_contacts.filter((c: any) => c.id);
    for (const contact of contactsToUpdate) {
      const { error: updateError } = await supabase
        .from("RnDs_contacts")
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

    // 🔹 6. 신규 담당자 추가 (INSERT)
    const contactsToAdd = RnDs_contacts.filter((c: any) => !c.id).map(
      (c: any) => ({
        org_id: id,
        name: c.name,
        phone: c.phone,
        department: c.department,
        level: c.level,
        email: c.email,
      })
    );

    if (contactsToAdd.length > 0) {
      await supabase.from("RnDs_contacts").insert(contactsToAdd);
    }

    // 🔹 7. 업데이트된 담당자 목록 가져오기
    const { data: updatedContacts, error: updatedContactsError } =
      await supabase
        .from("RnDs_contacts")
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
