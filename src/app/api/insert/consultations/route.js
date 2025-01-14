import data from "../company_details.json";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  try {
    for (const companyCode in data) {
      const companyDetails = data[companyCode];

      // 회사 ID 가져오기
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyDetails.companyName)
        .single();

      if (!company) {
        console.error(`Company not found: ${companyDetails.companyName}`);
        continue;
      }

      for (const consultation of companyDetails.consultations) {
        // 담당자 ID 찾기
        let userId = null;
        if (consultation.consultant) {
          // 직책 제거 및 이름 정리
          const consultantName = consultation.consultant
            .replace(/(이사|부장|차장|대리|과장|주임|수석님|프로|님)$/g, "")
            .trim();

          const { data: user } = await supabase
            .from("users")
            .select("id")
            .ilike("name", `%${consultantName}%`)
            .single(); // 정확한 이름 매칭

          if (user) {
            userId = user.id;
          } else {
            console.warn(
              `No matching user found for consultant: ${consultantName}`
            );
          }
        }

        // 연락처 ID 찾기
        let contactId = null;
        if (consultation.consultee) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("id")
            .eq("contact_name", consultation.consultee)
            .eq("company_id", company.id)
            .single();

          if (contact) {
            contactId = contact.id;
          } else {
            console.warn(
              `No matching contact found for consultee: ${consultation.consultee}`
            );
          }
        }

        // `consultations` 테이블에 데이터 삽입
        const { error: consultationError } = await supabase
          .from("consultations")
          .insert({
            date: consultation.consultationDate,
            content: consultation.consultationContent,
            user_id: userId, // 유저 ID 연결
            contact_id: contactId, // 연락처 ID 연결
            company_id: company.id, // 회사 ID 연결
          });

        if (consultationError) {
          console.error(
            `Consultation insertion failed for date ${consultation.consultationDate}:`,
            consultationError
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Consultations inserted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error during consultations insertion:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
