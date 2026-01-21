// ================================
// 채팅 시스템 (Chat System) 타입 정의
// ================================

import { User } from "./index";

/**
 * 대화방 타입
 */
export type ChatRoomType = "direct" | "group";

/**
 * 메시지 타입
 */
export type ChatMessageType = "text" | "file" | "image" | "system";

/**
 * 참여자 역할
 */
export type ChatParticipantRole = "admin" | "member";

// ================================
// 기본 인터페이스
// ================================

/**
 * 대화방
 */
export interface ChatRoom {
  id: string;
  name: string | null;
  type: ChatRoomType;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
}

/**
 * 대화방 + 관계 데이터
 */
export interface ChatRoomWithRelations extends ChatRoom {
  participants?: ChatParticipantWithUser[];
  unread_count?: number;
  // 1:1 대화의 경우 상대방 정보
  other_user?: User;
}

/**
 * 대화방 참여자
 */
export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  role: ChatParticipantRole;
  left_at: string | null;
}

/**
 * 참여자 + 사용자 정보
 */
export interface ChatParticipantWithUser extends ChatParticipant {
  user?: User;
}

/**
 * 메시지
 */
export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string | null;
  content: string | null;
  message_type: ChatMessageType;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 메시지 + 관계 데이터
 */
export interface ChatMessageWithRelations extends ChatMessage {
  sender?: User;
  files?: ChatFile[];
  reactions?: ChatReactionGroup[];
  reply_to?: ChatMessage & { sender?: User };
  // 읽음 상태 (1:1 대화용)
  is_read?: boolean;
  read_by_count?: number;
}

/**
 * 첨부파일
 */
export interface ChatFile {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

/**
 * 타이핑 상태
 */
export interface ChatTyping {
  room_id: string;
  user_id: string;
  updated_at: string;
  user?: User;
}

/**
 * 이모지 반응
 */
export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: User;
}

/**
 * 이모지 반응 그룹 (같은 이모지끼리 묶음)
 */
export interface ChatReactionGroup {
  emoji: string;
  count: number;
  users: User[];
  reacted_by_me: boolean;
}

// ================================
// API 요청/응답 타입
// ================================

/**
 * 대화방 생성 요청
 */
export interface CreateChatRoomRequest {
  type: ChatRoomType;
  name?: string;
  participant_ids: string[];
}

/**
 * 메시지 전송 요청
 */
export interface SendMessageRequest {
  content: string;
  message_type?: ChatMessageType;
  reply_to_id?: string;
  file_ids?: string[];
}

/**
 * 메시지 목록 응답
 */
export interface ChatMessagesResponse {
  messages: ChatMessageWithRelations[];
  has_more: boolean;
  next_cursor?: string;
}

/**
 * 대화방 목록 응답
 */
export interface ChatRoomsResponse {
  rooms: ChatRoomWithRelations[];
  total: number;
}

/**
 * 파일 업로드 응답
 */
export interface ChatFileUploadResponse {
  file: ChatFile;
}

/**
 * 메시지 검색 요청
 */
export interface SearchMessagesRequest {
  query: string;
  room_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * 메시지 검색 응답
 */
export interface SearchMessagesResponse {
  messages: ChatMessageWithRelations[];
  total: number;
  has_more: boolean;
}

// ================================
// Realtime 이벤트 타입
// ================================

/**
 * Realtime 메시지 이벤트
 */
export interface RealtimeMessageEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  record: ChatMessage;
  old_record?: ChatMessage;
}

/**
 * Realtime 타이핑 이벤트
 */
export interface RealtimeTypingEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  record: ChatTyping;
}

/**
 * Realtime 참여자 이벤트 (읽음 상태)
 */
export interface RealtimeParticipantEvent {
  type: "UPDATE";
  record: ChatParticipant;
  old_record: ChatParticipant;
}

// ================================
// 유틸리티 타입
// ================================

/**
 * 대화방 필터
 */
export interface ChatRoomFilters {
  search?: string;
  type?: ChatRoomType;
}

/**
 * 안읽은 메시지 수
 */
export interface UnreadCount {
  room_id: string;
  count: number;
}

/**
 * 전체 안읽은 메시지 수
 */
export interface TotalUnreadCount {
  total: number;
  by_room: UnreadCount[];
}

// ================================
// 상수
// ================================

/**
 * 메시지 타입 라벨
 */
export const MESSAGE_TYPE_LABELS: Record<ChatMessageType, string> = {
  text: "텍스트",
  file: "파일",
  image: "이미지",
  system: "시스템",
};

/**
 * 시스템 메시지 템플릿
 */
export const SYSTEM_MESSAGE_TEMPLATES = {
  USER_JOINED: (userName: string) => `${userName}님이 대화방에 참여했습니다.`,
  USER_LEFT: (userName: string) => `${userName}님이 대화방을 나갔습니다.`,
  ROOM_CREATED: (userName: string) => `${userName}님이 대화방을 만들었습니다.`,
  USER_INVITED: (inviterName: string, inviteeName: string) =>
    `${inviterName}님이 ${inviteeName}님을 초대했습니다.`,
  ROOM_NAME_CHANGED: (userName: string, newName: string) =>
    `${userName}님이 대화방 이름을 "${newName}"으로 변경했습니다.`,
};

/**
 * 자주 사용하는 이모지
 */
export const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

// ================================
// 유틸리티 함수
// ================================

/**
 * 대화방 이름 생성 (1:1 대화 or 그룹)
 */
export function getChatRoomDisplayName(
  room: ChatRoomWithRelations,
  currentUserId: string
): string {
  if (room.type === "direct") {
    // 1:1 대화: 상대방 이름
    const otherParticipant = room.participants?.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.user?.name || "알 수 없는 사용자";
  }

  // 그룹: 방 이름 또는 참여자 이름 나열
  if (room.name) {
    return room.name;
  }

  const otherParticipants = room.participants?.filter(
    (p) => p.user_id !== currentUserId
  );
  if (!otherParticipants || otherParticipants.length === 0) {
    return "빈 대화방";
  }

  const names = otherParticipants
    .slice(0, 3)
    .map((p) => p.user?.name || "알 수 없음");

  if (otherParticipants.length > 3) {
    return `${names.join(", ")} 외 ${otherParticipants.length - 3}명`;
  }

  return names.join(", ");
}

/**
 * 메시지 시간 포맷
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 메시지 날짜 구분선 포맷
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "오늘";
  if (isYesterday) return "어제";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 파일 크기 포맷
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "알 수 없음";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 이미지 파일인지 확인
 */
export function isImageFile(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.startsWith("image/");
}
