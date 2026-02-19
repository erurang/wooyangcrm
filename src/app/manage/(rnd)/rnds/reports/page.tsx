"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileStack,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";
import {
  RND_REPORT_TYPE_LABELS,
  RndReportType,
  RndReport,
  RndProject,
} from "@/types/rnd";

interface ReportWithProject extends RndReport {
  project?: {
    id: string;
    name: string;
  };
  days_until_due?: number;
}

const REPORT_STATUS_LABELS = {
  draft: "작성중",
  submitted: "제출완료",
  approved: "승인",
  revision_required: "수정요청",
};

const REPORT_STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-sky-100 text-sky-700",
  approved: "bg-green-100 text-green-700",
  revision_required: "bg-red-100 text-red-700",
};

export default function RnDReportsOverviewPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportWithProject[]>([]);
  const [projects, setProjects] = useState<RndProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // 전체 과제 목록 조회
      const projectsRes = await fetch("/api/manage/rnds");
      const projectsData = await projectsRes.json();
      const projectsList: RndProject[] = projectsData.data || [];
      setProjects(projectsList);

      // 각 과제별 보고서 조회
      const allReports: ReportWithProject[] = [];
      const now = new Date();

      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const reportsRes = await fetch(`/api/manage/rnds/${project.id}/reports`);
            const reportsData = await reportsRes.json();
            const projectReports = (reportsData.data || []).map((r: RndReport) => {
              let daysUntilDue: number | undefined;
              if (r.due_date && r.status !== "submitted" && r.status !== "approved") {
                const dueDate = new Date(r.due_date);
                daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              }
              return {
                ...r,
                project: { id: project.id, name: project.name },
                days_until_due: daysUntilDue,
              };
            });
            allReports.push(...projectReports);
          } catch {
            // 조회 실패 시 무시
          }
        })
      );

      // 마감일 순 정렬
      allReports.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setReports(allReports);
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError("보고서 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || r.report_type === selectedType;
    const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
    const matchesProject = selectedProject === "all" || r.rnd_id === selectedProject;
    const matchesUpcoming = !showUpcomingOnly || (r.days_until_due !== undefined && r.days_until_due > 0 && r.days_until_due <= 30);
    return matchesSearch && matchesType && matchesStatus && matchesProject && matchesUpcoming;
  });

  // 상태별 집계
  const statusSummary = {
    total: reports.length,
    draft: reports.filter((r) => r.status === "draft").length,
    submitted: reports.filter((r) => r.status === "submitted").length,
    approved: reports.filter((r) => r.status === "approved").length,
    revision_required: reports.filter((r) => r.status === "revision_required").length,
    upcoming: reports.filter((r) => r.days_until_due !== undefined && r.days_until_due > 0 && r.days_until_due <= 30).length,
    overdue: reports.filter((r) => r.days_until_due !== undefined && r.days_until_due < 0).length,
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
          onClick={fetchReports}
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
          <h1 className="text-2xl font-bold text-slate-800">보고서 일정</h1>
          <p className="text-sm text-slate-400 mt-1">
            중간보고서, 연차보고서, 최종보고서 등 제출 일정 관리
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileStack className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">전체</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{statusSummary.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">작성중</span>
          </div>
          <p className="text-2xl font-bold text-slate-600">{statusSummary.draft}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-sky-500" />
            <span className="text-xs text-slate-400">제출완료</span>
          </div>
          <p className="text-2xl font-bold text-sky-600">{statusSummary.submitted}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-400">승인</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{statusSummary.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-400">수정요청</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{statusSummary.revision_required}</p>
        </div>
        <button
          onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
          className={`rounded-lg shadow p-4 text-left ${showUpcomingOnly ? "bg-orange-50 ring-2 ring-orange-500" : "bg-white"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-slate-400">30일 이내</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{statusSummary.upcoming}</p>
        </button>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-400">마감초과</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{statusSummary.overdue}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="보고서 제목 검색..."
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
            {Object.entries(RND_REPORT_TYPE_LABELS).map(([value, label]) => (
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
            {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
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

      {/* 보고서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  과제
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  연도
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  마감일
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
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    등록된 보고서가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-slate-50 cursor-pointer ${
                      report.days_until_due !== undefined && report.days_until_due < 0
                        ? "bg-red-50"
                        : report.days_until_due !== undefined && report.days_until_due <= 7
                        ? "bg-orange-50"
                        : ""
                    }`}
                    onClick={() => router.push(`/manage/rnds/${report.rnd_id}?tab=reports`)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {RND_REPORT_TYPE_LABELS[report.report_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 truncate max-w-xs">
                        {report.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 truncate max-w-xs">
                        {report.project?.name || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500">
                      {report.year || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-slate-500">
                          {report.due_date || "-"}
                        </span>
                        {report.days_until_due !== undefined && (
                          <span
                            className={`text-xs ${
                              report.days_until_due < 0
                                ? "text-red-600 font-medium"
                                : report.days_until_due <= 7
                                ? "text-orange-600 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            {report.days_until_due < 0
                              ? `${Math.abs(report.days_until_due)}일 초과`
                              : `D-${report.days_until_due}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          REPORT_STATUS_COLORS[report.status]
                        }`}
                      >
                        {REPORT_STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {report.file_url && (
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-600 hover:text-sky-800"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
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
