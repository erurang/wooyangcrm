import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Currency = "USD" | "EUR" | "CNY";

export interface ExchangeRate {
  currency: Currency;
  rate: number;
  ttb: number;
  tts: number;
  baseDate: string;
  source: string;
  cached?: boolean;
}

export interface ExchangeRateHistory {
  date: string;
  rate: number;
  ttb: number;
  tts: number;
}

export interface ExchangeRateSummary {
  currency: string;
  latestRate: number;
  changeFromStart: number;
  changePercent: number;
  minRate: number;
  maxRate: number;
  avgRate: number;
}

// 단일 환율 조회
export function useExchangeRate(currency?: Currency, date?: string) {
  const params = new URLSearchParams();
  if (currency) params.set("currency", currency);
  if (date) params.set("date", date);

  const queryString = params.toString();
  const url = `/api/exchange-rate${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    ExchangeRate | { rates: ExchangeRate[] }
  >(url, (url) => fetcher(url, { arg: { method: "GET" } }), {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1분간 중복 요청 방지
  });

  if (currency) {
    return {
      rate: data as ExchangeRate | undefined,
      rates: undefined,
      isLoading,
      isError: !!error,
      mutate,
    };
  }

  return {
    rate: undefined,
    rates: (data as { rates: ExchangeRate[] })?.rates,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// 전체 환율 조회
export function useExchangeRates(date?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);

  const queryString = params.toString();
  const url = `/api/exchange-rate${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<{
    rates: ExchangeRate[];
    cached: boolean;
  }>(url, (url) => fetcher(url, { arg: { method: "GET" } }), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    rates: data?.rates || [],
    cached: data?.cached,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// 환율 이력 조회
export function useExchangeRateHistory(
  currency?: Currency,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  if (currency) params.set("currency", currency);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const queryString = params.toString();
  const url = `/api/exchange-rate/history${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading } = useSWR<{
    history: Record<string, ExchangeRateHistory[]>;
    summary: Record<string, ExchangeRateSummary>;
    period: { start: string; end: string };
  }>(url, (url) => fetcher(url, { arg: { method: "GET" } }), {
    revalidateOnFocus: false,
  });

  return {
    history: data?.history || {},
    summary: data?.summary || {},
    period: data?.period,
    isLoading,
    isError: !!error,
  };
}

// 환율 새로고침
export async function refreshExchangeRates(): Promise<ExchangeRate[]> {
  const response = await fetch("/api/exchange-rate?refresh=true");
  const data = await response.json();
  return data.rates || [];
}

// 금액 변환 유틸리티
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: ExchangeRate[]
): number {
  if (fromCurrency === toCurrency) return amount;

  // KRW -> 외화
  if (fromCurrency === "KRW" as Currency) {
    const rate = rates.find((r) => r.currency === toCurrency);
    if (!rate) return 0;
    return Math.round((amount / rate.rate) * 100) / 100;
  }

  // 외화 -> KRW
  if (toCurrency === "KRW" as Currency) {
    const rate = rates.find((r) => r.currency === fromCurrency);
    if (!rate) return 0;
    return Math.round(amount * rate.rate);
  }

  // 외화 -> 외화 (KRW 경유)
  const fromRate = rates.find((r) => r.currency === fromCurrency);
  const toRate = rates.find((r) => r.currency === toCurrency);
  if (!fromRate || !toRate) return 0;

  const krwAmount = amount * fromRate.rate;
  return Math.round((krwAmount / toRate.rate) * 100) / 100;
}

// 통화 표시 유틸리티
export function formatCurrency(amount: number, currency: Currency | "KRW"): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    KRW: new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }),
    USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
    CNY: new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }),
  };

  return formatters[currency]?.format(amount) || `${amount}`;
}
