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

interface DocumentRecord {
  id: string;
  document_number: string;
  company_id: string | null;
  content: {
    items: DocumentItem[];
    company_name?: string;
  };
  created_at: string;
  status: string;
  type: string;
}

interface GroupedProduct {
  groupKey: string;
  name: string;
  spec: string;
  recordCount: number;
  latestPrice: number;
  latestDate: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: { price: number; quantity: string; unit: string; date: string; documentNumber: string; documentId: string; type: string }[];
}

// GET 요청: /api/products/company/[companyId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const { searchParams } = new URL(request.url);

  const searchProduct =
    searchParams.get("product_name")?.toLowerCase().trim() || "";
  const searchSpec =
    searchParams.get("specification")?.toLowerCase().trim() || "";

  try {
    // 해당 거래처의 모든 견적서/발주서 조회
    const { data, error } = await supabase
      .from("documents")
      .select(`id, document_number, company_id, content, created_at, status, type`)
      .eq("company_id", companyId)
      .in("type", ["estimate", "order"])
      .in("status", ["pending", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 품목+규격 기준으로 그룹화
    const groupedMap = new Map<string, GroupedProduct>();

    (data as DocumentRecord[]).forEach((doc) => {
      if (!doc.content?.items || !Array.isArray(doc.content.items)) {
        return;
      }

      doc.content.items.forEach((item) => {
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

        const groupKey = `${itemName.trim().toLowerCase()}|${itemSpec.trim().toLowerCase()}`;
        const unitPrice = Number(item.unit_price) || 0;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            groupKey,
            name: itemName.trim(),
            spec: itemSpec.trim(),
            recordCount: 0,
            latestPrice: 0,
            latestDate: "",
            avgPrice: 0,
            minPrice: Infinity,
            maxPrice: 0,
            priceHistory: [],
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
        }

        // 가격 히스토리 추가
        group.priceHistory.push({
          price: unitPrice,
          quantity: String(item.quantity || ""),
          unit: item.unit || "개",
          date: doc.created_at,
          documentNumber: doc.document_number,
          documentId: doc.id,
          type: doc.type,
        });
      });
    });

    // 평균 가격 계산 및 히스토리 정렬
    const groupedProducts: GroupedProduct[] = [];
    groupedMap.forEach((group) => {
      // 평균 가격 계산
      const totalPrice = group.priceHistory.reduce((sum, h) => sum + h.price, 0);
      group.avgPrice = Math.round(totalPrice / group.recordCount);

      // priceHistory 정렬 (최신순)
      group.priceHistory.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // minPrice가 Infinity인 경우 0으로 보정
      if (group.minPrice === Infinity) group.minPrice = 0;

      groupedProducts.push(group);
    });

    // 레코드 수 많은 순으로 정렬
    groupedProducts.sort((a, b) => b.recordCount - a.recordCount);

    return NextResponse.json(
      {
        products: groupedProducts,
        total: groupedProducts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
