"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Activity,
  Search,
  Lock,
  Unlock,
  UserCheck,
  UserX,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";
import { supabase } from "@/lib/supabaseClient";

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
  id: number;
  role_name: string;
}

interface RolePermissions {
  [permissionKey: string]: boolean;
}

interface User {
  id: string;
  name: string;
  level: string;
  position: string;
  email: string;
  is_locked: boolean;
  mobile: string;
  role_id: number;
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

  // Tab state
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  // Roles/Permissions state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, level, position, email, is_locked, mobile, role_id")
        .order("name");

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, role_name")
        .order("id");

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // User Management Functions
  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditedUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedUser({});
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          level: editedUser.level,
          position: editedUser.position,
          email: editedUser.email,
          mobile: editedUser.mobile,
          role_id: editedUser.role_id,
          is_locked: editedUser.is_locked,
        })
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, ...editedUser } as User : u));
      setEditingUserId(null);
      setEditedUser({});
      toast.success("사용자 정보가 저장되었습니다.");
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleToggleLock = async (user: User) => {
    try {
      const newLockedState = !user.is_locked;
      const { error } = await supabase
        .from("users")
        .update({ is_locked: newLockedState })
        .eq("id", user.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? { ...u, is_locked: newLockedState } : u));
      toast.success(`사용자가 ${newLockedState ? "잠금" : "잠금 해제"} 되었습니다.`);
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("잠금 상태 변경에 실패했습니다.");
    }
  };

  // Role Management Functions
  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    setExpandedGroups(PERMISSION_GROUPS.map(g => g.id));
    // Filter users by role
    const filteredUsers = users.filter(u => u.role_id === role.id);
    setRoleUsers(filteredUsers);

    // Fetch permissions for this role
    try {
      const response = await fetch(`/api/admin/permissions?roleId=${role.id}`);
      const data = await response.json();

      if (response.ok && data.permissions) {
        const permMap: RolePermissions = {};
        data.permissions.forEach((p: { permission_key: string; is_enabled: boolean }) => {
          permMap[p.permission_key] = p.is_enabled;
        });
        setRolePermissions(permMap);
      } else {
        // 권한이 없으면 admin은 모두 활성화, 나머지는 기본값 설정
        const defaultPerms: RolePermissions = {};
        PERMISSION_GROUPS.forEach(group => {
          group.permissions.forEach(p => {
            defaultPerms[p.id] = role.role_name === "admin";
          });
        });
        setRolePermissions(defaultPerms);
      }
    } catch (error) {
      console.error("권한 조회 실패:", error);
      // 에러 시 기본값 설정
      const defaultPerms: RolePermissions = {};
      PERMISSION_GROUPS.forEach(group => {
        group.permissions.forEach(p => {
          defaultPerms[p.id] = role.role_name === "admin";
        });
      });
      setRolePermissions(defaultPerms);
    }
  };

  const handleTogglePermission = async (permissionKey: string) => {
    if (!selectedRole) return;

    const newValue = !rolePermissions[permissionKey];

    // Optimistic update
    setRolePermissions(prev => ({
      ...prev,
      [permissionKey]: newValue,
    }));

    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissionKey,
          isEnabled: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error("권한 업데이트 실패");
      }

      toast.success(`권한이 ${newValue ? "활성화" : "비활성화"} 되었습니다.`);
    } catch (error) {
      // 롤백
      setRolePermissions(prev => ({
        ...prev,
        [permissionKey]: !newValue,
      }));
      console.error("권한 업데이트 실패:", error);
      toast.error("권한 변경에 실패했습니다.");
    }
  };

  const handleToggleAllPermissions = async (groupId: string, enabled: boolean) => {
    if (!selectedRole) return;

    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    // Optimistic update
    const updates: RolePermissions = {};
    group.permissions.forEach(p => {
      updates[p.id] = enabled;
    });

    setRolePermissions(prev => ({
      ...prev,
      ...updates,
    }));

    try {
      // 각 권한을 개별 업데이트
      for (const perm of group.permissions) {
        await fetch("/api/admin/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: selectedRole.id,
            permissionKey: perm.id,
            isEnabled: enabled,
          }),
        });
      }

      toast.success(`${group.name} 권한이 ${enabled ? "모두 활성화" : "모두 비활성화"} 되었습니다.`);
    } catch (error) {
      console.error("권한 일괄 업데이트 실패:", error);
      toast.error("권한 변경에 실패했습니다.");
    }
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role?.role_name || "알 수 없음";
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "sales":
        return "bg-blue-100 text-blue-700";
      case "research":
        return "bg-green-100 text-green-700";
      case "managementSupport":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-xl">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">직원 및 권한 관리</h1>
              <p className="text-slate-500">직원 정보 수정 및 역할별 권한을 설정합니다</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-violet-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            직원 관리
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "roles"
                ? "bg-violet-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            권한 관리
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "users" ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Search & Stats */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="이름, 이메일, 부서로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    활성: {users.filter(u => !u.is_locked).length}명
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserX className="w-4 h-4 text-red-500" />
                    잠금: {users.filter(u => u.is_locked).length}명
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">이름</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">역할</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">레벨</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">부서</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">이메일</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">전화번호</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">상태</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => {
                        const isEditing = editingUserId === user.id;
                        const roleName = getRoleName(user.role_id);

                        return (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  user.is_locked ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600"
                                }`}>
                                  {user.name?.charAt(0) || "?"}
                                </div>
                                <span className="font-medium text-slate-800">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={editedUser.role_id}
                                  onChange={(e) => setEditedUser({ ...editedUser, role_id: Number(e.target.value) })}
                                  className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                >
                                  {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.role_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(roleName)}`}>
                                  {roleName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedUser.level || ""}
                                  onChange={(e) => setEditedUser({ ...editedUser, level: e.target.value })}
                                  className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                              ) : (
                                <span className="text-slate-600">{user.level}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedUser.position || ""}
                                  onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                                  className="w-24 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                              ) : (
                                <span className="text-slate-600">{user.position}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editedUser.email || ""}
                                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                                  className="w-40 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                              ) : (
                                <span className="text-slate-600">{user.email}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedUser.mobile || ""}
                                  onChange={(e) => setEditedUser({ ...editedUser, mobile: e.target.value })}
                                  className="w-32 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                              ) : (
                                <span className="text-slate-600">{user.mobile}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleLock(user)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  user.is_locked
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                }`}
                              >
                                {user.is_locked ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    잠금
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    활성
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveUser(user.id)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Role List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">역할 목록</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {roles.map((role) => {
                    const userCount = users.filter(u => u.role_id === role.id).length;
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                          selectedRole?.id === role.id ? "bg-violet-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-800">{role.role_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                              {userCount}명
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Details */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
                {selectedRole ? (
                  <>
                    <div className="p-4 border-b border-slate-200">
                      <h2 className="font-semibold text-slate-800">
                        {selectedRole.role_name} 역할 정보
                      </h2>
                    </div>

                    {/* Users in this role */}
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-600 mb-3">소속 직원</h3>
                      {roleUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {roleUsers.map(user => (
                            <div
                              key={user.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full"
                            >
                              <div className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-medium">
                                {user.name?.charAt(0) || "?"}
                              </div>
                              <span className="text-sm text-slate-700">{user.name}</span>
                              <span className="text-xs text-slate-500">{user.level}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">이 역할에 소속된 직원이 없습니다.</p>
                      )}
                    </div>

                    {/* Permissions */}
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-600">권한 목록</h3>
                        <span className="text-xs text-slate-400">
                          체크박스를 클릭하여 권한을 설정하세요
                        </span>
                      </div>
                      {PERMISSION_GROUPS.map((group) => {
                        const isExpanded = expandedGroups.includes(group.id);
                        const groupPermissions = group.permissions.map(p => rolePermissions[p.id] ?? false);
                        const allEnabled = groupPermissions.every(p => p);
                        const someEnabled = groupPermissions.some(p => p) && !allEnabled;

                        return (
                          <div
                            key={group.id}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                          >
                            <div className="flex items-center justify-between p-3 bg-slate-50">
                              <button
                                onClick={() => handleToggleGroup(group.id)}
                                className="flex items-center gap-3 flex-1 hover:bg-slate-100 transition-colors -m-3 p-3 rounded-l-xl"
                              >
                                <group.icon className="w-5 h-5 text-slate-500" />
                                <span className="font-medium text-slate-700">
                                  {group.name}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">
                                  ({groupPermissions.filter(p => p).length}/{group.permissions.length})
                                </span>
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleAllPermissions(group.id, !allEnabled)}
                                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                    allEnabled
                                      ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                      : someEnabled
                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {allEnabled ? "모두 해제" : "모두 선택"}
                                </button>
                                <button
                                  onClick={() => handleToggleGroup(group.id)}
                                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="p-3 space-y-2">
                                {group.permissions.map((permission) => {
                                  const isEnabled = rolePermissions[permission.id] ?? false;
                                  return (
                                    <label
                                      key={permission.id}
                                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                        isEnabled ? "bg-violet-50" : "bg-slate-50 hover:bg-slate-100"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleTogglePermission(permission.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700">
                                          {permission.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {permission.description}
                                        </p>
                                      </div>
                                      {isEnabled && (
                                        <Check className="w-4 h-4 text-violet-500" />
                                      )}
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
                      역할을 선택하여 상세 정보를 확인하세요
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
