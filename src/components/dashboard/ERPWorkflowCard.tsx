"use client";

import { ArrowRight, FileText, MessageSquare, Package, CheckSquare, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

interface ERPWorkflowCardProps {
  consultationCount: number;
  pendingDocuments: number;
  urgentDocuments: number;
  pendingTodos: number;
}

interface WorkflowStage {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  route: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ERPWorkflowCard({
  consultationCount,
  pendingDocuments,
  urgentDocuments,
  pendingTodos,
}: ERPWorkflowCardProps) {
  const router = useRouter();

  const stages: WorkflowStage[] = [
    {
      id: "consult",
      title: "상담",
      subtitle: "리드/고객 접점",
      count: consultationCount,
      route: "/consultations/recent",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: MessageSquare,
    },
    {
      id: "documents",
      title: "문서",
      subtitle: "견적/발주 처리",
      count: pendingDocuments,
      route: "/documents/review",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      icon: FileText,
    },
    {
      id: "production",
      title: "생산/재고",
      subtitle: "임박/지연 체크",
      count: urgentDocuments,
      route: "/production/work-orders",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      icon: Package,
    },
    {
      id: "execution",
      title: "실행",
      subtitle: "담당자 액션",
      count: pendingTodos,
      route: "/dashboard/todo",
      color: "text-violet-600 bg-violet-50 border-violet-200",
      icon: CheckSquare,
    },
    {
      id: "shipping",
      title: "출고/배송",
      subtitle: "납기 이슈 확인",
      count: urgentDocuments,
      route: "/shipping",
      color: "text-teal-600 bg-teal-50 border-teal-200",
      icon: Truck,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">ERP 업무 흐름 보드</h2>
        <button
          onClick={() => router.push("/reports")}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          리포트 보기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center gap-2">
              <button
                onClick={() => router.push(stage.route)}
                className={`flex-1 rounded-lg border p-3 text-left transition-colors hover:bg-slate-50 ${stage.color}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{stage.count}</span>
                </div>
                <p className="mt-2 text-xs font-semibold">{stage.title}</p>
                <p className="text-[11px] opacity-80">{stage.subtitle}</p>
              </button>
              {index < stages.length - 1 && (
                <ArrowRight className="hidden md:block h-3.5 w-3.5 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
