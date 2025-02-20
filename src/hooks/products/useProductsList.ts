import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export const useProductsList = (
  type: "estimate" | "order",
  searchCompany: string,
  searchProduct: string,
  searchSpec: string,
  minPrice: number | "",
  maxPrice: number | "",
  status: string,
  page: number,
  limit: number
) => {
  const queryParams = new URLSearchParams({
    type,
    company_name: searchCompany,
    product_name: searchProduct,
    specification: searchSpec,
    min_price: minPrice ? minPrice.toString() : "",
    max_price: maxPrice ? maxPrice.toString() : "",
    status,
    page: page.toString(),
    limit: limit.toString(),
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/tests/products?${queryParams}`,
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
