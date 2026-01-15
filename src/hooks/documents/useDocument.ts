import useSWR from "swr";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount?: number;
}

interface DocumentContent {
  items?: DocumentItem[];
  company_name?: string;
  notes?: string;
  total_amount?: number;
  valid_until?: string;
  delivery_term?: string;
  delivery_place?: string;
  delivery_date?: string;
  payment_method?: string;
}

export interface DocumentDetail {
  id: string;
  document_number: string;
  type: string;
  status: string;
  date?: string;
  content?: DocumentContent;
  contact_name?: string;
  contact_level?: string;
  user_name?: string;
  user_level?: string;
  company_name?: string;
  company_phone?: string;
  company_fax?: string;
  notes?: string;
  total_amount?: number;
  valid_until?: string;
  delivery_term?: string;
  delivery_place?: string;
  delivery_date?: string;
  payment_method?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
};

export function useDocument(documentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DocumentDetail>(
    documentId ? `/api/documents/${documentId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    document: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
