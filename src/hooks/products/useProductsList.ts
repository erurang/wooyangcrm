import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export const useProductsList = ({
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
  userId: string;
  companyName: string;
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
    company_name: companyName,
    product_name: searchProduct,
    specification: searchSpec,
    min_price: minPrice ? minPrice.toString() : "",
    max_price: maxPrice ? maxPrice.toString() : "",
    page: page.toString(),
    limit: limit.toString(),
  });

  // ✅ userId가 있을 때만 추가
  if (userId) queryParams.append("userId", userId);
  if (status !== "all") queryParams.append("status", status);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?${queryParams.toString()}`,
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
