import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

type DocumentType = "estimate" | "order";
type DocumentStatus = "pending" | "completed" | "canceled";

interface DocumentContentItem {
  name?: string;
  amount?: number | string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") || "";
  const year = searchParams.get("year") || new Date().getFullYear(); // 기본값: 현재 연도

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // 데이터 가져오기: 2024년 이전은 status 무시, 이후는 status 필터 적용
    const { data: documents, error } = await supabase
      .from("documents")
      .select("status, type, content, created_at, total_amount")
      .eq("user_id", userId)
      .gte("created_at", `${year}-01-01T00:00:00`) // 해당 연도의 시작
      .lte("created_at", `${year}-12-31T23:59:59`); // 해당 연도의 끝

    if (error) {
      throw error;
    }

    const summary = {
      estimate: {
        pending: { count: 0, total: 0 },
        completed: { count: 0, total: 0 },
        canceled: { count: 0, total: 0 },
      },
      order: {
        pending: { count: 0, total: 0 },
        completed: { count: 0, total: 0 },
        canceled: { count: 0, total: 0 },
      },
    };

    const monthlySummary = {
      estimate: Array(12).fill(0), // 매출(estimate)
      order: Array(12).fill(0), // 매입(order)
    };

    // 제품 데이터 처리
    const productSummary = {
      estimate: {} as Record<string, number[]>, // 매출 제품별 월별 총 금액
      order: {} as Record<string, number[]>, // 매입 제품별 월별 총 금액
    };

    documents.forEach((doc) => {
      const createdYear = new Date(doc.created_at).getFullYear();
      const createdMonth = new Date(doc.created_at).getMonth(); // 0 ~ 11
      const month = createdMonth;
      const typeKey = doc.type as DocumentType;

      const totalAmount = doc.total_amount ?? 0;

      // 2024년 이전데이터를 무시하거나 2024년 12월이전까지의 데이터를 무시하거나
      if (createdYear < 2024 || (createdYear === 2024 && createdMonth < 12)) {
        // 2024년 이전 데이터: status 무시
        if (typeKey === "estimate") {
          monthlySummary.estimate[month] += totalAmount;
          summary.estimate.completed.total += totalAmount;
          summary.estimate.completed.count++;
        } else if (typeKey === "order") {
          monthlySummary.order[month] += totalAmount;
          summary.order.completed.total += totalAmount;
          summary.order.completed.count++;
        }
      } else {
        // 2024년 이후 데이터: status 필터링
        const statusKey = doc.status as DocumentStatus;

        if (typeKey in summary && statusKey in summary[typeKey]) {
          summary[typeKey][statusKey].count++;
          summary[typeKey][statusKey].total += totalAmount;

          // 월별 데이터 추가
          if (statusKey === "completed") {
            if (typeKey === "estimate") {
              monthlySummary.estimate[month] += totalAmount;
            } else if (typeKey === "order") {
              monthlySummary.order[month] += totalAmount;
            }
          }
        }
      }

      // 제품 데이터 처리
      if (doc.content.items && Array.isArray(doc.content.items)) {
        doc.content.items.forEach((item: DocumentContentItem) => {
          const productName = item.name || "Unknown";
          const productAmount =
            typeof item.amount === "number"
              ? item.amount
              : parseFloat(item.amount || "0");

          // 매출(estimate) 처리
          if (typeKey === "estimate") {
            if (!productSummary.estimate[productName]) {
              productSummary.estimate[productName] = Array(12).fill(0);
            }
            productSummary.estimate[productName][month] += productAmount;
          }

          // 매입(order) 처리
          if (typeKey === "order") {
            if (!productSummary.order[productName]) {
              productSummary.order[productName] = Array(12).fill(0);
            }
            productSummary.order[productName][month] += productAmount;
          }
        });
      }
    });

    return NextResponse.json(
      {
        summary, // 매출/매입 요약
        monthlySummary, // 월별 매출/매입
        productSummary, // 매출 및 매입 제품별 월별 총 금액
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
// export async function GET(req: NextRequest) {
//   const { searchParams } = req.nextUrl;
//   const userId = searchParams.get("userId") || "";
//   const year = searchParams.get("year") || new Date().getFullYear(); // 기본값: 현재 연도

//   if (!userId) {
//     return NextResponse.json({ error: "Missing userId" }, { status: 400 });
//   }

//   try {
//     // 매출 및 매입 상태별 데이터
//     const { data: documents, error } = await supabase
//       .from("documents")
//       .select("status, type, content->total_amount")
//       .eq("user_id", userId);

//     if (error) {
//       throw error;
//     }

//     const summary = {
//       estimate: {
//         pending: { count: 0, total: 0 },
//         completed: { count: 0, total: 0 },
//         canceled: { count: 0, total: 0 },
//       },
//       order: {
//         pending: { count: 0, total: 0 },
//         completed: { count: 0, total: 0 },
//         canceled: { count: 0, total: 0 },
//       },
//     };

//     documents.forEach((doc) => {
//       const typeKey = doc.type as DocumentType;
//       const statusKey = doc.status as DocumentStatus;

//       if (typeKey in summary && statusKey in summary[typeKey]) {
//         const totalAmount =
//           typeof doc.total_amount === "number" ? doc.total_amount : 0;
//         summary[typeKey][statusKey].count++;
//         summary[typeKey][statusKey].total += totalAmount;
//       }
//     });

//     // 월별 매출 및 매입 요약 (특정 연도만)
//     const { data: monthlyData, error: monthlyError } = await supabase
//       .from("documents")
//       .select("created_at, type, content->total_amount")
//       .eq("user_id", userId)
//       .eq("status", "completed")
//       .gte("created_at", `${year}-01-01T00:00:00`)
//       .lte("created_at", `${year}-12-31T23:59:59`);

//     if (monthlyError) {
//       throw monthlyError;
//     }

//     const monthlySummary = {
//       estimate: Array(12).fill(0), // 매출(estimate)
//       order: Array(12).fill(0), // 매입(order)
//     };

//     monthlyData.forEach((doc) => {
//       const month = new Date(doc.created_at).getMonth(); // 0~11
//       if (doc.type === "estimate") {
//         monthlySummary.estimate[month] += doc.total_amount || 0;
//       } else if (doc.type === "order") {
//         monthlySummary.order[month] += doc.total_amount || 0;
//       }
//     });

//     return NextResponse.json(
//       {
//         summary,
//         monthlySummary,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error fetching performance data:", error);
//     return NextResponse.json({ error: String(error) }, { status: 500 });
//   }
// }

// export async function GET(req: NextRequest) {
//   const { searchParams } = req.nextUrl;
//   const userId = searchParams.get("userId") || "";
//   const year = searchParams.get("year") || new Date().getFullYear(); // 기본값: 현재 연도

//   if (!userId) {
//     return NextResponse.json({ error: "Missing userId" }, { status: 400 });
//   }

//   try {
//     // 진행 중, 완료, 취소 상태별 데이터
//     const { data: documents, error } = await supabase
//       .from("documents")
//       .select("status, content->total_amount")
//       .eq("user_id", userId);

//     if (error) {
//       throw error;
//     }

//     const summary = {
//       pending: { count: 0, total: 0 },
//       completed: { count: 0, total: 0 },
//       canceled: { count: 0, total: 0 },
//     };

//     documents.forEach((doc) => {
//       const statusKey = doc.status as keyof typeof summary;

//       if (statusKey in summary) {
//         const totalAmount =
//           typeof doc.total_amount === "number" ? doc.total_amount : 0; // total_amount가 숫자인지 확인
//         summary[statusKey].count++;
//         summary[statusKey].total += totalAmount;
//       }
//     });

//     // 월별 완료 금액 (특정 연도만)
//     const { data: monthlyData, error: monthlyError } = await supabase
//       .from("documents")
//       .select("created_at, content->total_amount")
//       .eq("user_id", userId)
//       .eq("status", "completed")
//       .gte("created_at", `${year}-01-01T00:00:00`) // 연도 필터 시작
//       .lte("created_at", `${year}-12-31T23:59:59`); // 연도 필터 종료

//     if (monthlyError) {
//       throw monthlyError;
//     }

//     const monthlySummary = Array(12).fill(0); // 12개월 데이터 초기화
//     monthlyData.forEach((doc) => {
//       const month = new Date(doc.created_at).getMonth(); // 0~11
//       monthlySummary[month] += doc.total_amount || 0;
//     });

//     // 취소 사유 분석
//     const { data: canceledData, error: canceledError } = await supabase
//       .from("documents")
//       .select("status_reason")
//       .eq("user_id", userId)
//       .eq("status", "canceled");

//     if (canceledError) {
//       throw canceledError;
//     }

//     const reasonsCount: Record<string, number> = {};
//     canceledData.forEach((doc) => {
//       if (doc.status_reason && doc.status_reason.canceled) {
//         const reason = doc.status_reason.canceled.reason || "기타";
//         reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
//       } else {
//         reasonsCount["기타"] = (reasonsCount["기타"] || 0) + 1;
//       }
//     });

//     return NextResponse.json(
//       {
//         summary,
//         monthlySummary,
//         reasonsCount,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error fetching performance data:", error);
//     return NextResponse.json({ error: String(error) }, { status: 500 });
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, target, reason } = body;

    if (!userId || !target || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("performance_logs").insert([
      {
        user_id: userId,
        target, // 어떤 목표인지 (e.g., 'estimate_completed')
        reason, // 목표 추가에 대한 설명
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { success: true, message: "Performance data added" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding performance data:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
