"use client";

import {
  BarChart3,
  FileText,
  PieChart,
  Target,
  Users,
  TrendingUp,
  Building,
  Package,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";

export type TabType =
  | "dashboard"
  | "consultation"
  | "sales"
  | "purchase"
  | "trends"
  | "performance"
  | "clients"
  | "items"
  | "todo"
  | "documents";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
  },
  {
    id: "consultation",
    label: "상담 내역",
    icon: <Users className="h-4 w-4 mr-2" />,
  },
  {
    id: "sales",
    label: "매출 분석",
    icon: <BarChart3 className="h-4 w-4 mr-2" />,
  },
  {
    id: "purchase",
    label: "매입 분석",
    icon: <PieChart className="h-4 w-4 mr-2" />,
  },
  {
    id: "items",
    label: "품목 검색",
    icon: <Package className="h-4 w-4 mr-2" />,
  },
  {
    id: "trends",
    label: "추이 분석",
    icon: <TrendingUp className="h-4 w-4 mr-2" />,
  },
  {
    id: "performance",
    label: "성과 지표",
    icon: <Target className="h-4 w-4 mr-2" />,
  },
  {
    id: "clients",
    label: "거래처 분석",
    icon: <Building className="h-4 w-4 mr-2" />,
  },
  {
    id: "documents",
    label: "문서 상태",
    icon: <FileText className="h-4 w-4 mr-2" />,
  },
  {
    id: "todo",
    label: "할 일",
    icon: <CheckCircle className="h-4 w-4 mr-2" />,
  },
];

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="bg-white border-t border-b border-slate-200 p-1 mb-5">
      <div className="flex flex-wrap space-x-1 max-w-7xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="flex items-center justify-center">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
