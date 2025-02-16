export const fetcher = async (
  url: string,
  { arg }: { arg: { method?: string; body?: any } }
) => {
  const res = await fetch(url, {
    method: arg?.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: arg?.body ? JSON.stringify(arg.body) : undefined, // GET 요청에는 body를 넣지 않음
  });

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status}`);
  }

  const data = await res.json();
  console.log("🌍 fetcher 응답 데이터:", data);
  return data;
};
