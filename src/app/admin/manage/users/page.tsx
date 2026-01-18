"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type User = {
  id: string;
  name: string;
  level: string;
  position: string;
  email: string;
  is_locked: boolean;
  mobile: string;
  role_id: number;
};

type Role = {
  id: number;
  role_name: string;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);
  const [editedUsers, setEditedUsers] = useState<Record<string, Partial<User>>>(
    {}
  );

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, level, position, email, is_locked, mobile, role_id")
        .range(
          (currentPage - 1) * usersPerPage,
          currentPage * usersPerPage - 1
        );
      if (error) console.error("Error fetching users:", error);
      else setUsers(data);
    };

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, role_name");
      if (error) console.error("Error fetching roles:", error);
      else setRoles(data);
    };

    fetchUsers();
    fetchRoles();
  }, [currentPage]);

  const handleInputChange = (id: string, field: keyof User, value: any) => {
    setEditedUsers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (id: string) => {
    if (!editedUsers[id]) return;

    const { error } = await supabase
      .from("users")
      .update(editedUsers[id])
      .eq("id", id);
    if (error) {
      console.error("Error updating user:", error);
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, ...editedUsers[id] } : user
      )
    );
    setEditedUsers((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginationNumbers = () => {
    const numbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        numbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        numbers.push("...");
      }
    }
    return numbers;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      <div className="p-4">
        <h1 className="text-lg font-bold text-slate-800 mb-4">직원 관리</h1>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-center">
                <th className="px-4 py-3 text-xs font-medium text-slate-500">이름</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">역할</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">레벨</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">부서</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">이메일</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">잠금</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">전화번호</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 text-center transition-colors">
                  <td className="px-4 py-3 text-slate-700">{user.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={editedUsers[user.id]?.role_id ?? user.role_id}
                      onChange={(e) =>
                        handleInputChange(
                          user.id,
                          "role_id",
                          Number(e.target.value)
                        )
                      }
                      className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editedUsers[user.id]?.level ?? user.level}
                      onChange={(e) =>
                        handleInputChange(user.id, "level", e.target.value)
                      }
                      className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editedUsers[user.id]?.position ?? user.position}
                      onChange={(e) =>
                        handleInputChange(user.id, "position", e.target.value)
                      }
                      className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editedUsers[user.id]?.email ?? user.email}
                      onChange={(e) =>
                        handleInputChange(user.id, "email", e.target.value)
                      }
                      className="w-40 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={editedUsers[user.id]?.is_locked ?? user.is_locked}
                      onChange={(e) =>
                        handleInputChange(user.id, "is_locked", e.target.checked)
                      }
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editedUsers[user.id]?.mobile ?? user.mobile}
                      onChange={(e) =>
                        handleInputChange(user.id, "mobile", e.target.value)
                      }
                      className="w-28 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <motion.button
                      onClick={() => handleSave(user.id)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      저장
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              이전
            </button>
            {paginationNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-slate-400">
                  ...
                </span>
              )
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
