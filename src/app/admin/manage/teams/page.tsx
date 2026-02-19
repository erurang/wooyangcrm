"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";
import type { Department, Team } from "@/types";

// 메뉴 옵션 정의
const MENU_OPTIONS = [
  { id: "dashboard", label: "대시보드" },
  { id: "companies", label: "거래처 관리" },
  { id: "overseas", label: "해외거래처 관리" },
  { id: "documents", label: "문서 관리" },
  { id: "pricing", label: "단가 관리" },
  { id: "production", label: "생산관리" },
  { id: "inventory", label: "재고" },
  { id: "board", label: "게시판" },
  { id: "research", label: "연구실" },
  { id: "management", label: "경영지원" },
];

export default function TeamsManagementPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  // Form states
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMenus, setTeamMenus] = useState<string[]>(["dashboard", "board"]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: "dept" | "team"; id: string; name: string } | null>(null);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        // 기본으로 모든 부서 펼치기
        setExpandedDepts(data.map((d: Department) => d.id));
      }
    } catch (error) {
      console.error("부서 목록 로드 실패:", error);
      toast.error("부서 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeptExpand = (deptId: string) => {
    setExpandedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  // 부서 모달 열기
  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setDeptDescription(dept.description || "");
    } else {
      setEditingDept(null);
      setDeptName("");
      setDeptDescription("");
    }
    setShowDeptModal(true);
  };

  // 팀 모달 열기
  const openTeamModal = (deptId: string, team?: Team) => {
    setSelectedDeptId(deptId);
    if (team) {
      setEditingTeam(team);
      setTeamName(team.name);
      setTeamDescription(team.description || "");
      setTeamMenus(team.allowed_menus || ["dashboard", "board"]);
    } else {
      setEditingTeam(null);
      setTeamName("");
      setTeamDescription("");
      setTeamMenus(["dashboard", "board"]);
    }
    setShowTeamModal(true);
  };

  // 부서 저장
  const handleSaveDept = async () => {
    if (!deptName.trim()) {
      toast.error("부서명을 입력해주세요");
      return;
    }

    setIsSaving(true);
    try {
      const method = editingDept ? "PUT" : "POST";
      const body = editingDept
        ? { id: editingDept.id, name: deptName, description: deptDescription }
        : { name: deptName, description: deptDescription };

      const res = await fetch("/api/admin/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingDept ? "부서가 수정되었습니다" : "부서가 생성되었습니다");
        setShowDeptModal(false);
        loadDepartments();
      } else {
        toast.error(data.error || "저장에 실패했습니다");
      }
    } catch (error) {
      console.error("부서 저장 에러:", error);
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 팀 저장
  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.error("팀명을 입력해주세요");
      return;
    }

    setIsSaving(true);
    try {
      const method = editingTeam ? "PUT" : "POST";
      const body = editingTeam
        ? {
            id: editingTeam.id,
            department_id: selectedDeptId,
            name: teamName,
            description: teamDescription,
            allowed_menus: teamMenus,
          }
        : {
            department_id: selectedDeptId,
            name: teamName,
            description: teamDescription,
            allowed_menus: teamMenus,
          };

      const res = await fetch("/api/admin/teams", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingTeam ? "팀이 수정되었습니다" : "팀이 생성되었습니다");
        setShowTeamModal(false);
        loadDepartments();
      } else {
        toast.error(data.error || "저장에 실패했습니다");
      }
    } catch (error) {
      console.error("팀 저장 에러:", error);
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsSaving(true);
    try {
      const endpoint =
        deleteTarget.type === "dept"
          ? `/api/admin/departments?id=${deleteTarget.id}`
          : `/api/admin/teams?id=${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${deleteTarget.type === "dept" ? "부서" : "팀"}가 삭제되었습니다`);
        setDeleteTarget(null);
        loadDepartments();
      } else {
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("삭제 에러:", error);
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 메뉴 토글
  const toggleMenu = (menuId: string) => {
    setTeamMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 rounded-xl">
              <Building2 className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">부서/팀 관리</h1>
              <p className="text-slate-500">조직 구조 및 메뉴 접근 권한 관리</p>
            </div>
          </div>
          <button
            onClick={() => openDeptModal()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            부서 추가
          </button>
        </div>

        {/* Department List */}
        <div className="space-y-4">
          {departments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">등록된 부서가 없습니다</p>
              <button
                onClick={() => openDeptModal()}
                className="mt-4 text-sky-600 hover:text-sky-700 font-medium"
              >
                첫 부서 추가하기
              </button>
            </div>
          ) : (
            departments.map((dept) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Department Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleDeptExpand(dept.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      {expandedDepts.includes(dept.id) ? (
                        <ChevronDown className="w-5 h-5 text-sky-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-sky-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-slate-500">{dept.description}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {dept.teams?.length || 0}개 팀
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openTeamModal(dept.id)}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="팀 추가"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeptModal(dept)}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "dept", id: dept.id, name: dept.name })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Teams List */}
                <AnimatePresence>
                  {expandedDepts.includes(dept.id) && dept.teams && dept.teams.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-4 pl-14 space-y-2">
                        {dept.teams.map((team: Team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-white rounded border border-slate-200">
                                <Users className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-700">{team.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <LayoutGrid className="w-3 h-3 text-slate-400" />
                                  <p className="text-xs text-slate-500">
                                    {team.allowed_menus?.length || 0}개 메뉴 접근
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openTeamModal(dept.id, team)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                                title="수정"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: "team", id: team.id, name: team.name })}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty Teams */}
                {expandedDepts.includes(dept.id) && (!dept.teams || dept.teams.length === 0) && (
                  <div className="border-t border-slate-100 p-4 pl-14">
                    <p className="text-sm text-slate-400">등록된 팀이 없습니다</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Department Modal */}
      <AnimatePresence>
        {showDeptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowDeptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingDept ? "부서 수정" : "부서 추가"}
                </h3>
                <button
                  onClick={() => setShowDeptModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    부서명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="예: 영업관리"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <input
                    type="text"
                    value={deptDescription}
                    onChange={(e) => setDeptDescription(e.target.value)}
                    placeholder="부서 설명 (선택)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-xl">
                <button
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveDept}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingDept ? "수정" : "추가"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Modal */}
      <AnimatePresence>
        {showTeamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowTeamModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingTeam ? "팀 수정" : "팀 추가"}
                </h3>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    팀명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="예: 호스"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <input
                    type="text"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="팀 설명 (선택)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <LayoutGrid className="w-4 h-4 inline mr-1" />
                    접근 가능 메뉴
                  </label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {MENU_OPTIONS.map((menu) => (
                        <label
                          key={menu.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            teamMenus.includes(menu.id)
                              ? "bg-sky-50 border border-sky-200"
                              : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              teamMenus.includes(menu.id)
                                ? "bg-sky-600 border-sky-600"
                                : "border-slate-300"
                            }`}
                            onClick={() => toggleMenu(menu.id)}
                          >
                            {teamMenus.includes(menu.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700">{menu.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    선택된 메뉴: {teamMenus.length}개
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTeam}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingTeam ? "수정" : "추가"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                  {deleteTarget.type === "dept" ? "부서" : "팀"} 삭제
                </h3>
                <p className="text-slate-600 text-center">
                  <span className="font-medium">&quot;{deleteTarget.name}&quot;</span>을(를) 삭제하시겠습니까?
                  {deleteTarget.type === "dept" && (
                    <span className="block text-sm text-slate-500 mt-1">
                      해당 부서에 팀이 있으면 삭제할 수 없습니다.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 p-4 border-t bg-slate-50 rounded-b-xl">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
