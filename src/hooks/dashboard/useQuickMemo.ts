"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";

interface MemoResponse {
  memo: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useQuickMemo(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const key = userId ? `/api/dashboard/memo?userId=${userId}` : null;

  const { data, error, isLoading, mutate } = useSWR<MemoResponse>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1분간 캐시 유지
  });

  // 메모 저장
  const saveMemo = useCallback(async (content: string) => {
    if (!userId) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/dashboard/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content }),
      });

      if (!response.ok) throw new Error("Failed to save memo");

      // 캐시 업데이트 (재요청 없이)
      mutate({ memo: content }, false);
    } catch (err) {
      setSaveError(err as Error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, mutate]);

  return {
    memo: data?.memo || "",
    saveMemo,
    isLoading,
    isSaving,
    error: error || saveError
  };
}
