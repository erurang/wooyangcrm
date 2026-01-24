"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  RND_BUDGET_CATEGORY_LABELS,
  RndBudgetCategory,
  RndProject,
} from "@/types/rnd";

interface ProjectBudgetSummary {
  project: RndProject;
  total_budget: number;
  total_expenditure: number;
  remaining: number;
  execution_rate: number;
  by_category: Record<string, { budget: number; expenditure: number }>;
}

export default function RnDBudgetsOverviewPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectBudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchBudgetData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 전체 과제 목록 조회
      const projectsRes = await fetch("/api/manage/rnds?status=ongoing");
      const projectsData = await projectsRes.json();
      const projectsList: RndProject[] = projectsData.data || [];

      // 각 과제별 예산 정보 조회
      const summaries: ProjectBudgetSummary[] = await Promise.all(
        projectsList.map(async (project) => {
          try {
            const budgetRes = await fetch(`/api/manage/rnds/${project.id}/budgets`);
            const budgetData = await budgetRes.json();
            const budgets = budgetData.data || [];

            let totalBudget = 0;
            let totalExpenditure = 0;
            const byCategory: Record<string, { budget: number; expenditure: number }> = {};

            budgets.forEach((b: {
              category: string;
              gov_amount: number;
              private_amount: number;
              in_kind_amount: number;
              expenditure_total: number;
              year: number;
            }) => {
              if (selectedYear !== "all" && b.year !== parseInt(selectedYear)) {
                return;
              }
              const budgetAmount = (Number(b.gov_amount) || 0) + (Number(b.private_amount) || 0) + (Number(b.in_kind_amount) || 0);
              totalBudget += budgetAmount;
              totalExpenditure += Number(b.expenditure_total) || 0;

              if (!byCategory[b.category]) {
                byCategory[b.category] = { budget: 0, expenditure: 0 };
              }
              byCategory[b.category].budget += budgetAmount;
              byCategory[b.category].expenditure += Number(b.expenditure_total) || 0;
            });

            return {
              project,
              total_budget: totalBudget,
              total_expenditure: totalExpenditure,
              remaining: totalBudget - totalExpenditure,
              execution_rate: totalBudget > 0 ? (totalExpenditure / totalBudget) * 100 : 0,
              by_category: byCategory,
            };
          } catch {
            return {
              project,
              total_budget: 0,
              total_expenditure: 0,
              remaining: 0,
              execution_rate: 0,
              by_category: {},
            };
          }
        })
      );

      setProjects(summaries);
    } catch (err) {
      console.error("Budget data fetch error:", err);
      setError("예산 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const filteredProjects = projects.filter((p) =>
    p.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 전체 집계
  const totalStats = filteredProjects.reduce(
    (acc, p) => ({
      budget: acc.budget + p.total_budget,
      expenditure: acc.expenditure + p.total_expenditure,
      remaining: acc.remaining + p.remaining,
    }),
    { budget: 0, expenditure: 0, remaining: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchBudgetData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예산 현황</h1>
          <p className="text-sm text-gray-500 mt-1">
            과제별 예산 배정 및 집행 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">전체 연도</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <button
            onClick={fetchBudgetData}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 예산</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalStats.budget)}원
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">집행 금액</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalStats.expenditure)}원
              </p>
              <p className="text-xs text-gray-500">
                집행률:{" "}
                {totalStats.budget > 0
                  ? ((totalStats.expenditure / totalStats.budget) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">잔여 예산</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalStats.remaining)}원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="과제명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* 과제별 예산 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  과제명
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  예산
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  집행
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  잔여
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  집행률
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    예산 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((item) => (
                  <tr
                    key={item.project.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/manage/rnds/${item.project.id}?tab=budget`)}
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">
                          {item.project.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {item.project.rnd_orgs?.name || "지원기관 미지정"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.total_budget)}원
                    </td>
                    <td className="px-6 py-4 text-right text-blue-600">
                      {formatCurrency(item.total_expenditure)}원
                    </td>
                    <td className="px-6 py-4 text-right text-orange-600">
                      {formatCurrency(item.remaining)}원
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.execution_rate >= 80
                                ? "bg-green-500"
                                : item.execution_rate >= 50
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                            style={{ width: `${Math.min(item.execution_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.execution_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 비목별 집계 */}
      {filteredProjects.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            비목별 예산 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(RND_BUDGET_CATEGORY_LABELS).map(([category, label]) => {
              const categoryData = filteredProjects.reduce(
                (acc, p) => ({
                  budget: acc.budget + (p.by_category[category]?.budget || 0),
                  expenditure: acc.expenditure + (p.by_category[category]?.expenditure || 0),
                }),
                { budget: 0, expenditure: 0 }
              );

              if (categoryData.budget === 0) return null;

              const rate = categoryData.budget > 0
                ? (categoryData.expenditure / categoryData.budget) * 100
                : 0;

              return (
                <div
                  key={category}
                  className="p-4 border rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(categoryData.budget)}
                  </p>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-500">
                      {rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
