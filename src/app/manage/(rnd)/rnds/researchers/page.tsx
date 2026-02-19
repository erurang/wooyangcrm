"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import {
  RND_RESEARCHER_ROLE_LABELS,
  RndResearcher,
  RndProject,
} from "@/types/rnd";

interface ResearcherWithProject extends RndResearcher {
  project?: {
    id: string;
    name: string;
    status: string;
  };
}

export default function RnDResearchersOverviewPage() {
  const router = useRouter();
  const [researchers, setResearchers] = useState<ResearcherWithProject[]>([]);
  const [projects, setProjects] = useState<RndProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("active");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const fetchResearchers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 전체 과제 목록 조회
      const projectsRes = await fetch("/api/manage/rnds");
      const projectsData = await projectsRes.json();
      const projectsList: RndProject[] = projectsData.data || [];
      setProjects(projectsList);

      // 각 과제별 연구원 조회
      const allResearchers: ResearcherWithProject[] = [];

      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const researchersRes = await fetch(`/api/manage/rnds/${project.id}/researchers`);
            const researchersData = await researchersRes.json();
            const projectResearchers = (researchersData.data || []).map((r: RndResearcher) => ({
              ...r,
              project: { id: project.id, name: project.name, status: project.status },
            }));
            allResearchers.push(...projectResearchers);
          } catch {
            // 조회 실패 시 무시
          }
        })
      );

      // 이름순 정렬
      allResearchers.sort((a, b) => a.name.localeCompare(b.name, "ko"));

      setResearchers(allResearchers);
    } catch (err) {
      console.error("Researchers fetch error:", err);
      setError("연구인력 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchers();
  }, []);

  const filteredResearchers = researchers.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.affiliation && r.affiliation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === "all" || r.role === selectedRole;
    const matchesStatus = selectedStatus === "all" ||
      (selectedStatus === "active" ? r.is_active : !r.is_active);
    const matchesProject = selectedProject === "all" || r.rnd_id === selectedProject;
    return matchesSearch && matchesRole && matchesStatus && matchesProject;
  });

  // 역할별 집계
  const roleSummary = {
    principal: researchers.filter((r) => r.role === "principal" && r.is_active).length,
    co_principal: researchers.filter((r) => r.role === "co_principal" && r.is_active).length,
    researcher: researchers.filter((r) => r.role === "researcher" && r.is_active).length,
    assistant: researchers.filter((r) => r.role === "assistant" && r.is_active).length,
    total_active: researchers.filter((r) => r.is_active).length,
    total_inactive: researchers.filter((r) => !r.is_active).length,
  };

  // 총 인건비 계산
  const totalPersonnelCost = filteredResearchers
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + (Number(r.personnel_cost) || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
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
          onClick={fetchResearchers}
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
          <h1 className="text-2xl font-bold text-slate-800">연구인력 현황</h1>
          <p className="text-sm text-slate-400 mt-1">
            과제별 참여연구원 현황 관리
          </p>
        </div>
        <button
          onClick={fetchResearchers}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-sky-500" />
            <span className="text-xs text-slate-400">활동 인원</span>
          </div>
          <p className="text-2xl font-bold text-sky-600">{roleSummary.total_active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-slate-400">책임연구원</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{roleSummary.principal}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-400">공동책임</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{roleSummary.co_principal}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-sky-500" />
            <span className="text-xs text-slate-400">참여연구원</span>
          </div>
          <p className="text-2xl font-bold text-sky-600">{roleSummary.researcher}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">연구보조원</span>
          </div>
          <p className="text-2xl font-bold text-slate-500">{roleSummary.assistant}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-400">종료</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{roleSummary.total_inactive}</p>
        </div>
      </div>

      {/* 인건비 합계 */}
      {totalPersonnelCost > 0 && (
        <div className="bg-gradient-to-r from-sky-50 to-sky-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">활동 인력 총 인건비</p>
              <p className="text-xl font-bold text-sky-700">
                {formatCurrency(totalPersonnelCost)}원
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="이름 또는 소속 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">전체 역할</option>
            {Object.entries(RND_RESEARCHER_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="active">활동중</option>
            <option value="inactive">종료</option>
          </select>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm max-w-xs"
          >
            <option value="all">전체 과제</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 연구원 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  소속
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  과제
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  참여율
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                  인건비
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredResearchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    등록된 연구인력이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredResearchers.map((researcher) => (
                  <tr
                    key={researcher.id}
                    className={`hover:bg-slate-50 cursor-pointer ${!researcher.is_active ? "opacity-60" : ""}`}
                    onClick={() => router.push(`/manage/rnds/${researcher.rnd_id}?tab=researchers`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-500">
                          {researcher.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{researcher.name}</p>
                          {researcher.position && (
                            <p className="text-xs text-slate-400">{researcher.position}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        researcher.role === "principal"
                          ? "bg-purple-100 text-purple-700"
                          : researcher.role === "co_principal"
                          ? "bg-sky-100 text-sky-700"
                          : researcher.role === "researcher"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {researcher.role ? RND_RESEARCHER_ROLE_LABELS[researcher.role] : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {researcher.affiliation || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-xs">
                        {researcher.project?.name || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {researcher.participation_rate !== undefined ? (
                        <span className="text-sm text-slate-500">
                          {researcher.participation_rate}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      {researcher.personnel_cost
                        ? `${formatCurrency(researcher.personnel_cost)}원`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          researcher.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {researcher.is_active ? "활동중" : "종료"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
