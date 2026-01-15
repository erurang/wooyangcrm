"use client";

import { useState } from "react";
import { Reply, User } from "lucide-react";
import dayjs from "dayjs";
import type { PostComment } from "@/types/post";

interface CommentItemProps {
  comment: PostComment;
  currentUserId: string;
  onReply: (content: string, parentId?: string) => void;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  currentUserId,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent.trim(), comment.id);
    setReplyContent("");
    setIsReplying(false);
  };

  return (
    <div className="py-3">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <User className="w-4 h-4" />
            {comment.user?.name} {comment.user?.level && `${comment.user.level}`}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            {dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}
          </span>
        </div>
        {!isReply && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Reply className="w-3 h-3" />
            답글
          </button>
        )}
      </div>

      {/* 댓글 내용 */}
      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>

      {/* 답글 작성 폼 */}
      {isReplying && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요..."
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim()}
              className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
