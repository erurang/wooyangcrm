/**
 * KST (한국 표준시) 날짜 유틸리티
 */

// KST 타임존
const KST_TIMEZONE = "Asia/Seoul";

/**
 * 날짜를 KST로 포맷팅
 * @param date - Date 객체 또는 날짜 문자열
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDateKST(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";

    return dateObj.toLocaleDateString("ko-KR", {
      ...options,
      timeZone: KST_TIMEZONE,
    });
  } catch {
    return "-";
  }
}

/**
 * 날짜+시간을 KST로 포맷팅
 */
export function formatDateTimeKST(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";

    return dateObj.toLocaleString("ko-KR", {
      ...options,
      timeZone: KST_TIMEZONE,
    });
  } catch {
    return "-";
  }
}

/**
 * 상대적 시간 표시 (N분 전, N시간 전 등)
 */
export function formatRelativeTimeKST(date: Date | string | null | undefined): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return formatDateKST(dateObj);
  } catch {
    return "-";
  }
}

/**
 * 오늘 날짜를 KST YYYY-MM-DD 형식으로 반환
 */
export function getTodayKST(): string {
  const now = new Date();
  return now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: KST_TIMEZONE,
  }).replace(/\. /g, "-").replace(/\./g, "");
}

/**
 * ISO 문자열을 KST Date 객체로 변환
 */
export function toKSTDate(date: Date | string): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  // KST는 UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  const utcOffset = dateObj.getTimezoneOffset() * 60 * 1000;
  return new Date(dateObj.getTime() + utcOffset + kstOffset);
}

/**
 * 날짜가 오늘인지 확인 (KST 기준)
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  const dateKST = dateObj.toLocaleDateString("ko-KR", { timeZone: KST_TIMEZONE });
  const todayKST = today.toLocaleDateString("ko-KR", { timeZone: KST_TIMEZONE });

  return dateKST === todayKST;
}

/**
 * 날짜 차이 계산 (일 단위, KST 기준)
 */
export function getDaysDiff(date1: Date | string, date2: Date | string = new Date()): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  // 시간 제거하고 날짜만 비교
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
