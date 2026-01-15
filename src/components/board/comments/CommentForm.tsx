"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AtSign, Paperclip, X, FileText, Link2, ChevronDown, ChevronUp } from "lucide-react";
import useSWR from "swr";
import ReferenceSelector from "@/components/board/ReferenceSelector";
import type { CreateReferenceData } from "@/types/post";

interface User {
  id: string;
  name: string;
  level?: string;
  position?: string;
}

interface CommentFormProps {
  onSubmit: (content: string, files?: File[], references?: CreateReferenceData[]) => void;
  isLoading: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CommentForm({ onSubmit, isLoading }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [references, setReferences] = useState<CreateReferenceData[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 목록 가져오기
  const { data: users = [] } = useSWR<User[]>("/api/users/list", fetcher, {
    revalidateOnFocus: false,
  });

  // 필터링된 사용자 목록
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // @ 입력 감지
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setContent(value);
    setCursorPosition(pos);

    // @ 뒤의 텍스트 추출
    const textBeforeCursor = value.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // 멘션 선택
  const selectMention = useCallback(
    (user: User) => {
      const textBeforeCursor = content.slice(0, cursorPosition);
      const textAfterCursor = content.slice(cursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf("@");
      const newContent =
        textBeforeCursor.slice(0, atIndex) + `@${user.name} ` + textAfterCursor;
      setContent(newContent);
      setShowMentions(false);

      // 커서 위치 조정
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = atIndex + user.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [content, cursorPosition]
  );

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || filteredUsers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setMentionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case "Enter":
        if (showMentions) {
          e.preventDefault();
          selectMention(filteredUsers[mentionIndex]);
        }
        break;
      case "Escape":
        setShowMentions(false);
        break;
    }
  };

  // 선택된 항목 스크롤
  useEffect(() => {
    if (mentionListRef.current && showMentions) {
      const selectedItem = mentionListRef.current.children[
        mentionIndex
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [mentionIndex, showMentions]);

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 삭제
  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(
      content.trim(),
      attachedFiles.length > 0 ? attachedFiles : undefined,
      references.length > 0 ? references : undefined
    );
    setContent("");
    setAttachedFiles([]);
    setReferences([]);
    setShowReferences(false);
  };

  const handleAddReference = (ref: CreateReferenceData) => {
    setReferences((prev) => [...prev, ref]);
  };

  const handleRemoveReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  // @ 버튼으로 멘션 시작
  const startMention = () => {
    const pos = textareaRef.current?.selectionStart || content.length;
    const newContent = content.slice(0, pos) + "@" + content.slice(pos);
    setContent(newContent);
    setCursorPosition(pos + 1);
    setMentionSearch("");
    setShowMentions(true);
    setMentionIndex(0);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos + 1, pos + 1);
      }
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="댓글을 입력하세요... (@로 멘션 가능)"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            {/* 멘션 드롭다운 */}
            {showMentions && filteredUsers.length > 0 && (
              <div
                ref={mentionListRef}
                className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {filteredUsers.slice(0, 10).map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectMention(user)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 ${
                      index === mentionIndex ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.level && (
                        <div className="text-xs text-gray-500">{user.level}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 첨부된 파일 목록 */}
            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-0.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 참조 연결 섹션 */}
            {showReferences && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <ReferenceSelector
                  selectedReferences={references}
                  onAdd={handleAddReference}
                  onRemove={handleRemoveReference}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 self-end">
            {/* 파일 첨부 버튼 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="comment-file-upload"
            />
            <label
              htmlFor="comment-file-upload"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              title="파일 첨부"
            >
              <Paperclip className="w-4 h-4" />
            </label>
            <button
              type="button"
              onClick={startMention}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="멘션 추가"
            >
              <AtSign className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowReferences(!showReferences)}
              className={`p-2 rounded-md transition-colors ${
                showReferences || references.length > 0
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
              title="참조 연결"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? "..." : "등록"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
