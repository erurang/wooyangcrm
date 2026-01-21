"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import type { User } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreateRoom: (params: {
    type: "direct" | "group";
    name?: string;
    participant_ids: string[];
  }) => Promise<void>;
}

export default function NewChatModal({
  isOpen,
  onClose,
  currentUserId,
  onCreateRoom,
}: NewChatModalProps) {
  const [step, setStep] = useState<"select" | "group">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 사용자 목록 조회
  const { data: usersData } = useSWR<{ users: User[] }>(
    isOpen ? "/api/users" : null,
    fetcher
  );

  const users = usersData?.users || [];

  // 검색 필터링 (자신 제외)
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => user.id !== currentUserId)
      .filter(
        (user) =>
          !searchQuery ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, currentUserId, searchQuery]);

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

  // 1:1 대화 시작
  const startDirectChat = async (user: User) => {
    setIsCreating(true);
    try {
      await onCreateRoom({
        type: "direct",
        participant_ids: [user.id],
      });
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  // 그룹 채팅 생성
  const createGroupChat = async () => {
    if (selectedUsers.length < 2) return;

    setIsCreating(true);
    try {
      await onCreateRoom({
        type: "group",
        name: groupName || undefined,
        participant_ids: selectedUsers.map((u) => u.id),
      });
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setStep("select");
    setSearchQuery("");
    setSelectedUsers([]);
    setGroupName("");
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {step === "group" && (
              <button
                onClick={() => setStep("select")}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === "select" ? "새 대화" : "그룹 채팅 만들기"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* 검색 */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 그룹 채팅 버튼 */}
            <button
              onClick={() => setStep("group")}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 border-b border-gray-200"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">그룹 채팅 만들기</p>
                <p className="text-sm text-gray-500">여러 사람과 대화하기</p>
              </div>
            </button>

            {/* 사용자 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  사용자를 찾을 수 없습니다
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startDirectChat(user)}
                    disabled={isCreating}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 disabled:opacity-50"
                  >
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {user.name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.position} {user.level && `· ${user.level}`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* 그룹 이름 입력 */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹 이름 (선택사항)"
                className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 선택된 사용자 */}
            {selectedUsers.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-2">
                  선택된 참여자 ({selectedUsers.length}명)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {user.name}
                      <button
                        onClick={() => toggleUser(user)}
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  placeholder="참여자 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 사용자 목록 */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50" : ""
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user.name.slice(0, 2)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.position}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 만들기 버튼 */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={createGroupChat}
                disabled={selectedUsers.length < 2 || isCreating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating
                  ? "생성 중..."
                  : selectedUsers.length < 2
                  ? "2명 이상 선택하세요"
                  : `${selectedUsers.length}명과 대화 시작`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
