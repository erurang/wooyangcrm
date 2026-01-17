"use client";

import { useState, useRef, useEffect } from "react";
import { X, Users, UserPlus, Search } from "lucide-react";
import useSWR from "swr";
import type { CreateUserTagData } from "@/types/post";

interface User {
  id: string;
  name: string;
  level?: string;
}

interface UserTagSelectorProps {
  selectedTags: CreateUserTagData[];
  onAdd: (tag: CreateUserTagData) => void;
  onRemove: (userId: string) => void;
  excludeUserId?: string; // 작성자 제외
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserTagSelector({
  selectedTags,
  onAdd,
  onRemove,
  excludeUserId,
}: UserTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tagType, setTagType] = useState<"reference" | "coauthor">("reference");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useSWR<User[]>("/api/users/list", fetcher, {
    revalidateOnFocus: false,
  });

  // 이미 선택된 유저와 작성자 제외
  const selectedUserIds = selectedTags.map((t) => t.user_id);
  const filteredUsers = users.filter(
    (user) =>
      !selectedUserIds.includes(user.id) &&
      user.id !== excludeUserId &&
      user.name.toLowerCase().includes(search.toLowerCase())
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onAdd({
      user_id: user.id,
      tag_type: tagType,
    });
    setSearch("");
  };

  const getTagTypeLabel = (type: "reference" | "coauthor") => {
    return type === "reference" ? "참조" : "공동작성";
  };

  const getTagTypeColor = (type: "reference" | "coauthor") => {
    return type === "reference"
      ? "bg-blue-50 text-blue-600 border-blue-200"
      : "bg-purple-50 text-purple-600 border-purple-200";
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {/* 선택된 유저 태그 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => {
            const user = users.find((u) => u.id === tag.user_id);
            return (
              <div
                key={tag.user_id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm ${getTagTypeColor(tag.tag_type)}`}
              >
                <span className="font-medium">{user?.name || "알 수 없음"}</span>
                <span className="text-xs opacity-70">({getTagTypeLabel(tag.tag_type)})</span>
                <button
                  type="button"
                  onClick={() => onRemove(tag.user_id)}
                  className="p-0.5 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 버튼 & 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          유저 태그 추가
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* 태그 타입 선택 */}
            <div className="flex gap-2 p-3 border-b bg-gray-50">
              <button
                type="button"
                onClick={() => setTagType("reference")}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tagType === "reference"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                참조
              </button>
              <button
                type="button"
                onClick={() => setTagType("coauthor")}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tagType === "coauthor"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                공동작성
              </button>
            </div>

            {/* 검색 */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이름 검색..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* 유저 목록 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {search ? "검색 결과가 없습니다." : "모든 유저가 태그되었습니다."}
                </div>
              ) : (
                filteredUsers.slice(0, 10).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.name}</div>
                      {user.level && (
                        <div className="text-xs text-gray-500">{user.level}</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
