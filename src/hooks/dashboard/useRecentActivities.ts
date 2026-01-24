import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface ConsultationActivity {
  id: string;
  company_name: string;
  company_id: string;
  content: string;
  created_at: string;
}

interface DocumentActivity {
  company_name: string;
  created_at: string;
}

interface RecentActivitiesData {
  recent_consultations: ConsultationActivity[];
  recent_documents: DocumentActivity[];
}

export function useRecentActivities(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<RecentActivitiesData>(
    userId ? `/api/dashboard/recent-activities?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    recentActivities: data,
    recentActivitiesIsLoading: isLoading,
    recentActivitiesIsError: error,
    refreshRecentActivities: mutate,
  };
}
