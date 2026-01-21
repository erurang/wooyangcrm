"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ChatRoomWithRelations, ChatParticipantWithUser } from "@/types/chat";
import { getChatRoomDisplayName } from "@/types/chat";

interface ChatRoomInfoProps {
  room: ChatRoomWithRelations;
  currentUserId: string;
  onClose: () => void;
  onLeave: () => void;
  onInvite: () => void;
  onUpdateRoom?: (name: string) => Promise<void>;
}

export default function ChatRoomInfo({
  room,
  currentUserId,
  onClose,
  onLeave,
  onInvite,
  onUpdateRoom,
}: ChatRoomInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [roomName, setRoomName] = useState(room.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const displayName = getChatRoomDisplayName(room, currentUserId);
  const isAdmin = room.participants?.some(
    (p) => p.user_id === currentUserId && p.role === "admin"
  );

  // 방 이름 저장
  const handleSaveName = async () => {
    if (!onUpdateRoom) return;

    setIsSaving(true);
    try {
      await onUpdateRoom(roomName);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">대화방 정보</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 대화방 이미지/이름 */}
        <div className="p-6 flex flex-col items-center border-b border-gray-200">
          {room.type === "direct" && room.other_user?.profile_image ? (
            <img
              src={room.other_user.profile_image}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover mb-3"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-3 ${
                room.type === "group"
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
            >
              {room.type === "group" ? (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-6 8v-2c0-2.67 5.33-4 6-4h12c.67 0 6 1.33 6 4v2H6z" />
                </svg>
              ) : (
                displayName.slice(0, 2)
              )}
            </div>
          )}

          {isEditing && room.type === "group" ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setRoomName(room.name || "");
                }}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900">{displayName}</h3>
              {isAdmin && room.type === "group" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {room.type === "group" && (
            <p className="text-sm text-gray-500 mt-1">
              참여자 {room.participants?.length || 0}명
            </p>
          )}
        </div>

        {/* 참여자 목록 (그룹만) */}
        {room.type === "group" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">참여자</h4>
              <button
                onClick={onInvite}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 초대하기
              </button>
            </div>
            <div className="space-y-2">
              {room.participants?.map((participant: ChatParticipantWithUser) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  {participant.user?.profile_image ? (
                    <img
                      src={participant.user.profile_image}
                      alt={participant.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                      {participant.user?.name?.slice(0, 2) || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {participant.user?.name}
                        {participant.user_id === currentUserId && (
                          <span className="text-gray-400 text-sm ml-1">(나)</span>
                        )}
                      </span>
                      {participant.role === "admin" && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          관리자
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {participant.user?.position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1:1 대화 상대방 정보 */}
        {room.type === "direct" && room.other_user && (
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">상대방 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">이름</span>
                <span className="text-gray-900">{room.other_user.name}</span>
              </div>
              {room.other_user.position && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">직책</span>
                  <span className="text-gray-900">{room.other_user.position}</span>
                </div>
              )}
              {room.other_user.level && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">직급</span>
                  <span className="text-gray-900">{room.other_user.level}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-gray-200">
        {showLeaveConfirm ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center mb-3">
              정말 대화방을 나가시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={onLeave}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                나가기
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            대화방 나가기
          </button>
        )}
      </div>
    </div>
  );
}
