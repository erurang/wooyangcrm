"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Edit,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Building,
  Package,
  Settings,
  Database,
  Activity,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "companies",
    name: "거래처 관리",
    icon: Building,
    permissions: [
      { id: "companies.view", name: "조회", description: "거래처 목록 조회" },
      { id: "companies.create", name: "생성", description: "거래처 등록" },
      { id: "companies.edit", name: "수정", description: "거래처 정보 수정" },
      { id: "companies.delete", name: "삭제", description: "거래처 삭제" },
    ],
  },
  {
    id: "documents",
    name: "문서 관리",
    icon: FileText,
    permissions: [
      { id: "documents.view", name: "조회", description: "문서 목록 조회" },
      { id: "documents.create", name: "생성", description: "문서 생성" },
      { id: "documents.edit", name: "수정", description: "문서 수정" },
      { id: "documents.delete", name: "삭제", description: "문서 삭제" },
      { id: "documents.approve", name: "승인", description: "문서 승인" },
    ],
  },
  {
    id: "inventory",
    name: "재고 관리",
    icon: Package,
    permissions: [
      { id: "inventory.view", name: "조회", description: "재고 현황 조회" },
      { id: "inventory.manage", name: "관리", description: "입출고 관리" },
    ],
  },
  {
    id: "reports",
    name: "리포트",
    icon: Activity,
    permissions: [
      { id: "reports.view", name: "조회", description: "리포트 조회" },
      { id: "reports.export", name: "내보내기", description: "리포트 내보내기" },
    ],
  },
  {
    id: "users",
    name: "사용자 관리",
    icon: Users,
    permissions: [
      { id: "users.view", name: "조회", description: "사용자 목록 조회" },
      { id: "users.create", name: "생성", description: "사용자 등록" },
      { id: "users.edit", name: "수정", description: "사용자 정보 수정" },
      { id: "users.delete", name: "삭제", description: "사용자 삭제" },
    ],
  },
  {
    id: "system",
    name: "시스템 설정",
    icon: Settings,
    permissions: [
      { id: "system.settings", name: "설정", description: "시스템 설정 관리" },
      { id: "system.backup", name: "백업", description: "백업/복원 관리" },
      { id: "system.logs", name: "로그", description: "시스템 로그 조회" },
    ],
  },
];

export default function AdminRolesPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadRoles = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRoles([
        {
          id: "admin",
          name: "관리자",
          description: "시스템 전체 접근 권한",
          userCount: 2,
          permissions: PERMISSION_GROUPS.flatMap((g) =>
            g.permissions.map((p) => p.id)
          ),
          isSystem: true,
        },
        {
          id: "sales",
          name: "영업",
          description: "거래처 및 문서 관리 권한",
          userCount: 8,
          permissions: [
            "companies.view",
            "companies.create",
            "companies.edit",
            "documents.view",
            "documents.create",
            "documents.edit",
            "inventory.view",
            "reports.view",
          ],
          isSystem: true,
        },
        {
          id: "research",
          name: "연구실",
          description: "R&D 및 지원기관 관리 권한",
          userCount: 3,
          permissions: [
            "companies.view",
            "documents.view",
            "documents.create",
            "reports.view",
          ],
          isSystem: true,
        },
        {
          id: "managementSupport",
          name: "경영지원",
          description: "경영 리포트 및 분석 권한",
          userCount: 2,
          permissions: [
            "companies.view",
            "documents.view",
            "inventory.view",
            "reports.view",
            "reports.export",
            "users.view",
          ],
          isSystem: true,
        },
      ]);

      setIsLoading(false);
    };

    loadRoles();
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setEditedPermissions(role.permissions);
    setEditMode(false);
    setExpandedGroups(PERMISSION_GROUPS.map((g) => g.id));
  };

  const handleTogglePermission = (permissionId: string) => {
    if (!editMode) return;
    setEditedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    await new Promise((resolve) => setTimeout(resolve, 500));

    setRoles(
      roles.map((r) =>
        r.id === selectedRole.id ? { ...r, permissions: editedPermissions } : r
      )
    );
    setSelectedRole({ ...selectedRole, permissions: editedPermissions });
    setEditMode(false);
    toast.success("권한이 저장되었습니다.");
  };

  const handleCancel = () => {
    if (selectedRole) {
      setEditedPermissions(selectedRole.permissions);
    }
    setEditMode(false);
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-96 bg-slate-200 rounded-xl"></div>
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Shield className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">권한 관리</h1>
            <p className="text-slate-500">역할별 접근 권한을 설정합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">역할 목록</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    selectedRole?.id === role.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{role.name}</p>
                      <p className="text-sm text-slate-500">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {role.userCount}명
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Permission Editor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            {selectedRole ? (
              <>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      {selectedRole.name} 권한 설정
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedRole.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1.5 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          취소
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          저장
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        disabled={selectedRole.isSystem && selectedRole.id === "admin"}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {PERMISSION_GROUPS.map((group) => {
                    const isExpanded = expandedGroups.includes(group.id);
                    const groupPermissionIds = group.permissions.map((p) => p.id);
                    const hasAllPermissions = groupPermissionIds.every((id) =>
                      editedPermissions.includes(id)
                    );
                    const hasSomePermissions = groupPermissionIds.some((id) =>
                      editedPermissions.includes(id)
                    );

                    return (
                      <div
                        key={group.id}
                        className="border border-slate-200 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => handleToggleGroup(group.id)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <group.icon className="w-5 h-5 text-slate-500" />
                            <span className="font-medium text-slate-700">
                              {group.name}
                            </span>
                            {hasAllPermissions && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                전체 권한
                              </span>
                            )}
                            {!hasAllPermissions && hasSomePermissions && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                일부 권한
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-3 space-y-2">
                            {group.permissions.map((permission) => {
                              const isChecked = editedPermissions.includes(
                                permission.id
                              );
                              return (
                                <label
                                  key={permission.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    editMode
                                      ? "hover:bg-slate-50"
                                      : "cursor-default"
                                  } ${isChecked ? "bg-blue-50" : ""}`}
                                >
                                  <div
                                    onClick={() =>
                                      handleTogglePermission(permission.id)
                                    }
                                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                                      isChecked
                                        ? "bg-blue-500 border-blue-500"
                                        : "border-slate-300"
                                    } ${
                                      editMode
                                        ? "cursor-pointer"
                                        : "cursor-default"
                                    }`}
                                  >
                                    {isChecked && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {permission.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {permission.description}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  역할을 선택하여 권한을 확인하세요
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
