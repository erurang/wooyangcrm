"use client";

import { useEffect, useCallback } from "react";

/**
 * ESC 키를 눌렀을 때 콜백을 실행하는 훅
 * 주로 모달 닫기에 사용
 *
 * @param isOpen - 모달이 열려있는지 여부
 * @param onClose - 닫기 콜백 함수
 *
 * @example
 * useEscapeKey(isOpen, onClose);
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);
}

export default useEscapeKey;
