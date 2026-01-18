"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Factory,
  ClipboardList,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useWorkOrders, useMyWorkOrders } from "@/hooks/production/useWorkOrders";
import { useLowStockProducts, useFinishedProducts, useRawMaterials } from "@/hooks/production/useProducts";
import { useProductionRecords } from "@/hooks/production/useProductionRecords";

export default function ProductionDashboardPage() {
  const router = useRouter();
  const user = useLoginUser();

  // Data hooks
  const { workOrders } = useWorkOrders();
  const { workOrders: myWorkOrders } = useMyWorkOrders(user?.id);
  const { products: lowStockProducts } = useLowStockProducts();
  const { products: finishedProducts } = useFinishedProducts({ is_active: true });
  const { products: rawMaterials } = useRawMaterials({ is_active: true });
  const { records: productionRecords } = useProductionRecords();

  // Stats
  const pendingWorkOrders = workOrders.filter((wo) => wo.status === "pending").length;
  const inProgressWorkOrders = workOrders.filter((wo) => wo.status === "in_progress").length;
  const myPendingWorkOrders = myWorkOrders.filter(
    (wo) => wo.status !== "completed" && wo.status !== "canceled"
  ).length;
  const recentProductionCount = productionRecords.filter(
    (r) => r.status === "completed"
  ).slice(0, 10).length;

  // Quick action cards
  const quickActions = [
    {
      title: "작업지시",
      description: "작업지시 관리",
      icon: ClipboardList,
      color: "bg-purple-500",
      lightColor: "bg-purple-100",
      textColor: "text-purple-600",
      path: "/production/work-orders",
      stat: `${pendingWorkOrders + inProgressWorkOrders}건 진행중`,
    },
    {
      title: "생산 일정",
      description: "캘린더로 일정 확인",
      icon: Calendar,
      color: "bg-blue-500",
      lightColor: "bg-blue-100",
      textColor: "text-blue-600",
      path: "/production/calendar",
      stat: "일정 보기",
    },
    {
      title: "원자재 재고",
      description: "재고 현황 관리",
      icon: Package,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      path: "/production/inventory",
      stat: lowStockProducts.length > 0 ? `${lowStockProducts.length}건 저재고` : "정상",
    },
    {
      title: "제품 관리",
      description: "완제품 및 BOM",
      icon: Factory,
      color: "bg-violet-500",
      lightColor: "bg-violet-100",
      textColor: "text-violet-600",
      path: "/production/products",
      stat: `${finishedProducts.length}개 제품`,
    },
    {
      title: "생산 기록",
      description: "생산 이력 관리",
      icon: TrendingUp,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-100",
      textColor: "text-emerald-600",
      path: "/production/records",
      stat: `${recentProductionCount}건 최근`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Factory className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">생산관리</h1>
              <p className="text-sm text-slate-500">작업지시, 재고, 생산 기록을 관리합니다</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* My Work Orders Alert */}
        {myPendingWorkOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">내 담당 작업지시</p>
                  <p className="text-sm text-white/80">
                    {myPendingWorkOrders}건의 작업이 대기중입니다
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/production/work-orders?view=my")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              >
                확인하기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 border border-slate-200"
          >
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">대기 작업</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{pendingWorkOrders}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 border border-slate-200"
          >
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm">진행중</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{inProgressWorkOrders}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 border border-slate-200"
          >
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Package className="h-4 w-4" />
              <span className="text-sm">원자재 품목</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{rawMaterials.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white rounded-xl p-4 border ${
              lowStockProducts.length > 0 ? "border-orange-200" : "border-slate-200"
            }`}
          >
            <div className={`flex items-center gap-2 mb-2 ${
              lowStockProducts.length > 0 ? "text-orange-500" : "text-green-500"
            }`}>
              {lowStockProducts.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span className="text-sm">저재고 품목</span>
            </div>
            <p className={`text-3xl font-bold ${
              lowStockProducts.length > 0 ? "text-orange-600" : "text-green-600"
            }`}>
              {lowStockProducts.length}
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">빠른 메뉴</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => router.push(action.path)}
                className="bg-white rounded-xl p-4 border border-slate-200 text-left hover:shadow-md hover:border-purple-200 transition-all group"
              >
                <div className={`p-3 ${action.lightColor} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-6 w-6 ${action.textColor}`} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{action.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{action.description}</p>
                <p className={`text-sm font-medium ${action.textColor}`}>{action.stat}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-orange-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-orange-800">저재고 경고</h3>
              </div>
              <button
                onClick={() => router.push("/production/inventory?low_stock=true")}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                전체 보기
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 bg-orange-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{product.internal_name}</p>
                      <p className="text-xs text-slate-500">{product.internal_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">
                        {product.current_stock.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-slate-400">
                        최소: {product.min_stock_alert?.toLocaleString() || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Work Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-slate-800">최근 작업지시</h3>
            </div>
            <button
              onClick={() => router.push("/production/work-orders")}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              전체 보기
            </button>
          </div>
          <div className="p-4">
            {workOrders.length === 0 ? (
              <p className="text-center text-slate-400 py-4">등록된 작업지시가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {workOrders.slice(0, 5).map((wo) => (
                  <button
                    key={wo.id}
                    onClick={() => router.push(`/production/work-orders/${wo.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          wo.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : wo.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : wo.status === "canceled"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {wo.status === "completed"
                          ? "완료"
                          : wo.status === "in_progress"
                          ? "진행중"
                          : wo.status === "canceled"
                          ? "취소됨"
                          : "대기"}
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {wo.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(wo.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
