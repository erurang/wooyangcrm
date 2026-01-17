"use client";

import { useEffect, useRef } from "react";
import CommentItem from "./CommentItem";
import type { PostComment } from "@/types/post";

interface CommentListProps {
  comments: PostComment[];
  currentUserId: string;
  highlightCommentId?: string | null;
  onReply: (content: string, parentId?: string) => void;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export default function CommentList({
  comments,
  currentUserId,
  highlightCommentId,
  onReply,
  onEdit,
  onDelete,
}: CommentListProps) {
  const highlightRef = useRef<HTMLDivElement>(null);

  // 하이라이트된 댓글로 스크롤
  useEffect(() => {
    if (highlightCommentId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
        const isHighlighted = highlightCommentId === comment.id;
        return (
        <div
          key={comment.id}
          ref={isHighlighted ? highlightRef : null}
          className={`py-4 first:pt-0 ${isHighlighted ? "bg-indigo-50 ring-2 ring-indigo-200 ring-inset rounded-lg p-2 -mx-2" : ""}`}
        >
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {/* 대댓글 */}
          {getReplies(comment.id).length > 0 && (
            <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
              {getReplies(comment.id).map((reply) => {
                const isReplyHighlighted = highlightCommentId === reply.id;
                return (
                <div
                  key={reply.id}
                  ref={isReplyHighlighted ? highlightRef : null}
                  className={isReplyHighlighted ? "bg-indigo-50 ring-2 ring-indigo-200 ring-inset rounded-lg p-2 -m-2" : ""}
                >
                  <CommentItem
                    comment={reply}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isReply
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
