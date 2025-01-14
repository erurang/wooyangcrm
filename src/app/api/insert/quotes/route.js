import data from "../company_details.json";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  try {
    for (const companyCode in data) {
      const companyDetails = data[companyCode];

      // 회사 ID 가져오기 (companyDetails의 companyName으로 매칭)
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyDetails.companyName)
        .single();

      if (companyError || !company) {
        console.error(
          `Company not found or error: ${companyDetails.companyName}`,
          companyError
        );
        continue;
      }

      for (const consultation of companyDetails.consultations) {
        if (consultation.quote) {
          const quote = consultation.quote;

          // consultation_id 가져오기
          const { data: consultationData, error: consultationError } =
            await supabase
              .from("consultations")
              .select("id")
              .eq("content", consultation.consultationContent)
              .eq("company_id", company.id) // 같은 회사의 상담 내역만 조회
              .single();

          if (consultationError || !consultationData) {
            console.error(
              `Consultation not found for content: ${consultation.consultationContent}`,
              consultationError
            );
            continue;
          }

          const consultationId = consultationData.id;

          // user_id 찾기 (quoter와 users의 name 비교)
          const { data: users } = await supabase
            .from("users")
            .select("id, name");
          const quoter = quote.quoter || "";
          let userId = null;

          users?.forEach((user) => {
            const userName = user.name
              .replace(/대표|이사|부장|차장|과장|대리|주임|프로|님/g, "")
              .trim();
            const quoterName = quoter
              .replace(/대표|이사|부장|차장|과장|대리|주임|프로|님/g, "")
              .trim();

            if (
              userName.slice(0, 2) === quoterName.slice(0, 2) ||
              userName.slice(0, 3) === quoterName.slice(0, 3)
            ) {
              userId = user.id;
            }
          });

          // contact_id 찾기 (contactName과 contacts의 name 비교)
          const { data: contacts } = await supabase
            .from("contacts")
            .select("id, contact_name")
            .eq("company_id", company.id);
          const contactName = quote.contactName || "";
          let contactId = null;

          contacts?.forEach((contact) => {
            const contactUserName = contact.contact_name
              .replace(/대표|이사|부장|차장|과장|대리|주임|프로|님/g, "")
              .trim();
            const contactToCompare = contactName
              .replace(/대표|이사|부장|차장|과장|대리|주임|프로|님/g, "")
              .trim();

            if (
              contactUserName.slice(0, 2) === contactToCompare.slice(0, 2) ||
              contactUserName.slice(0, 3) === contactToCompare.slice(0, 3)
            ) {
              contactId = contact.id;
            }
          });

          // documents 테이블에 데이터 삽입
          const { error: documentError } = await supabase
            .from("documents")
            .insert({
              type: "estimate", // 'quote'에 대응
              consultation_id: consultationId, // consultation_id 추가
              content: {
                items: quote.items.map((item) => ({
                  name: item.productName,
                  spec: item.specification,
                  quantity: item.quantity,
                  amount: item.amount,
                  unit_price: item.unitPrice,
                })),
                total_amount: quote.items.reduce(
                  (sum, item) => sum + item.amount,
                  0
                ),
                company_name: companyDetails.companyName, // companyDetails에서 companyName 사용
                notes: quote.specialNote,
                delivery_term: quote.deliveryPeriod,
                valid_until: quote.validityPeriod,
                delivery_place: quote.deliveryPlace,
              },
              user_id: userId,
              contact_id: contactId,
              company_id: company.id, // 회사 ID 추가
            });

          if (documentError) {
            console.error(
              `Document insertion failed for consultation: ${consultation.consultationContent}`,
              documentError
            );
            continue;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Documents inserted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error during documents insertion:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
