"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";

export interface ExpiringDocument {
  id: string;
  type: string;
  status: string;
  document_number: string;
  created_at: string;
  valid_until: string;
  delivery_date: string;
  total_amount: number;
  company_id: string;
  company_name: string;
  consultation_id: string;
  days_remaining: number;
}

interface ExpiringDocumentsData {
  estimates: ExpiringDocument[]; // 매출 (견적서)
  orders: ExpiringDocument[];    // 매입 (발주서)
}

const fetchExpiringDocuments = async (userId: string): Promise<ExpiringDocumentsData> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  // 만료 임박 견적서 (유효기간 7일 이내)
  const { data: estimatesDocs, error: estimatesError } = await supabase
    .from("documents")
    .select(`
      id,
      type,
      status,
      document_number,
      created_at,
      total_amount,
      company_id,
      consultation_id,
      valid_until,
      delivery_date,
      companies!inner(name)
    `)
    .eq("user_id", userId)
    .eq("type", "estimate")
    .eq("status", "pending")
    .not("valid_until", "is", null);

  // 납기 임박 발주서 (납기일 7일 이내)
  const { data: ordersDocs, error: ordersError } = await supabase
    .from("documents")
    .select(`
      id,
      type,
      status,
      document_number,
      created_at,
      total_amount,
      company_id,
      consultation_id,
      valid_until,
      delivery_date,
      companies!inner(name)
    `)
    .eq("user_id", userId)
    .eq("type", "order")
    .eq("status", "pending")
    .not("delivery_date", "is", null);

  if (estimatesError) {
    console.error("Error fetching expiring estimates:", estimatesError);
  }
  if (ordersError) {
    console.error("Error fetching expiring orders:", ordersError);
  }

  // 견적서 필터링 및 남은 일수 계산 (유효기간 기준)
  const expiringEstimates = (estimatesDocs || [])
    .map((doc: Record<string, unknown>) => {
      const validUntil = new Date(doc.valid_until as string);
      const daysRemaining = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: doc.id as string,
        type: doc.type as string,
        status: doc.status as string,
        document_number: doc.document_number as string,
        created_at: doc.created_at as string,
        valid_until: doc.valid_until as string,
        delivery_date: doc.delivery_date as string || "",
        total_amount: doc.total_amount as number,
        company_id: doc.company_id as string,
        consultation_id: doc.consultation_id as string,
        company_name: (doc.companies as { name: string })?.name || "",
        days_remaining: daysRemaining,
      };
    })
    .filter((doc: ExpiringDocument) => doc.days_remaining >= 0 && doc.days_remaining <= 7)
    .sort((a: ExpiringDocument, b: ExpiringDocument) => a.days_remaining - b.days_remaining);

  // 발주서 필터링 및 남은 일수 계산 (납기일 기준)
  const expiringOrders = (ordersDocs || [])
    .map((doc: Record<string, unknown>) => {
      const deliveryDate = new Date(doc.delivery_date as string);
      const daysRemaining = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: doc.id as string,
        type: doc.type as string,
        status: doc.status as string,
        document_number: doc.document_number as string,
        created_at: doc.created_at as string,
        valid_until: doc.valid_until as string || "",
        delivery_date: doc.delivery_date as string,
        total_amount: doc.total_amount as number,
        company_id: doc.company_id as string,
        consultation_id: doc.consultation_id as string,
        company_name: (doc.companies as { name: string })?.name || "",
        days_remaining: daysRemaining,
      };
    })
    .filter((doc: ExpiringDocument) => doc.days_remaining >= 0 && doc.days_remaining <= 7)
    .sort((a: ExpiringDocument, b: ExpiringDocument) => a.days_remaining - b.days_remaining);

  return {
    estimates: expiringEstimates,
    orders: expiringOrders,
  };
};

export function useExpiringDocuments(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `expiring-documents-${userId}` : null,
    () => fetchExpiringDocuments(userId!),
    {
      refreshInterval: 300000, // 5분마다 새로고침
      revalidateOnFocus: true,
    }
  );

  return {
    estimates: data?.estimates || [],
    orders: data?.orders || [],
    allDocuments: [...(data?.estimates || []), ...(data?.orders || [])],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
