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
    <div className="text-sm text-[#37352F]">
      <h1 className="mb-4 font-semibold">직원 관리</h1>

      {/* 테이블 */}
      <div className="bg-[#FBFBFB] rounded-md border">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="px-4 py-2 border-b border-r">이름</th>
              <th className="px-4 py-2 border-b border-r">역할</th>
              <th className="px-4 py-2 border-b border-r">레벨</th>
              <th className="px-4 py-2 border-b border-r">부서</th>
              <th className="px-4 py-2 border-b border-r">이메일</th>
              <th className="px-4 py-2 border-b border-r">잠금</th>
              <th className="px-4 py-2 border-b border-r">전화번호</th>
              <th className="px-4 py-2 border-b">저장</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-100 text-center">
                <td className="px-4 py-2 border-b border-r">{user.name}</td>
                <td className="px-4 py-2 border-b border-r">
                  <select
                    value={editedUsers[user.id]?.role_id ?? user.role_id}
                    onChange={(e) =>
                      handleInputChange(
                        user.id,
                        "role_id",
                        Number(e.target.value)
                      )
                    }
                    className="p-1 border rounded-md"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 border-b border-r">
                  <input
                    type="text"
                    value={editedUsers[user.id]?.level ?? user.level}
                    onChange={(e) =>
                      handleInputChange(user.id, "level", e.target.value)
                    }
                    className="p-1 border rounded-md text-center"
                  />
                </td>
                <td className="px-4 py-2 border-b border-r">
                  <input
                    type="text"
                    value={editedUsers[user.id]?.position ?? user.position}
                    onChange={(e) =>
                      handleInputChange(user.id, "position", e.target.value)
                    }
                    className="p-1 border rounded-md text-center"
                  />
                </td>
                <td className="px-4 py-2 border-b border-r">
                  <input
                    type="text"
                    value={editedUsers[user.id]?.email ?? user.email}
                    onChange={(e) =>
                      handleInputChange(user.id, "email", e.target.value)
                    }
                    className="p-1 border rounded-md text-center"
                  />
                </td>
                <td className="px-4 py-2 border-b border-r">
                  <input
                    type="checkbox"
                    checked={editedUsers[user.id]?.is_locked ?? user.is_locked}
                    onChange={(e) =>
                      handleInputChange(user.id, "is_locked", e.target.checked)
                    }
                  />
                </td>
                <td className="px-4 py-2 border-b border-r">
                  <input
                    type="text"
                    value={editedUsers[user.id]?.mobile ?? user.mobile}
                    onChange={(e) =>
                      handleInputChange(user.id, "mobile", e.target.value)
                    }
                    className="p-1 border rounded-md text-center"
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <motion.button
                    onClick={() => handleSave(user.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          이전
        </button>
        {paginationNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2">
              ...
            </span>
          )
        )}
      </div>
    </div>
  );
}
