"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";

interface KPISummary {
  todayConsultations: number;
  pendingDocuments: number;
  monthSales: number;
  previousMonthSales: number;
  followUpNeeded: number;
  expiringDocuments: number;
}

const fetchKPISummary = async (userId: string): Promise<KPISummary> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // 전월 기간 계산
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  // 오늘 상담 수
  const { count: todayConsultations } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", todayStr);

  // 진행중 문서 수
  const { count: pendingDocuments } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");

  // 이번달 매출 (완료된 견적서)
  const { data: monthDocs } = await supabase
    .from("documents")
    .select("content")
    .eq("user_id", userId)
    .eq("type", "estimate")
    .eq("status", "completed")
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  const monthSales = monthDocs?.reduce((sum, doc) => {
    return sum + (doc.content?.total_amount || 0);
  }, 0) || 0;

  // 전월 매출 (완료된 견적서)
  const { data: prevMonthDocs } = await supabase
    .from("documents")
    .select("content")
    .eq("user_id", userId)
    .eq("type", "estimate")
    .eq("status", "completed")
    .gte("created_at", prevMonthStart.toISOString())
    .lte("created_at", prevMonthEnd.toISOString());

  const previousMonthSales = prevMonthDocs?.reduce((sum, doc) => {
    return sum + (doc.content?.total_amount || 0);
  }, 0) || 0;

  // 팔로우업 필요 상담 수
  const { count: followUpNeeded } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("follow_up_needed", true)
    .lte("follow_up_date", todayStr);

  // 유효기간 임박 견적서 (7일 이내)
  const { data: expiringDocs } = await supabase
    .from("documents")
    .select("content")
    .eq("user_id", userId)
    .eq("type", "estimate")
    .eq("status", "pending");

  const expiringDocuments = expiringDocs?.filter((doc) => {
    const validUntil = new Date(doc.content?.valid_until);
    return validUntil >= today && validUntil <= sevenDaysLater;
  }).length || 0;

  return {
    todayConsultations: todayConsultations || 0,
    pendingDocuments: pendingDocuments || 0,
    monthSales,
    previousMonthSales,
    followUpNeeded: followUpNeeded || 0,
    expiringDocuments,
  };
};

export function useKPISummary(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `kpi-summary-${userId}` : null,
    () => fetchKPISummary(userId!),
    {
      refreshInterval: 300000, // 5분마다 새로고침
      revalidateOnFocus: true,
    }
  );

  return {
    kpiData: data || {
      todayConsultations: 0,
      pendingDocuments: 0,
      monthSales: 0,
      previousMonthSales: 0,
      followUpNeeded: 0,
      expiringDocuments: 0,
    },
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
