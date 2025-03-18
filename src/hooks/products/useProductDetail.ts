// /hooks/products/useItemHistory.ts
import { createClient } from "@supabase/supabase-js";
import useSWR from "swr";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ItemHistoryParams {
  docType: "estimate" | "order";
  itemName: string;
  startDate: string;
  endDate: string;
  // page, limit 등..
}

export function useProductDetail(params: ItemHistoryParams) {
  const { docType, itemName, startDate, endDate } = params;

  const fetcher = async () => {
    const { data, error } = await supabase.rpc("get_item_history_paginated", {
      _start_date: startDate,
      _end_date: endDate,
      _item_name: itemName,
      _doc_type: docType,
      _offset: 0,
      _limit: 50,
    });
    if (error) throw error;
    return data;
  };

  const { data, error } = useSWR(
    ["itemHistory", docType, itemName, startDate, endDate],
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
  };
}
