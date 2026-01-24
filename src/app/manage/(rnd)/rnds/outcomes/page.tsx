"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  FileText,
  Lightbulb,
  BadgeCheck,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Search,
  Plus,
  Filter,
} from "lucide-react";
import {
  RND_OUTCOME_TYPE_LABELS,
  RndOutcomeType,
  RndOutcome,
  RndProject,
} from "@/types/rnd";

interface OutcomeWithProject extends RndOutcome {
  project?: {
    id: string;
    name: string;
  };
}

const OUTCOME_TYPE_ICONS: Record<string, React.ReactNode> = {
  patent_domestic: <Lightbulb className="w-4 h-4" />,
  patent_international: <Lightbulb className="w-4 h-4" />,
  paper_sci: <FileText className="w-4 h-4" />,
  paper_domestic: <FileText className="w-4 h-4" />,
  tech_transfer: <BadgeCheck className="w-4 h-4" />,
  prototype: <Award className="w-4 h-4" />,
  certification: <BadgeCheck className="w-4 h-4" />,
  sales: <Award className="w-4 h-4" />,
  employment: <Award className="w-4 h-4" />,
  other: <Award className="w-4 h-4" />,
};

const STATUS_LABELS = {
  planned: "목표",
  in_progress: "진행중",
  completed: "달성",
};

const STATUS_COLORS = {
  planned: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function RnDOutcomesOverviewPage() {
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<OutcomeWithProject[]>([]);
  const [projects, setProjects] = useState<RndProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const fetchOutcomes = async () => {
    setLoading(true);
    setError(null);
    try {
      // 전체 과제 목록 조회
      const projectsRes = await fetch("/api/manage/rnds");
      const projectsData = await projectsRes.json();
      const projectsList: RndProject[] = projectsData.data || [];
      setProjects(projectsList);

      // 각 과제별 성과물 조회
      const allOutcomes: OutcomeWithProject[] = [];
      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const outcomesRes = await fetch(`/api/manage/rnds/${project.id}/outcomes`);
            const outcomesData = await outcomesRes.json();
            const projectOutcomes = (outcomesData.data || []).map((o: RndOutcome) => ({
              ...o,
              project: { id: project.id, name: project.name },
            }));
            allOutcomes.push(...projectOutcomes);
          } catch {
            // 조회 실패 시 무시
          }
        })
      );

      setOutcomes(allOutcomes);
    } catch (err) {
      console.error("Outcomes fetch error:", err);
      setError("성과물 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, []);

  const filteredOutcomes = outcomes.filter((o) => {
    const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || o.outcome_type === selectedType;
    const matchesStatus = selectedStatus === "all" || o.status === selectedStatus;
    const matchesProject = selectedProject === "all" || o.rnd_id === selectedProject;
    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  // 유형별 집계
  const summaryByType = Object.keys(RND_OUTCOME_TYPE_LABELS).reduce((acc, type) => {
    const typeOutcomes = outcomes.filter((o) => o.outcome_type === type);
    acc[type] = {
      total: typeOutcomes.length,
      completed: typeOutcomes.filter((o) => o.status === "completed").length,
      planned: typeOutcomes.filter((o) => o.status === "planned").length,
    };
    return acc;
  }, {} as Record<string, { total: number; completed: number; planned: number }>);

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
          onClick={fetchOutcomes}
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
          <h1 className="text-2xl font-bold text-gray-900">성과물 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            특허, 논문, 기술이전 등 연구성과 관리
          </p>
        </div>
        <button
          onClick={fetchOutcomes}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 유형별 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { type: "patent_domestic", label: "국내특허", icon: <Lightbulb className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
          { type: "patent_international", label: "해외특허", icon: <Lightbulb className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50" },
          { type: "paper_sci", label: "SCI 논문", icon: <FileText className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
          { type: "paper_domestic", label: "국내논문", icon: <FileText className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
          { type: "tech_transfer", label: "기술이전", icon: <BadgeCheck className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50" },
        ].map(({ type, label, icon, bg }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`p-4 rounded-lg border ${selectedType === type ? "ring-2 ring-blue-500" : ""} ${bg} hover:opacity-80`}
          >
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {summaryByType[type]?.completed || 0}
              </span>
              <span className="text-sm text-gray-500">
                / {summaryByType[type]?.total || 0}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="성과물 제목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">전체 유형</option>
            {Object.entries(RND_OUTCOME_TYPE_LABELS).map(([value, label]) => (
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
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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

      {/* 성과물 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  과제
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  목표연도
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOutcomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    등록된 성과물이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOutcomes.map((outcome) => (
                  <tr
                    key={outcome.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/manage/rnds/${outcome.rnd_id}?tab=outcomes`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {OUTCOME_TYPE_ICONS[outcome.outcome_type]}
                        <span className="text-sm text-gray-700">
                          {RND_OUTCOME_TYPE_LABELS[outcome.outcome_type]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {outcome.title}
                      </p>
                      {outcome.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {outcome.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 truncate max-w-xs">
                        {outcome.project?.name || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {outcome.target_year || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          STATUS_COLORS[outcome.status]
                        }`}
                      >
                        {STATUS_LABELS[outcome.status]}
                      </span>
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
    </div>
  );
}
