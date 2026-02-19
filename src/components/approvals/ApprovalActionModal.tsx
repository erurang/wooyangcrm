"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ApprovalActionModalProps {
  isOpen: boolean;
  actionType: "approve" | "reject" | "delegate" | "withdraw" | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (
    action: "approve" | "reject" | "delegate" | "withdraw",
    data?: {
      comment?: string;
      delegatedTo?: string;
      delegatedReason?: string;
    }
  ) => void;
}

interface User {
  id: string;
  name: string;
  position?: string;
  team?: { name: string };
}

export default function ApprovalActionModal({
  isOpen,
  actionType,
  isLoading,
  onClose,
  onConfirm,
}: ApprovalActionModalProps) {
  const [comment, setComment] = useState("");
  const [delegatedTo, setDelegatedTo] = useState("");
  const [delegatedReason, setDelegatedReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 리셋
  useEffect(() => {
    if (!isOpen) {
      setComment("");
      setDelegatedTo("");
      setDelegatedReason("");
      setSearchTerm("");
      setSelectedUser(null);
    }
  }, [isOpen]);

  // 사용자 검색
  useEffect(() => {
    if (actionType === "delegate" && searchTerm) {
      const searchUsers = async () => {
        const { data } = await supabase
          .from("users")
          .select("id, name, position, team:teams(name)")
          .ilike("name", `%${searchTerm}%`)
          .limit(10);

        // Supabase에서 반환된 데이터를 User 타입으로 변환
        const formattedUsers: User[] = (data || []).map((u: Record<string, unknown>) => {
          const teamData = Array.isArray(u.team) ? u.team[0] : u.team;
          return {
            id: u.id as string,
            name: u.name as string,
            position: u.position as string | undefined,
            team: teamData ? { name: teamData.name as string } : undefined,
          };
        });
        setUsers(formattedUsers);
      };
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [actionType, searchTerm]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setDelegatedTo(user.id);
    setSearchTerm("");
    setUsers([]);
  };

  const handleSubmit = () => {
    if (!actionType) return;

    if (actionType === "reject" && !comment.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    if (actionType === "delegate" && !delegatedTo) {
      alert("위임 대상을 선택해주세요.");
      return;
    }

    onConfirm(actionType, {
      comment: comment || undefined,
      delegatedTo: delegatedTo || undefined,
      delegatedReason: delegatedReason || undefined,
    });
  };

  if (!isOpen || !actionType) return null;

  const config = {
    approve: {
      title: "결재 승인",
      description: "이 결재를 승인하시겠습니까?",
      confirmText: "승인",
      confirmColor: "bg-sky-600 hover:bg-sky-700",
      showComment: true,
      commentRequired: false,
      commentPlaceholder: "결재 의견을 입력할 수 있습니다.",
    },
    reject: {
      title: "결재 반려",
      description: "이 결재를 반려하시겠습니까?",
      confirmText: "반려",
      confirmColor: "bg-red-600 hover:bg-red-700",
      showComment: true,
      commentRequired: true,
      commentPlaceholder: "반려 사유를 입력해주세요. (필수)",
    },
    delegate: {
      title: "결재 위임",
      description: "다른 사람에게 결재를 위임합니다.",
      confirmText: "위임",
      confirmColor: "bg-sky-600 hover:bg-sky-700",
      showComment: false,
      commentRequired: false,
      commentPlaceholder: "",
    },
    withdraw: {
      title: "결재 회수",
      description: "이 결재를 회수하시겠습니까? 회수된 문서는 다시 상신할 수 있습니다.",
      confirmText: "회수",
      confirmColor: "bg-amber-600 hover:bg-amber-700",
      showComment: false,
      commentRequired: false,
      commentPlaceholder: "",
    },
  }[actionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{config.title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4">
          <p className="text-sm text-slate-600 mb-4">{config.description}</p>

          {/* 위임 대상 선택 */}
          {actionType === "delegate" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                위임 대상 <span className="text-red-500">*</span>
              </label>

              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-800">
                      {selectedUser.name}
                    </span>
                    {selectedUser.position && (
                      <span className="text-sm text-slate-500 ml-2">
                        {selectedUser.position}
                      </span>
                    )}
                    {selectedUser.team && (
                      <span className="text-sm text-slate-500">
                        {" "}
                        / {selectedUser.team.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setDelegatedTo("");
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="사원명을 입력하세요"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  {/* 검색 결과 */}
                  {users.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium">{user.name}</span>
                          {user.position && (
                            <span className="text-slate-500 ml-2">
                              {user.position}
                            </span>
                          )}
                          {user.team && (
                            <span className="text-slate-500">
                              {" "}
                              / {user.team.name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 위임 사유 */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  위임 사유
                </label>
                <textarea
                  value={delegatedReason}
                  onChange={(e) => setDelegatedReason(e.target.value)}
                  placeholder="위임 사유를 입력하세요"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* 의견 입력 */}
          {config.showComment && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                결재 의견{" "}
                {config.commentRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={config.commentPlaceholder}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 px-4 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${config.confirmColor}`}
          >
            {isLoading ? "처리 중..." : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
