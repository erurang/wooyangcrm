"use client";

import {
  BarChart,
  FileText,
  TrendingUp,
} from "lucide-react";

export type ContactTabType = "overview" | "consultations" | "documents" | "analytics";

interface ContactTabNavigationProps {
  activeTab: ContactTabType;
  onTabChange: (tab: ContactTabType) => void;
}

export default function ContactTabNavigation({
  activeTab,
  onTabChange,
}: ContactTabNavigationProps) {
  const tabs: { id: ContactTabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "개요", icon: <BarChart className="h-4 w-4 mr-2" /> },
    { id: "consultations", label: "상담 내역", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "documents", label: "문서 관리", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "analytics", label: "분석", icon: <TrendingUp className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="bg-white border-t border-b border-slate-200 p-1 mb-6">
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
            <span className="flex items-center">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
