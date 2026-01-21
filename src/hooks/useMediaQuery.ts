"use client";

import { useState, useEffect } from "react";

/**
 * 미디어 쿼리 결과를 반환하는 커스텀 훅
 * CSS 하이드레이션 이슈를 방지하고 신뢰성 있는 반응형 렌더링 제공
 *
 * @param query - 미디어 쿼리 문자열 (예: "(min-width: 640px)")
 * @returns boolean - 미디어 쿼리 매칭 여부
 */
export function useMediaQuery(query: string): boolean {
  // SSR에서는 기본값 false (모바일 우선)
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // 초기값 설정
    setMatches(mediaQuery.matches);

    // 리스너 핸들러
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 이벤트 리스너 등록
    mediaQuery.addEventListener("change", handler);

    // 클린업
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

/**
 * 데스크탑 사이즈 여부를 반환하는 훅 (sm: 640px 이상)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 640px)");
}

/**
 * 태블릿 사이즈 여부를 반환하는 훅 (md: 768px 이상)
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

/**
 * 대형 데스크탑 사이즈 여부를 반환하는 훅 (lg: 1024px 이상)
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
