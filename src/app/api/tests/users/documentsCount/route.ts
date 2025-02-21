import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ✅ 여러 유저의 문서 개수 가져오는 API (날짜 필터 추가)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdsParam = searchParams.get("userIds");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!userIdsParam || !startDate || !endDate) {
    return NextResponse.json(
      { error: "userIds, startDate, endDate가 필요합니다." },
      { status: 400 }
    );
  }

  const userIds = userIdsParam.split(",").map((id) => id.trim()); // 🔹 UUID 배열 변환

  try {
    // ✅ Supabase RPC 실행 (UUID[] 변환 적용)
    const { data, error } = await supabase.rpc("get_user_document_counts", {
      user_uuids: userIds, // 🔥 이제 UUID[]로 처리됨
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;

    // 🔹 응답 데이터를 `{ userId: { estimates, orders } }` 형태로 변환
    const userDocumentsMap: Record<
      string,
      {
        estimates: Record<
          "pending" | "completed" | "canceled" | "total",
          number
        >;
        orders: Record<"pending" | "completed" | "canceled" | "total", number>;
      }
    > = {};

    // 데이터 매핑
    data.forEach((doc: any) => {
      if (!userDocumentsMap[doc.user_id]) {
        userDocumentsMap[doc.user_id] = {
          estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
          orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
        };
      }

      const docType =
        doc.type === "estimate" ? "estimates" : ("orders" as const);
      const docStatus = doc.status as "pending" | "completed" | "canceled"; // 🔥 상태 타입 명확히 정의

      userDocumentsMap[doc.user_id][docType][docStatus] = doc.total;
      userDocumentsMap[doc.user_id][docType].total += doc.total; // ✅ 총합도 계산
    });

    console.log("userDocumentsMap", userDocumentsMap);

    return NextResponse.json({ documents: userDocumentsMap });
  } catch (error) {
    console.error("문서 개수 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
