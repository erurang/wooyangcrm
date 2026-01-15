"use client";

import CommentItem from "./CommentItem";
import type { PostComment } from "@/types/post";

interface CommentListProps {
  comments: PostComment[];
  currentUserId: string;
  onReply: (content: string, parentId?: string) => void;
}

export default function CommentList({
  comments,
  currentUserId,
  onReply,
}: CommentListProps) {
  // 최상위 댓글만 필터링
  const rootComments = comments.filter((comment) => !comment.parent_id);

  // 대댓글 찾기
  const getReplies = (parentId: string) => {
    return comments.filter((comment) => comment.parent_id === parentId);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>아직 댓글이 없습니다.</p>
        <p className="text-sm mt-1">첫 번째 댓글을 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {rootComments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={onReply}
          />
          {/* 대댓글 */}
          {getReplies(comment.id).length > 0 && (
            <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-100 pl-4">
              {getReplies(comment.id).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
