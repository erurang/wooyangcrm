"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Redirect from / to /dashboard
// Also handles legacy ?tab= query params
export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");

    // Map legacy tabs to new routes
    const tabRouteMap: Record<string, string> = {
      dashboard: "/dashboard",
      consultation: "/dashboard/consultation",
      sales: "/dashboard/sales",
      purchase: "/dashboard/purchase",
      items: "/dashboard/items",
      trends: "/dashboard/trends",
      performance: "/dashboard/performance",
      clients: "/dashboard/clients",
      documents: "/dashboard/documents",
      todo: "/dashboard/todo",
    };

    const targetRoute = tab && tabRouteMap[tab] ? tabRouteMap[tab] : "/dashboard";
    router.replace(targetRoute);
  }, [router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">로딩 중...</p>
      </div>
    </div>
  );
}
