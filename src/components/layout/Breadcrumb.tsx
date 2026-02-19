"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "대시보드",
  consultation: "상담 현황",
  sales: "매출 분석",
  purchase: "매입 분석",
  items: "품목 분석",
  trends: "추이 분석",
  performance: "성과 지표",
  clients: "거래처 분석",
  documents: "문서 현황",
  todo: "할 일",
  manage: "관리",
  customers: "거래처",
  contacts: "담당자",
  resign: "퇴사자",
  orgs: "지원기관",
  rnds: "R&D",
  brnds: "비 R&D",
  develop: "개발건",
  develop_contacts: "개발 담당자",
  calendar: "캘린더",
  consultations: "상담",
  search: "검색",
  follow: "후속상담",
  recent: "최근 상담",
  details: "상세",
  products: "제품",
  unit: "단가",
  stocks: "재고",
  inventory: "재고 관리",
  inbound: "입고",
  outbound: "출고",
  production: "생산관리",
  "work-orders": "작업지시",
  records: "생산 기록",
  reports: "리포트",
  users: "직원",
  admin: "관리자",
  logs: "로그",
  delete_request: "삭제 요청",
  my: "내 정보",
  todos: "할 일",
  upload: "업로드",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];

  items.push({
    label: "홈",
    href: "/dashboard",
    isLast: false,
  });

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      );

    if (isUuid) {
      items.push({ label: "상세", href: currentPath, isLast });
    } else {
      const label = ROUTE_LABELS[segment] || segment;
      items.push({ label, href: currentPath, isLast });
    }
  });

  return (
    <nav className="flex items-center text-[13px] text-slate-500 mb-4">
      {items.map((item, index) => (
        <div key={`${index}-${item.href}`} className="flex items-center">
          {index === 0 ? (
            <Link
              href={item.href}
              className="flex items-center hover:text-sky-600 transition-colors duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-300" />
              {item.isLast ? (
                <span className="text-slate-800 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-sky-600 transition-colors duration-200 cursor-pointer"
                >
                  {item.label}
                </Link>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
