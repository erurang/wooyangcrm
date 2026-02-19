"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  TrendingUp,
  Wallet,
  Award,
  AlertCircle,
  Calendar,
  Users,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  RND_STATUS_LABELS,
  RND_STATUS_COLORS,
  RndProjectStatus,
} from "@/types/rnd";

interface DashboardStats {
  total_projects: number;
  by_status: Record<RndProjectStatus, number>;
  total_budget: number;
  total_expenditure: number;
  budget_execution_rate: number;
  outcome_count: number;
  researcher_count: number;
  upcoming_deadlines: {
    id: string;
    name: string;
    deadline_type: string;
    deadline_date: string;
    days_until: number;
  }[];
  recent_projects: {
    id: string;
    name: string;
    status: RndProjectStatus;
    org_name?: string;
    end_date?: string;
  }[];
}

export default function RnDDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 과제 목록 조회
      const projectsRes = await fetch("/api/manage/rnds");
      const projectsData = await projectsRes.json();
      const projects = projectsData.data || [];

      // 상태별 집계
      const byStatus: Record<string, number> = {};
      let totalBudget = 0;

      projects.forEach((project: {
        status: RndProjectStatus;
        gov_contribution?: string | number;
        pri_contribution?: string | number;
      }) => {
        byStatus[project.status] = (byStatus[project.status] || 0) + 1;
        totalBudget += Number(project.gov_contribution || 0) + Number(project.pri_contribution || 0);
      });

      // 마감 임박 과제 (종료일 기준)
      const now = new Date();
      const upcomingDeadlines = projects
        .filter((p: { end_date?: string; status: RndProjectStatus }) => p.end_date && p.status === "ongoing")
        .map((p: { id: string; name: string; end_date: string }) => {
          const endDate = new Date(p.end_date);
          const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: p.id,
            name: p.name,
            deadline_type: "종료일",
            deadline_date: p.end_date,
            days_until: daysUntil,
          };
        })
        .filter((d: { days_until: number }) => d.days_until > 0 && d.days_until <= 90)
        .sort((a: { days_until: number }, b: { days_until: number }) => a.days_until - b.days_until)
        .slice(0, 5);

      // 최근 과제
      const recentProjects = projects.slice(0, 5).map((p: {
        id: string;
        name: string;
        status: RndProjectStatus;
        rnd_orgs?: { name?: string };
        end_date?: string;
      }) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        org_name: p.rnd_orgs?.name,
        end_date: p.end_date,
      }));

      setStats({
        total_projects: projects.length,
        by_status: byStatus as Record<RndProjectStatus, number>,
        total_budget: totalBudget,
        total_expenditure: 0, // TODO: 집행현황 조회 필요
        budget_execution_rate: 0,
        outcome_count: 0, // TODO: 성과물 수 조회 필요
        researcher_count: 0, // TODO: 연구인력 수 조회 필요
        upcoming_deadlines: upcomingDeadlines,
        recent_projects: recentProjects,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("대시보드 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-500">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
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
          <h1 className="text-2xl font-bold text-slate-800">국가과제 R&D 현황</h1>
          <p className="text-sm text-slate-400 mt-1">
            기업부설연구소 국가과제 관리 대시보드
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">전체 과제</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.total_projects || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-sky-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-600">
              {stats?.by_status?.ongoing || 0} 수행중
            </span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-400">
              {stats?.by_status?.completed || 0} 완료
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">총 연구비</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(stats?.total_budget || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">
              집행률: {(stats?.budget_execution_rate || 0).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">연구성과</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.outcome_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">특허, 논문, 기술이전 등</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">참여연구원</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats?.researcher_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">현재 활동 중</span>
          </div>
        </div>
      </div>

      {/* 상태별 과제 현황 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          상태별 과제 현황
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {(Object.keys(RND_STATUS_LABELS) as RndProjectStatus[]).map((status) => {
            const count = stats?.by_status?.[status] || 0;
            const colors = RND_STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => router.push(`/manage/rnds?status=${status}`)}
                className={`p-3 rounded-lg text-center hover:opacity-80 transition-opacity ${colors.bg}`}
              >
                <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                <p className={`text-xs mt-1 ${colors.text}`}>
                  {RND_STATUS_LABELS[status]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 마감 임박 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              마감 임박
            </h2>
          </div>
          {stats?.upcoming_deadlines?.length ? (
            <div className="space-y-3">
              {stats.upcoming_deadlines.map((deadline) => (
                <button
                  key={deadline.id}
                  onClick={() => router.push(`/manage/rnds/${deadline.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-slate-800 line-clamp-1">
                      {deadline.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {deadline.deadline_type}: {deadline.deadline_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        deadline.days_until <= 7
                          ? "text-red-600"
                          : deadline.days_until <= 30
                          ? "text-orange-600"
                          : "text-slate-500"
                      }`}
                    >
                      D-{deadline.days_until}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">
              마감 임박 과제가 없습니다.
            </p>
          )}
        </div>

        {/* 최근 과제 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              최근 과제
            </h2>
            <button
              onClick={() => router.push("/manage/rnds")}
              className="text-sm text-sky-600 hover:underline"
            >
              전체보기
            </button>
          </div>
          {stats?.recent_projects?.length ? (
            <div className="space-y-3">
              {stats.recent_projects.map((project) => {
                const colors = RND_STATUS_COLORS[project.status];
                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/manage/rnds/${project.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {project.name}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {project.org_name || "지원기관 미지정"}
                      </p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded ${colors.bg} ${colors.text}`}
                    >
                      {RND_STATUS_LABELS[project.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">
              등록된 과제가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
