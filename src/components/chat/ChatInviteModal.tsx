"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import type { User } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ChatInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentUserId: string;
  existingParticipantIds: string[];
  onInvite: (userIds: string[]) => Promise<void>;
}

export default function ChatInviteModal({
  isOpen,
  onClose,
  roomId,
  currentUserId,
  existingParticipantIds,
  onInvite,
}: ChatInviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // 사용자 목록 조회
  const { data: users = [] } = useSWR<User[]>(
    isOpen ? "/api/users" : null,
    fetcher
  );

  // 검색 및 필터링 (자신과 기존 참여자 제외)
  const filteredUsers = useMemo(() => {
    const excludeIds = new Set([currentUserId, ...existingParticipantIds]);
    return users
      .filter((user) => !excludeIds.has(user.id))
      .filter(
        (user) =>
          !searchQuery ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, currentUserId, existingParticipantIds, searchQuery]);

  // 사용자 선택/해제
  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  // 초대하기
  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setIsInviting(true);
    try {
      await onInvite(selectedUsers.map((u) => u.id));
      handleClose();
    } finally {
      setIsInviting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSearchQuery("");
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* 모달 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">참여자 초대</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 선택된 사용자 */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-400 mb-2">
              선택된 참여자 ({selectedUsers.length}명)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm"
                >
                  {user.name}
                  <button
                    onClick={() => toggleUser(user)}
                    className="ml-1 hover:text-sky-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 직책으로 검색..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              초대할 수 있는 사용자가 없습니다
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 ${
                    isSelected ? "bg-sky-50" : ""
                  }`}
                >
                  <div className="relative">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.slice(0, 2)}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-sm text-slate-400">{user.position}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 초대 버튼 */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || isInviting}
            className="w-full py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isInviting
              ? "초대 중..."
              : selectedUsers.length === 0
              ? "참여자를 선택하세요"
              : `${selectedUsers.length}명 초대하기`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
