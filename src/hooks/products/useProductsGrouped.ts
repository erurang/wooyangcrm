import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch grouped products");
  return res.json();
};

export const useProductsGrouped = ({
  type,
  userId,
  companyName,
  searchProduct,
  searchSpec,
  minPrice,
  maxPrice,
  status,
  page,
  limit,
}: {
  type: "estimate" | "order";
  userId?: string;
  companyName: string;
  searchProduct: string;
  searchSpec: string;
  minPrice?: number | "";
  maxPrice?: number | "";
  status?: string;
  page: number;
  limit: number;
}) => {
  const queryParams = new URLSearchParams({
    type,
    company_name: companyName,
    product_name: searchProduct,
    specification: searchSpec,
    page: page.toString(),
    limit: limit.toString(),
  });

  // 추가 필터 파라미터
  if (userId) {
    queryParams.set("userId", userId);
  }
  if (minPrice !== undefined && minPrice !== "") {
    queryParams.set("min_price", minPrice.toString());
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    queryParams.set("max_price", maxPrice.toString());
  }
  if (status && status !== "all") {
    queryParams.set("status", status);
  }

  const { data, error, isLoading, mutate } = useSWR(
    `/api/products/grouped?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    products: data?.products || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
};
