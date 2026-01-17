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
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${
                  active
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
