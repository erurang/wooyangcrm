"use client";

import { useState } from "react";
import Link from "next/link";
import { Reply, User, FileText, Download, Building2, MessageSquare, ExternalLink, Pencil, Trash2, X, Check } from "lucide-react";
import dayjs from "dayjs";
import type { PostComment, ReferenceType, CreateReferenceData } from "@/types/post";
import { highlightMentions } from "./CommentForm";
import ReplyForm from "./ReplyForm";

const refTypeLabels: Record<ReferenceType, string> = {
  company: "거래처",
  consultation: "상담",
  document: "문서",
};

const refTypeIcons: Record<ReferenceType, React.ReactNode> = {
  company: <Building2 className="w-3 h-3" />,
  consultation: <MessageSquare className="w-3 h-3" />,
  document: <FileText className="w-3 h-3" />,
};

const refTypeColors: Record<ReferenceType, string> = {
  company: "bg-blue-50 text-blue-600 border-blue-200",
  consultation: "bg-green-50 text-green-600 border-green-200",
  document: "bg-purple-50 text-purple-600 border-purple-200",
};

const getRefLink = (type: ReferenceType, id: string): string => {
  switch (type) {
    case "company":
      return `/companies/${id}`;
    case "consultation":
      return `/consultations/${id}`;
    case "document":
      return `/documents/estimate?search=${id}`;
    default:
      return "#";
  }
};

interface CommentItemProps {
  comment: PostComment;
  currentUserId: string;
  onReply: (content: string, parentId?: string, files?: File[], references?: CreateReferenceData[]) => void;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isReply?: boolean;
  isSubmittingReply?: boolean;
}

export default function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
  isSubmittingReply = false,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAuthor = currentUserId === comment.user_id;
  const isDeleted = !!comment.deleted_at;

  const handleReplySubmit = (content: string, files?: File[], references?: CreateReferenceData[]) => {
    onReply(content, comment.id, files, references);
    setIsReplying(false);
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() || !onEdit) return;
    setIsSaving(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit comment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 삭제된 댓글 표시
  if (isDeleted) {
    return (
      <div className="py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="w-4 h-4" />
          <span>{comment.user?.name}</span>
          <span>·</span>
          <span>{dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}</span>
        </div>
        <div className="mt-2 px-3 py-2 bg-gray-100 rounded-md text-gray-500 text-sm">
          삭제된 댓글입니다. ({dayjs(comment.deleted_at).format("YYYY-MM-DD HH:mm")})
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/profile/${comment.user_id}`}
            className="flex items-center gap-1 font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            <User className="w-4 h-4" />
            {comment.user?.name} {comment.user?.level && `${comment.user.level}`}
          </Link>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            {dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}
          </span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span className="text-gray-400 text-xs">(수정됨)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 수정/삭제 버튼 (본인 댓글만) */}
          {isAuthor && !isEditing && (
            <>
              <button
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                {isDeleting ? "삭제중..." : "삭제"}
              </button>
            </>
          )}
          {/* 답글 버튼 */}
          {!isReply && !isEditing && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="w-3 h-3" />
              답글
            </button>
          )}
        </div>
      </div>

      {/* 댓글 내용 (수정 모드) */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-3 h-3" />
              취소
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={!editContent.trim() || isSaving}
              className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3 h-3" />
              {isSaving ? "저장중..." : "저장"}
            </button>
          </div>
        </div>
      ) : (
        /* 댓글 내용 (일반 모드) - @멘션 파란색 하이라이트 */
        <p className="text-gray-700 whitespace-pre-wrap">{highlightMentions(comment.content)}</p>
      )}

      {/* 첨부파일 */}
      {!isEditing && comment.files && comment.files.length > 0 && (
        <div className="mt-2 space-y-1">
          {comment.files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1 bg-gray-50 hover:bg-blue-50 rounded text-sm cursor-pointer transition-colors group"
            >
              <FileText className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
              <span className="truncate flex-1 text-gray-600 group-hover:text-blue-600">{file.name}</span>
              <Download className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
            </a>
          ))}
        </div>
      )}

      {/* 참조 연결 */}
      {!isEditing && comment.references && comment.references.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {comment.references.map((ref) => (
            <Link
              key={ref.id}
              href={getRefLink(ref.reference_type, ref.reference_id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs transition-colors hover:opacity-80 ${refTypeColors[ref.reference_type]}`}
            >
              {refTypeIcons[ref.reference_type]}
              <span>{ref.reference_name || refTypeLabels[ref.reference_type]}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </Link>
          ))}
        </div>
      )}

      {/* 답글 작성 폼 */}
      {isReplying && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200">
          <ReplyForm
            onSubmit={handleReplySubmit}
            onCancel={() => setIsReplying(false)}
            isLoading={isSubmittingReply}
            placeholder={`@${comment.user?.name || ""}님께 답글 작성...`}
          />
        </div>
      )}
    </div>
  );
}
