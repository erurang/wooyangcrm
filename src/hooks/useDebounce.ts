"use client";
import { useState, useEffect } from "react";

// ⏳ useDebounce: 입력값이 변경된 후 일정 시간(300ms) 동안 변경이 없으면 값을 반환
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler); // 🔹 입력이 계속 바뀌면 기존 타이머 삭제 후 새로 설정
  }, [value, delay]);

  return debouncedValue;
}
