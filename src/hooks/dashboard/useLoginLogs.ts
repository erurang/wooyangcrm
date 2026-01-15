import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch consultations");
  return response.json();
};

// 📌 고객 요약 정보 가져오기 훅
export function useLoginLogs(email: string) {
  const { data } = useSWR(`/api/login_logs?email=${email}`, fetcher);

  return {
    loginLogs: data,
  };
}
