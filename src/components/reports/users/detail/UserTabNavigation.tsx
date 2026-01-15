"use client";

import {
  FileText,
  Target,
  Users,
  TrendingUp,
  Building,
  Package,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";

type TabType =
  | "dashboard"
  | "consultation"
  | "sales"
  | "purchase"
  | "trends"
  | "performance"
  | "clients"
  | "items"
  | "todo";

interface UserTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "대시보드", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "consultation", label: "상담내역", icon: <Users className="h-4 w-4" /> },
  { id: "items", label: "품목", icon: <Package className="h-4 w-4" /> },
  { id: "sales", label: "매출", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "purchase", label: "매입", icon: <FileText className="h-4 w-4" /> },
  { id: "trends", label: "추이", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "performance", label: "성과", icon: <Target className="h-4 w-4" /> },
  { id: "clients", label: "거래처", icon: <Building className="h-4 w-4" /> },
  { id: "todo", label: "할일", icon: <CheckCircle className="h-4 w-4" /> },
];

export default function UserTabNavigation({
  activeTab,
  onTabChange,
}: UserTabNavigationProps) {
  return (
    <div className="px-5 pb-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { TabType };
