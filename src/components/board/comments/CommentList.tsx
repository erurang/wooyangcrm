"use client";

import { useEffect, useRef, useState } from "react";
import CommentItem from "./CommentItem";
import type { PostComment, CreateReferenceData } from "@/types/post";

interface CommentListProps {
  comments: PostComment[];
  currentUserId: string;
  highlightCommentId?: string | null;
  onReply: (content: string, parentId?: string, files?: File[], references?: CreateReferenceData[]) => void;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isSubmittingReply?: boolean;
}

export default function CommentList({
  comments,
  currentUserId,
  highlightCommentId,
  onReply,
  onEdit,
  onDelete,
  isSubmittingReply = false,
}: CommentListProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // 하이라이트된 댓글로 스크롤 + 3초 후 제거
  useEffect(() => {
    if (highlightCommentId) {
      setActiveHighlightId(highlightCommentId);
      if (highlightRef.current) {
        setTimeout(() => {
          highlightRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
      // 3초 후 하이라이트 제거
      const timer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightCommentId, comments]);
  // 최상위 댓글만 필터링
  const rootComments = comments.filter((comment) => !comment.parent_id);

  // 대댓글 찾기
  const getReplies = (parentId: string) => {
    return comments.filter((comment) => comment.parent_id === parentId);
  };

  if (comments.length === 0) {
    return null; // 댓글 입력창의 placeholder로 대체
  }

  return (
    <div className="mt-6 divide-y divide-gray-100">
      {rootComments.map((comment) => {
        const isHighlighted = activeHighlightId === comment.id;
        return (
        <div
          key={comment.id}
          ref={isHighlighted ? highlightRef : null}
          className={`py-4 first:pt-0 transition-all duration-300 ${isHighlighted ? "bg-yellow-100 ring-2 ring-yellow-400 ring-inset rounded-lg p-2 -mx-2 animate-pulse" : ""}`}
        >
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            isSubmittingReply={isSubmittingReply}
          />
          {/* 대댓글 */}
          {getReplies(comment.id).length > 0 && (
            <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
              {getReplies(comment.id).map((reply) => {
                const isReplyHighlighted = activeHighlightId === reply.id;
                return (
                <div
                  key={reply.id}
                  ref={isReplyHighlighted ? highlightRef : null}
                  className={`transition-all duration-300 ${isReplyHighlighted ? "bg-yellow-100 ring-2 ring-yellow-400 ring-inset rounded-lg p-2 -m-2 animate-pulse" : ""}`}
                >
                  <CommentItem
                    comment={reply}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isReply
                    isSubmittingReply={isSubmittingReply}
                  />
                </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
