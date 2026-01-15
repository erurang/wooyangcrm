import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing startDate or endDate" },
      { status: 400 }
    );
  }

  try {
    // 🔹 1️⃣ `documents`에서 모든 직원의 `매출/매입` 가져오기 (user_id가 NULL이 아닌 경우만)
    let { data: documents, error: docError } = await supabase
      .from("documents")
      .select("user_id, status, content,type")
      // .eq("status", "completed")
      .not("user_id", "is", null) // ✅ user_id가 NULL인 경우 제외
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (docError) throw docError;

    if (!documents || documents.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // 🔹 2️⃣ 직원별 `매출/매입` 집계
    const userStats = new Map<
      string,
      { userName: string; totalSales: number; totalPurchases: number }
    >();

    documents.forEach((doc) => {
      const userId = doc.user_id;
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userName: "", // ⬅️ 나중에 채울 값
          totalSales: 0,
          totalPurchases: 0,
        });
      }

      const userData = userStats.get(userId)!;

      // 🔹 매출 (견적서 기준)
      if (doc.type === "estimate") {
        userData.totalSales += doc.content?.total_amount || 0;
      }
      // 🔹 매입 (발주서 기준)
      if (doc.type === "order") {
        userData.totalPurchases += doc.content?.total_amount || 0;
      }

      userStats.set(userId, userData);
    });

    // 🔹 3️⃣ 직원 정보 가져오기 (userId 기반)
    const userIds = Array.from(userStats.keys());

    let { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds);

    if (usersError) throw usersError;
    if (!users) users = [];

    // 🔹 4️⃣ 직원 정보 매핑
    const userNameMap = new Map(users.map((u) => [u.id, u.name || "Unknown"]));

    userStats.forEach((user, userId) => {
      user.userName = userNameMap.get(userId) || "Unknown";
    });

    // 🔹 5️⃣ 바 차트용 데이터 포맷 변환
    const userList = Array.from(userStats.values());

    return NextResponse.json({ data: userList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
