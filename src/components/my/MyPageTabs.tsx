"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  Paperclip,
  MessageSquare,
  FileCheck,
} from "lucide-react";

const tabConfigs = [
  { name: "활동", path: "", icon: Activity },
  { name: "게시글", path: "/posts", icon: FileText },
  { name: "파일", path: "/files", icon: Paperclip },
  { name: "상담", path: "/consultations", icon: MessageSquare },
  { name: "문서", path: "/documents", icon: FileCheck },
];

interface MyPageTabsProps {
  basePath?: string; // e.g., "/profile" or "/profile/abc123"
}

export default function MyPageTabs({ basePath = "/profile" }: MyPageTabsProps) {
  const pathname = usePathname();

  const tabs = tabConfigs.map((tab) => ({
    ...tab,
    href: `${basePath}${tab.path}`,
  }));

  const isActive = (href: string) => {
    // 기본 탭 (활동)
    if (href === basePath) {
      return pathname === basePath;
    }
    // 다른 탭들
    return pathname.startsWith(href);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
      <nav className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all relative
                ${
                  active
                    ? "text-sky-600 bg-sky-50/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              <Icon className={`w-4 h-4 ${active ? "text-sky-500" : ""}`} />
              {tab.name}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
