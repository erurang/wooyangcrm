import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface User {
  id: string;
  name: string;
  email?: string;
  level: string;
  role?: string;
}

export function useUsersList() {
  const { data, error, isValidating, mutate } = useSWR<User[]>(
    "/api/users/list",
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 동일한 요청 방지
    }
  );

  return {
    users: data || [],
    isLoading: !data && !error,
    isError: !!error,
    isValidating,
    refreshUsers: mutate,
  };
}
