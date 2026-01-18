import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import type { Product, ProductFilter, ProductCreateRequest } from "@/types/production";

export function useProducts(filters?: ProductFilter) {
  // 필터를 쿼리스트링으로 변환
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.is_active !== undefined) params.set("is_active", String(filters.is_active));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.low_stock) params.set("low_stock", "true");

  const queryString = params.toString();
  const url = `/api/production/products${queryString ? `?${queryString}` : ""}`;

  const { data, error, isValidating, mutate } = useSWR<{ products: Product[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const createProduct = async (product: ProductCreateRequest) => {
    const res = await fetch("/api/production/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "제품 등록 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    products: data?.products || [],
    isLoading: !data && !error,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    createProduct,
  };
}

// 원자재 목록 (재고 관리용)
export function useRawMaterials(filters?: Omit<ProductFilter, "type">) {
  return useProducts({ ...filters, type: "raw_material" });
}

// 완제품 목록
export function useFinishedProducts(filters?: Omit<ProductFilter, "type">) {
  return useProducts({ ...filters, type: "finished" });
}

// 구매품 목록
export function usePurchasedProducts(filters?: Omit<ProductFilter, "type">) {
  return useProducts({ ...filters, type: "purchased" });
}

// 저재고 제품 목록
export function useLowStockProducts() {
  return useProducts({ low_stock: true, is_active: true });
}
