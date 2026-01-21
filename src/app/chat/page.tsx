"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLoginUser } from "@/context/login";
import {
  useChatRooms,
  useCreateChatRoom,
  useChatRoomDetail,
  useLeaveChatRoom,
} from "@/hooks/chat";
import {
  ChatSidebar,
  ChatRoom,
  NewChatModal,
  ChatSearch,
  ChatInviteModal,
  ChatRoomInfo,
} from "@/components/chat";

type RightPanelMode = "info" | "search" | null;

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL에서 roomId 가져오기
  const roomIdFromUrl = searchParams.get("roomId");

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomIdFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 대화방 목록
  const { rooms, isLoading: isLoadingRooms, mutate: mutateRooms } = useChatRooms({
    userId: user?.id || null,
    search: searchQuery,
  });

  // 선택된 대화방 상세
  const { room: selectedRoom, mutate: mutateRoom } = useChatRoomDetail(
    selectedRoomId,
    user?.id || null
  );

  // 대화방 생성
  const { createRoom } = useCreateChatRoom();

  // 대화방 나가기
  const { leaveRoom } = useLeaveChatRoom();

  // URL 업데이트
  useEffect(() => {
    if (selectedRoomId) {
      router.replace(`/chat?roomId=${selectedRoomId}`, { scroll: false });
    } else {
      router.replace("/chat", { scroll: false });
    }
  }, [selectedRoomId, router]);

  // 대화방 선택
  const handleRoomSelect = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    setRightPanelMode(null);
  }, []);

  // 새 대화 생성
  const handleCreateRoom = useCallback(
    async (params: {
      type: "direct" | "group";
      name?: string;
      participant_ids: string[];
    }) => {
      if (!user?.id) return;

      const newRoom = await createRoom({
        ...params,
        created_by: user.id,
      });

      mutateRooms();
      setSelectedRoomId(newRoom.id);
    },
    [user?.id, createRoom, mutateRooms]
  );

  // 대화방 나가기
  const handleLeaveRoom = useCallback(async () => {
    if (!selectedRoomId || !user?.id) return;

    await leaveRoom(selectedRoomId, user.id);
    setSelectedRoomId(null);
    setRightPanelMode(null);
    mutateRooms();
  }, [selectedRoomId, user?.id, leaveRoom, mutateRooms]);

  // 사용자 초대
  const handleInvite = useCallback(
    async (userIds: string[]) => {
      if (!selectedRoomId || !user?.id) return;

      await fetch(`/api/chat/rooms/${selectedRoomId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviter_id: user.id,
          user_ids: userIds,
        }),
      });

      mutateRoom();
    },
    [selectedRoomId, user?.id, mutateRoom]
  );

  // 대화방 이름 변경
  const handleUpdateRoom = useCallback(
    async (name: string) => {
      if (!selectedRoomId || !user?.id) return;

      await fetch(`/api/chat/rooms/${selectedRoomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
        }),
      });

      mutateRoom();
      mutateRooms();
    },
    [selectedRoomId, user?.id, mutateRoom, mutateRooms]
  );

  // 뒤로가기 (모바일)
  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    setRightPanelMode(null);
  }, []);

  // 메시지 검색에서 메시지 선택
  const handleMessageSelect = useCallback((messageId: string) => {
    // TODO: 해당 메시지로 스크롤
    setRightPanelMode(null);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  // 모바일 뷰: 대화방 선택 시 채팅방만 표시
  const showSidebar = !isMobileView || !selectedRoomId;
  const showChat = !isMobileView || selectedRoomId;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-gray-50">
      {/* 사이드바 */}
      {showSidebar && (
        <div className={`${isMobileView ? "w-full" : "w-80"} flex-shrink-0`}>
          <ChatSidebar
            rooms={rooms}
            currentRoomId={selectedRoomId}
            currentUserId={user.id}
            isLoading={isLoadingRooms}
            onRoomSelect={handleRoomSelect}
            onNewChat={() => setIsNewChatModalOpen(true)}
            onSearch={setSearchQuery}
          />
        </div>
      )}

      {/* 메인 채팅 영역 */}
      {showChat && (
        <div className="flex-1 flex">
          {selectedRoom ? (
            <>
              {/* 채팅방 */}
              <div
                className={`flex-1 ${rightPanelMode ? "hidden md:block" : ""}`}
              >
                <ChatRoom
                  room={selectedRoom}
                  currentUserId={user.id}
                  onBack={isMobileView ? handleBack : undefined}
                  onOpenInfo={() => setRightPanelMode("info")}
                  onOpenSearch={() => setRightPanelMode("search")}
                />
              </div>

              {/* 오른쪽 패널 (검색/정보) */}
              <AnimatePresence>
                {rightPanelMode && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: isMobileView ? "100%" : 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-gray-200 bg-white overflow-hidden"
                  >
                    {rightPanelMode === "search" ? (
                      <ChatSearch
                        roomId={selectedRoom.id}
                        userId={user.id}
                        onMessageSelect={handleMessageSelect}
                        onClose={() => setRightPanelMode(null)}
                      />
                    ) : (
                      <ChatRoomInfo
                        room={selectedRoom}
                        currentUserId={user.id}
                        onClose={() => setRightPanelMode(null)}
                        onLeave={handleLeaveRoom}
                        onInvite={() => setIsInviteModalOpen(true)}
                        onUpdateRoom={handleUpdateRoom}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* 대화방 미선택 시 */
            !isMobileView && (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  대화방을 선택하세요
                </h3>
                <p className="text-gray-500 mb-6">
                  왼쪽에서 대화방을 선택하거나 새 대화를 시작하세요
                </p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  새 대화 시작하기
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* 새 대화 모달 */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        currentUserId={user.id}
        onCreateRoom={handleCreateRoom}
      />

      {/* 초대 모달 */}
      {selectedRoom && (
        <ChatInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          roomId={selectedRoom.id}
          currentUserId={user.id}
          existingParticipantIds={
            selectedRoom.participants?.map((p) => p.user_id) || []
          }
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
