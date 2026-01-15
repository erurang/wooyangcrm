"use client";

import { useState } from "react";
import Link from "next/link";
import { Reply, User, FileText, Download, Building2, MessageSquare, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import type { PostComment, ReferenceType } from "@/types/post";

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

      {/* 첨부파일 */}
      {comment.files && comment.files.length > 0 && (
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
      {comment.references && comment.references.length > 0 && (
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
