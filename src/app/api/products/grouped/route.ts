import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentItem {
  name: string;
  spec: string;
  unit_price: number | string;
  quantity: number | string;
  unit?: string;
  amount?: number;
}

interface UserRecord {
  id: string;
  name: string;
  level?: string;
}

interface DocumentRecord {
  id: string;
  document_number: string;
  company_id: string | null;
  user_id: string;
  user: UserRecord | UserRecord[] | null;
  content: {
    items: DocumentItem[];
    company_name?: string;
    notes?: string;
    total_amount?: number;
    valid_until?: string;
    delivery_term?: string;
    delivery_place?: string;
    delivery_date?: string;
    payment_method?: string;
  };
  created_at: string;
  status: string;
}

interface GroupedProduct {
  groupKey: string;
  name: string;
  spec: string;
  recordCount: number;
  companyCount: number;
  latestPrice: number;
  latestDate: string;
  latestCompany: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceByCompany: {
    companyName: string;
    companyId: string;
    latestPrice: number;
    latestDate: string;
    priceHistory: { price: number; quantity: string; unit: string; date: string; documentNumber: string; documentId: string }[];
  }[];
}

// GET 요청: /api/products/grouped
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const searchCompany =
    searchParams.get("company_name")?.toLowerCase().trim() || "";
  const searchProduct =
    searchParams.get("product_name")?.toLowerCase().trim() || "";
  const searchSpec =
    searchParams.get("specification")?.toLowerCase().trim() || "";
  const searchType = searchParams.get("type")?.toLowerCase().trim() || "";

  // 추가 필터 파라미터
  const userId = searchParams.get("userId") || "";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const status = searchParams.get("status") || "";

  // 페이지네이션 파라미터
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    // Query 생성
    let query = supabase
      .from("documents")
      .select(`
        id, document_number, company_id, user_id, content, created_at, status,
        user:users!documents_user_id_fkey(id, name, level)
      `)
      .eq("type", searchType);

    // status 필터 (기본값: pending, completed)
    if (status && status !== "all") {
      query = query.eq("status", status);
    } else {
      query = query.in("status", ["pending", "completed"]);
    }

    // userId 필터
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (searchCompany) {
      query = query.ilike("content->>company_name", `%${searchCompany}%`);
    }

    // 날짜 최신순 정렬
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 품목+규격 기준으로 그룹화
    const groupedMap = new Map<string, GroupedProduct>();

    (data as DocumentRecord[]).forEach((doc) => {
      // items가 없거나 배열이 아닌 경우 스킵
      if (!doc.content?.items || !Array.isArray(doc.content.items)) {
        return;
      }

      doc.content.items.forEach((item) => {
        // item.name이나 item.spec이 없는 경우 스킵
        const itemName = item.name || "";
        const itemSpec = item.spec || "";

        // 필터링 적용
        if (
          searchProduct &&
          !itemName.toLowerCase().trim().includes(searchProduct)
        ) {
          return;
        }

        if (
          searchSpec &&
          !itemSpec.toLowerCase().trim().includes(searchSpec)
        ) {
          return;
        }

        // 단가 필터
        const unitPrice = Number(item.unit_price) || 0;
        if (minPrice && unitPrice < parseFloat(minPrice)) {
          return;
        }
        if (maxPrice && unitPrice > parseFloat(maxPrice)) {
          return;
        }

        const groupKey = `${itemName.trim().toLowerCase()}|${itemSpec.trim().toLowerCase()}`;
        const companyName = doc.content.company_name || "알 수 없음";
        const companyId = doc.company_id || "";

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            groupKey,
            name: itemName.trim(),
            spec: itemSpec.trim(),
            recordCount: 0,
            companyCount: 0,
            latestPrice: 0,
            latestDate: "",
            latestCompany: "",
            avgPrice: 0,
            minPrice: Infinity,
            maxPrice: 0,
            priceByCompany: [],
          });
        }

        const group = groupedMap.get(groupKey)!;
        group.recordCount++;

        // 가격 통계 업데이트
        if (unitPrice < group.minPrice) group.minPrice = unitPrice;
        if (unitPrice > group.maxPrice) group.maxPrice = unitPrice;

        // 최신 가격 업데이트
        if (!group.latestDate || doc.created_at > group.latestDate) {
          group.latestPrice = unitPrice;
          group.latestDate = doc.created_at;
          group.latestCompany = companyName;
        }

        // 거래처별 가격 기록
        let companyRecord = group.priceByCompany.find(
          (c) => c.companyName === companyName
        );
        if (!companyRecord) {
          companyRecord = {
            companyName,
            companyId,
            latestPrice: unitPrice,
            latestDate: doc.created_at,
            priceHistory: [],
          };
          group.priceByCompany.push(companyRecord);
        }

        companyRecord.priceHistory.push({
          price: unitPrice,
          quantity: String(item.quantity || ""),
          unit: item.unit || "개",
          date: doc.created_at,
          documentNumber: doc.document_number,
          documentId: doc.id,
        });

        // 거래처별 최신 가격 업데이트
        if (doc.created_at > companyRecord.latestDate) {
          companyRecord.latestPrice = unitPrice;
          companyRecord.latestDate = doc.created_at;
        }
      });
    });

    // 평균 가격 및 거래처 수 계산
    const groupedProducts: GroupedProduct[] = [];
    groupedMap.forEach((group) => {
      // minPrice가 Infinity인 경우 0으로 보정
      if (group.minPrice === Infinity) group.minPrice = 0;

      // 평균 가격 계산
      const totalPrice = group.priceByCompany.reduce(
        (sum, c) =>
          sum + c.priceHistory.reduce((s, h) => s + h.price, 0),
        0
      );
      group.avgPrice = Math.round(totalPrice / group.recordCount);
      group.companyCount = group.priceByCompany.length;

      // priceHistory 정렬 (최신순)
      group.priceByCompany.forEach((c) => {
        c.priceHistory.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      // priceByCompany를 최신 거래 기준으로 정렬
      group.priceByCompany.sort(
        (a, b) =>
          new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
      );

      groupedProducts.push(group);
    });

    // 레코드 수 많은 순으로 정렬
    groupedProducts.sort((a, b) => b.recordCount - a.recordCount);

    // 페이지네이션 적용
    const total = groupedProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = groupedProducts.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        products: paginatedProducts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
