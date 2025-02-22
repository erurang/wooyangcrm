import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export const useProductsList = ({
  type,
  userId,
  companyIds,
  searchProduct,
  searchSpec,
  minPrice,
  maxPrice,
  status,
  page,
  limit,
}: {
  type: "estimate" | "order";
  userId: string;
  companyIds: string[];
  searchProduct: string;
  searchSpec: string;
  minPrice: number | "";
  maxPrice: number | "";
  status: string;
  page: number;
  limit: number;
}) => {
  const queryParams = new URLSearchParams({
    type,
    product_name: searchProduct,
    specification: searchSpec,
    min_price: minPrice ? minPrice.toString() : "",
    max_price: maxPrice ? maxPrice.toString() : "",
    status,
    page: page.toString(),
    limit: limit.toString(),
  });

  // ✅ userId가 있을 때만 추가
  if (userId) queryParams.append("userId", userId);

  // ✅ companyIds가 있을 때만 추가
  companyIds.forEach((id) => queryParams.append("companyIds", id));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/tests/products?${queryParams.toString()}`,
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
