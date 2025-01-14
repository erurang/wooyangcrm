import data from "../company_details.json";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  try {
    const results = []; // 결과를 저장할 배열

    for (const companyCode in data) {
      const companyDetails = data[companyCode];

      // `companies`에 데이터 삽입
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            name: companyDetails.companyName,
            address: companyDetails.address,
            phone: companyDetails.phoneNumber,
            fax: companyDetails.faxNumber,
          },
        ])
        .select("*");

      if (companyError) {
        console.error(
          `Company insertion failed for ${companyDetails.companyName}:`,
          companyError
        );
        results.push({
          success: false,
          companyName: companyDetails.companyName,
          error: companyError,
        });
        continue;
      }

      results.push({
        success: true,
        companyName: companyDetails.companyName,
        data: company,
      });
    }

    return new Response(
      JSON.stringify({ message: "Data processed successfully", results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error during data insertion:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
