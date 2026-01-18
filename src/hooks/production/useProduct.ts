import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import type {
  Product,
  ProductMaterial,
  ProductTransaction,
  CompanyProductAlias,
  StockAdjustmentRequest,
} from "@/types/production";

interface ProductDetail extends Product {
  materials?: ProductMaterial[];
  aliases?: CompanyProductAlias[];
}

export function useProduct(id: string | undefined) {
  const url = id ? `/api/production/products/${id}` : null;

  const { data, error, isValidating, mutate } = useSWR<{ product: ProductDetail }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 제품 수정
  const updateProduct = async (updates: Partial<Product>) => {
    if (!id) throw new Error("제품 ID가 필요합니다");

    const res = await fetch(`/api/production/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "제품 수정 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 제품 삭제 (비활성화)
  const deleteProduct = async () => {
    if (!id) throw new Error("제품 ID가 필요합니다");

    const res = await fetch(`/api/production/products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "제품 삭제 실패");
    }

    return await res.json();
  };

  // BOM 원자재 추가
  const addMaterial = async (materialId: string, quantityRequired: number, notes?: string) => {
    if (!id) throw new Error("제품 ID가 필요합니다");

    const res = await fetch(`/api/production/products/${id}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        material_id: materialId,
        quantity_required: quantityRequired,
        notes,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "원자재 추가 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // BOM 원자재 제거
  const removeMaterial = async (materialId: string) => {
    if (!id) throw new Error("제품 ID가 필요합니다");

    const res = await fetch(`/api/production/products/${id}/materials?material_id=${materialId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "원자재 제거 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 재고 조정
  const adjustStock = async (quantity: number, notes?: string, createdBy?: string) => {
    if (!id) throw new Error("제품 ID가 필요합니다");

    const res = await fetch("/api/production/products/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: id,
        quantity,
        notes,
        created_by: createdBy,
      } as StockAdjustmentRequest & { created_by?: string }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "재고 조정 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    product: data?.product,
    materials: data?.product?.materials || [],
    aliases: data?.product?.aliases || [],
    isLoading: !data && !error && !!id,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    updateProduct,
    deleteProduct,
    addMaterial,
    removeMaterial,
    adjustStock,
  };
}

// 제품 입출고 내역 조회
export function useProductTransactions(productId: string | undefined) {
  const url = productId ? `/api/production/products/${productId}/transactions` : null;

  const { data, error, isValidating, mutate } = useSWR<{ transactions: ProductTransaction[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    transactions: data?.transactions || [],
    isLoading: !data && !error && !!productId,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

// 회사별 제품 별칭 조회
export function useProductAliases(productId?: string, companyId?: string) {
  const params = new URLSearchParams();
  if (productId) params.set("product_id", productId);
  if (companyId) params.set("company_id", companyId);

  const queryString = params.toString();
  const url = queryString ? `/api/production/products/aliases?${queryString}` : null;

  const { data, error, isValidating, mutate } = useSWR<{ aliases: CompanyProductAlias[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 별칭 등록/수정
  const saveAlias = async (alias: {
    company_id: string;
    product_id: string;
    external_code?: string;
    external_name?: string;
    external_spec?: string;
    external_unit_price?: number;
    notes?: string;
  }) => {
    const res = await fetch("/api/production/products/aliases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alias),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "별칭 저장 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 별칭 삭제
  const deleteAlias = async (aliasId: string) => {
    const res = await fetch(`/api/production/products/aliases?alias_id=${aliasId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "별칭 삭제 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    aliases: data?.aliases || [],
    isLoading: !data && !error && !!(productId || companyId),
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    saveAlias,
    deleteAlias,
  };
}
