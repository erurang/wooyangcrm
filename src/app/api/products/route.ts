import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentItem {
  name: string;
  spec: string;
  unit_price: number | string;
  quantity: number;
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

// GET 요청: /api/products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const searchCompany =
    searchParams.get("company_name")?.toLowerCase().trim() || "";
  const searchProduct =
    searchParams.get("product_name")?.toLowerCase().trim() || "";
  const searchSpec =
    searchParams.get("specification")?.toLowerCase().trim() || "";
  const searchType = searchParams.get("type")?.toLowerCase().trim() || "";

  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const status = searchParams.get("status") || ""; // status 필터 추가

  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const userId = searchParams.get("userId") || "";

  // 페이지네이션 파라미터
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    // Query 생성 (company_name은 content JSONB 내에 있음)
    let query = supabase
      .from("documents")
      .select(`
        id, document_number, company_id, content, created_at, status,
        user:users!documents_user_id_fkey(id, name, level)
      `)
      .eq("type", searchType)
      .ilike("content->>company_name", `%${searchCompany}%`);

    // status 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 유저 필터
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    // 날짜 최신순 정렬
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환 및 필터링
    const filteredProducts = (data as DocumentRecord[]).flatMap((doc) => {
      // items가 없거나 배열이 아닌 경우 빈 배열 반환
      if (!doc.content?.items || !Array.isArray(doc.content.items)) {
        return [];
      }

      return doc.content.items
        .filter((item) => {
          const itemName = item.name || "";
          const itemSpec = item.spec || "";

          // 물품명 필터
          if (
            searchProduct &&
            !itemName.toLowerCase().trim().includes(searchProduct)
          ) {
            return false;
          }

          // 규격 필터
          if (
            searchSpec &&
            !itemSpec.toLowerCase().trim().includes(searchSpec)
          ) {
            return false;
          }

          // 단가 필터
          const unitPrice = Number(item.unit_price);
          if (minPrice && unitPrice < parseFloat(minPrice)) {
            return false;
          }
          if (maxPrice && unitPrice > parseFloat(maxPrice)) {
            return false;
          }

          return true;
        })
        .map((item) => {
          // Handle user being array or single object
          const userData = Array.isArray(doc.user) ? doc.user[0] : doc.user;
          return {
            id: doc.id,
            document_number: doc.document_number,
            estimate_date: doc.created_at,
            company_id: doc.company_id || "",
            company_name: doc.content.company_name || "",
            name: item.name,
            spec: item.spec,
            unit_price: Number(item.unit_price),
            quantity: item.quantity,
            status: doc.status,
            user_name: userData?.name || "",
            user_level: userData?.level || "",
          };
        });
    });

    // 날짜 최신순 정렬 (프론트엔드에서 정렬하지 않은 경우 기본값)
    filteredProducts.sort((a, b) =>
      new Date(b.estimate_date).getTime() - new Date(a.estimate_date).getTime()
    );

    // 페이지네이션 적용
    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // 페이지네이션된 데이터 반환
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
