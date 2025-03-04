import data from "./company_details.json";
import { supabase } from "../../../lib/supabaseClient";
import dayjs from "dayjs";
import readline from "readline";

export async function POST(request) {
  try {
    const companyKeys = Object.keys(data);

    for (let index = 0; index < companyKeys.length; index++) {
      const companyCode = companyKeys[index];
      const companyDetails = data[companyCode];

      console.log("companyDetails", companyDetails);

      // ✅ 기존 회사 데이터 조회
      const { data: existingCompany, error: existingError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyDetails.companyName)
        .maybeSingle();

      let companyId = existingCompany?.id;

      if (existingError) {
        console.error(
          `❌ 회사 조회 오류: ${companyDetails.companyName}`,
          existingError
        );
        continue;
      }

      if (companyId) {
        // ✅ 기존 데이터 업데이트
        const { error: updateError } = await supabase
          .from("companies")
          .update({
            address: companyDetails.address,
            phone: companyDetails.phoneNumber,
            fax: companyDetails.faxNumber,
          })
          .eq("id", companyId);

        if (updateError) {
          console.error(
            `❌ 회사 업데이트 실패: ${companyDetails.companyName}`,
            updateError
          );
        } else {
          console.log(`✅ 회사 업데이트 완료: ${companyDetails.companyName}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "업데이트 완료",
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("❌ 업데이트 중 오류 발생:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
}
