import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { searchParams } = req.nextUrl;
  const { companyId } = await params;
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const selectedYears = searchParams.getAll("year").map(Number); // ✅ 여러 개의 연도 선택 가능하도록 변경

  if (!companyId || !type) {
    return NextResponse.json(
      { error: "Missing companyId or type" },
      { status: 400 }
    );
  }

  try {
    let { data, error } = await supabase
      .from("documents")
      .select("content, created_at, status")
      .eq("company_id", companyId)
      .eq("type", type)
      // .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error: "No data found",
          companyName: "",
          availableYears: [],
          yearlyData: {},
          productData: {},
          productPriceHistory: {},
          transactionSummary: {},
        },
        { status: 200 }
      );
    }

    // ✅ 데이터 정리
    const yearlyData: Record<number, Record<string, number>> = {};
    const productData: Record<number, Record<string, number>> = {};
    const transactionSummary: Record<
      number,
      {
        completed: { count: number; totalSales: number };
        pending: { count: number; totalSales: number };
        canceled: { count: number; totalSales: number };
      }
    > = {};
    const productPriceHistory: Record<
      string,
      { month: string; price: number; year: number }[]
    > = {};
    let companyName = "";
    const availableYears = new Set<number>();

    data.forEach((doc) => {
      const year = parseInt(doc.created_at.slice(0, 4), 10);
      const month = doc.created_at.slice(0, 7);
      const status = doc.status as "completed" | "pending" | "canceled";

      availableYears.add(year);

      if (!yearlyData[year]) yearlyData[year] = {};
      if (!yearlyData[year][month]) yearlyData[year][month] = 0;

      if (!transactionSummary[year]) {
        transactionSummary[year] = {
          completed: { count: 0, totalSales: 0 },
          pending: { count: 0, totalSales: 0 },
          canceled: { count: 0, totalSales: 0 },
        };
      }

      if (doc.content) {
        const parsedContent = doc.content;
        if (parsedContent.company_name)
          companyName = parsedContent.company_name;

        const transactionAmount = parsedContent.total_amount || 0;

        if (status in transactionSummary[year]) {
          transactionSummary[year][status].count += 1;
          transactionSummary[year][status].totalSales += transactionAmount;
        }

        yearlyData[year][month] += transactionAmount;
        if (status === "completed") {
        }

        if (Array.isArray(parsedContent.items)) {
          parsedContent.items.forEach((item: any) => {
            const productKey = `${item.name} - ${item.spec}`;

            if (!productData[year]) productData[year] = {};
            if (!productData[year][productKey])
              productData[year][productKey] = 0;

            if (status === "completed") {
              productData[year][productKey] += item.amount || 0;
            }

            if (!productPriceHistory[productKey]) {
              productPriceHistory[productKey] = [];
            }
            const lastEntry = productPriceHistory[productKey].at(-1);
            if (!lastEntry || lastEntry.month !== month) {
              productPriceHistory[productKey].push({
                month,
                price: item.unit_price,
                year,
              });
            }
          });
        }
      }
    });

    // ✅ 연도를 필터링하면서도 X축 1~12월을 유지하도록 보정
    const filteredYearlyData: Record<number, Record<string, number>> = {};
    const filteredProductData: Record<number, Record<string, number>> = {};
    const filteredTransactionSummary: Record<
      number,
      {
        completed: { count: number; totalSales: number };
        pending: { count: number; totalSales: number };
        canceled: { count: number; totalSales: number };
      }
    > = {};

    selectedYears.forEach((year) => {
      filteredYearlyData[year] = {};
      filteredProductData[year] = {};
      filteredTransactionSummary[year] = transactionSummary[year] || {
        completed: { count: 0, totalSales: 0 },
        pending: { count: 0, totalSales: 0 },
        canceled: { count: 0, totalSales: 0 },
      };

      // ✅ 월별 매출을 1~12월까지 기본값 0으로 채우기
      for (let month = 1; month <= 12; month++) {
        const formattedMonth = `${year}-${month.toString().padStart(2, "0")}`;
        filteredYearlyData[year][formattedMonth] =
          yearlyData[year]?.[formattedMonth] || 0;
      }

      filteredProductData[year] = productData[year] || {};
    });

    return NextResponse.json({
      companyName,
      availableYears: Array.from(availableYears).sort(),
      yearlyData: filteredYearlyData,
      productData: filteredProductData,
      productPriceHistory,
      transactionSummary: filteredTransactionSummary,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
