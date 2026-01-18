"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Database,
  Users,
  Building,
  FileText,
  Package,
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  Activity,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

interface StatisticData {
  label: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
}

export default function DataStatisticsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const [overviewStats, setOverviewStats] = useState<StatisticData[]>([]);
  const [tableStats, setTableStats] = useState<ChartData[]>([]);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/statistics");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        setOverviewStats([
          {
            label: "총 레코드 수",
            value: data.overview.totalRecords,
            change: data.overview.consultationChange,
            icon: Database,
            color: "blue",
          },
          {
            label: "사용자",
            value: data.overview.users,
            change: 0,
            icon: Users,
            color: "emerald",
          },
          {
            label: "거래처",
            value: data.overview.companies,
            change: 0,
            icon: Building,
            color: "violet",
          },
          {
            label: "문서",
            value: data.overview.documents,
            change: data.overview.documentChange,
            icon: FileText,
            color: "amber",
          },
        ]);

        setTableStats(data.tableStats);
        setMonthlyData(data.monthlyData);
      } catch (error) {
        console.error("통계 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [period]);

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser.role !== "admin") {
    return null;
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        icon: "bg-blue-100",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        icon: "bg-emerald-100",
      },
      violet: {
        bg: "bg-violet-50",
        text: "text-violet-600",
        icon: "bg-violet-100",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        icon: "bg-amber-100",
      },
    };
    return colors[color] || colors.blue;
  };

  const totalRecords = tableStats.reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">데이터 통계</h1>
              <p className="text-slate-500">데이터베이스 현황 및 통계</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="year">올해</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${colors.icon}`}>
                    <stat.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.change >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Table Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">테이블별 레코드 수</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {tableStats.map((table) => {
                const percentage = (table.value / totalRecords) * 100;
                return (
                  <div key={table.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">
                        {table.name}
                      </span>
                      <span className="text-slate-800">
                        {table.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(percentage, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Distribution Chart (Simplified) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">데이터 분포</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="relative w-48 h-48">
                  {/* Simple Pie Chart Visualization */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-slate-800">
                        {totalRecords.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">총 레코드</p>
                    </div>
                  </div>
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {tableStats.slice(0, 5).map((table, index) => {
                      const colors = [
                        "#8b5cf6",
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                      ];
                      const percentage =
                        (table.value / tableStats.slice(0, 5).reduce((a, b) => a + b.value, 0)) * 100;
                      const offset = tableStats
                        .slice(0, index)
                        .reduce(
                          (sum, t) =>
                            sum +
                            (t.value / tableStats.slice(0, 5).reduce((a, b) => a + b.value, 0)) * 100,
                          0
                        );
                      return (
                        <circle
                          key={table.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={colors[index]}
                          strokeWidth="20"
                          strokeDasharray={`${percentage} ${100 - percentage}`}
                          strokeDashoffset={-offset}
                          className="transition-all"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {tableStats.slice(0, 5).map((table, index) => {
                  const colors = [
                    "bg-violet-500",
                    "bg-blue-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-red-500",
                  ];
                  return (
                    <div
                      key={table.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className={`w-3 h-3 rounded ${colors[index]}`} />
                      <span className="text-slate-600">{table.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">월별 데이터 증가 추이</h2>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-4 h-48">
              {monthlyData.map((data, index) => {
                const maxValue = Math.max(...monthlyData.map(d => d.value), 1);
                const height = (data.value / maxValue) * 100;
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className={`w-8 rounded-t-lg ${
                          index === monthlyData.length - 1 ? "bg-violet-500" : "bg-violet-200"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Database Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">데이터베이스 정보</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-slate-500" />
                <span className="text-slate-600">DB 용량</span>
              </div>
              <p className="text-xl font-semibold text-slate-800">2.4 GB</p>
              <p className="text-xs text-slate-500 mt-1">최대 10 GB 중</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-slate-500" />
                <span className="text-slate-600">일일 쿼리</span>
              </div>
              <p className="text-xl font-semibold text-slate-800">45,230</p>
              <p className="text-xs text-slate-500 mt-1">평균 응답: 45ms</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-slate-600">마지막 최적화</span>
              </div>
              <p className="text-xl font-semibold text-slate-800">3일 전</p>
              <p className="text-xs text-slate-500 mt-1">다음: 4일 후</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
