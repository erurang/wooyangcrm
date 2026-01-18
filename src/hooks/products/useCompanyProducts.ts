import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch company products");
  return res.json();
};

export const useCompanyProducts = ({
  companyId,
  searchProduct = "",
  searchSpec = "",
}: {
  companyId: string;
  searchProduct?: string;
  searchSpec?: string;
}) => {
  const queryParams = new URLSearchParams({
    product_name: searchProduct,
    specification: searchSpec,
  });

  const shouldFetch = !!companyId;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/products/company/${companyId}?${queryParams.toString()}` : null,
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
