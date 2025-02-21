import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserDetail(userId: string) {
  const { data, error } = useSWR(
    userId ? `/api/tests/users/${userId}/detail` : null,
    fetcher
  );

  return {
    user: data || { name: "", position: "", contact: "", target: 0 },
    isLoading: !error && !data,
    isError: error,
  };
}
