import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface CompanySalesSummary {
  company_id: string;
  company_name: string;
  completed_estimates: number;
  completed_orders: number;
  total_sales_amount: number;
  total_purchase_amount: number;
  assigned_sales_reps: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    // 서버 측 필터링 파라미터
    const search = searchParams.get("search")?.toLowerCase() || "";
    const salesRep = searchParams.get("salesRep")?.toLowerCase() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "0", 10); // 0이면 전체 반환

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("get_company_sales_summary", {
      start_date,
      end_date,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 서버 측 필터링 적용
    let filteredData = (data as CompanySalesSummary[]) || [];

    // 거래처명 검색
    if (search) {
      filteredData = filteredData.filter((company) =>
        company.company_name?.toLowerCase().includes(search)
      );
    }

    // 담당 영업사원 필터
    if (salesRep) {
      filteredData = filteredData.filter((company) =>
        (company.assigned_sales_reps || []).some((rep) =>
          rep.toLowerCase().includes(salesRep)
        )
      );
    }

    // 총 개수 계산 (페이지네이션 전)
    const total = filteredData.length;

    // 페이지네이션 적용 (limit이 0이 아닐 경우)
    if (limit > 0) {
      const offset = (page - 1) * limit;
      filteredData = filteredData.slice(offset, offset + limit);
    }

    return NextResponse.json(
      {
        data: filteredData,
        total,
        page,
        limit: limit || total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
