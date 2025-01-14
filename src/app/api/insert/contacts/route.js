import data from "../company_details.json";
import { supabase } from "../../../../lib/supabaseClient";

// 정규화된 이름 추출 (불필요한 문자 제거)
function normalizeName(name) {
  return name.replace(/님|이사|부장|차장|대리|과장|주임|프로|&/g, "").trim();
}

// 이름의 앞 2~3글자 추출
function getNamePrefixes(name) {
  const normalized = normalizeName(name);
  return [normalized.slice(0, 2), normalized.slice(0, 3)];
}

export async function POST(request) {
  try {
    for (const companyCode in data) {
      const companyDetails = data[companyCode];

      // 회사 ID 가져오기
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyDetails.companyName)
        .maybeSingle();

      if (companyError) {
        console.error(
          `Error fetching company: ${companyDetails.companyName}`,
          companyError
        );
        continue;
      }

      if (!company) {
        console.error(`Company not found: ${companyDetails.companyName}`);
        continue;
      }

      const existingContacts = await supabase
        .from("contacts")
        .select("id, contact_name")
        .eq("company_id", company.id);

      if (existingContacts.error) {
        console.error(
          "Error fetching existing contacts:",
          existingContacts.error
        );
        continue;
      }

      const existingContactNames = existingContacts.data.map((contact) => ({
        id: contact.id,
        prefixes: getNamePrefixes(contact.contact_name),
      }));

      // contactDetails 추가
      for (const contactDetail of companyDetails.contactDetails) {
        const contactNamePrefixes = getNamePrefixes(contactDetail.name);

        // 중복 확인 (앞 2~3글자 비교)
        const isDuplicate = existingContactNames.some((existingContact) =>
          existingContact.prefixes.some((prefix) =>
            contactNamePrefixes.includes(prefix)
          )
        );

        if (isDuplicate) {
          console.log(
            `Duplicate contact found for company ${companyDetails.companyName}: ${contactDetail.name}`
          );
          continue;
        }

        // 중복이 아니면 추가
        const { error: contactInsertError } = await supabase
          .from("contacts")
          .insert({
            contact_name: contactDetail.name,
            mobile: contactDetail.mobile || null,
            department: contactDetail.department || null,
            level: contactDetail.position || null,
            email: contactDetail.email || null,
            company_id: company.id,
          });

        if (contactInsertError) {
          console.error(
            `Failed to insert contact detail: ${contactDetail.name}`,
            contactInsertError
          );
          continue;
        }

        console.log(
          `Contact detail successfully added for company ${companyDetails.companyName}: ${contactDetail.name}`
        );
      }

      // consultations 추가
      for (const consultation of companyDetails.consultations) {
        const contactNamePrefixes = getNamePrefixes(consultation.consultee);

        // 중복 확인 (앞 2~3글자 비교)
        const isDuplicate = existingContactNames.some((existingContact) =>
          existingContact.prefixes.some((prefix) =>
            contactNamePrefixes.includes(prefix)
          )
        );

        if (isDuplicate) {
          console.log(
            `Duplicate consultation contact found for company ${companyDetails.companyName}: ${consultation.consultee}`
          );
          continue;
        }

        // 중복이 아니면 추가
        const { error: contactInsertError } = await supabase
          .from("contacts")
          .insert({
            contact_name: consultation.consultee,
            company_id: company.id,
          });

        if (contactInsertError) {
          console.error(
            `Failed to insert consultation contact: ${consultation.consultee}`,
            contactInsertError
          );
          continue;
        }

        console.log(
          `Consultation contact successfully added for company ${companyDetails.companyName}: ${consultation.consultee}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "Contacts and contact details inserted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error during contacts insertion:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
