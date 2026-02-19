"use client";

import {
  Home,
  Users,
  Target,
} from "lucide-react";

export type TabType =
  | "home"
  | "consultation"
  | "performance";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "home",
    label: "홈",
    icon: <Home className="h-4 w-4 mr-2" />,
  },
  {
    id: "consultation",
    label: "상담 현황",
    icon: <Users className="h-4 w-4 mr-2" />,
  },
  {
    id: "performance",
    label: "성과 지표",
    icon: <Target className="h-4 w-4 mr-2" />,
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
                ? "bg-sky-600 text-white shadow-sm"
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
