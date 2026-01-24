"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AtSign, Paperclip, X, Link2 } from "lucide-react";
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

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
  if (["pdf"].includes(ext || "")) return "📄";
  if (["doc", "docx"].includes(ext || "")) return "📝";
  if (["xls", "xlsx"].includes(ext || "")) return "📊";
  if (["ppt", "pptx"].includes(ext || "")) return "📽️";
  if (["zip", "rar", "7z"].includes(ext || "")) return "🗜️";
  return "📎";
};

// @멘션을 파란색으로 하이라이트하는 함수
export function highlightMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@[^\s@]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span key={index} className="text-blue-600 font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function CommentForm({ onSubmit, isLoading }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<{ [key: string]: string }>({});
  const [references, setReferences] = useState<CreateReferenceData[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 사용자 목록 가져오기
  const { data: users = [] } = useSWR<User[]>("/api/users", fetcher, {
    revalidateOnFocus: false,
  });

  // 필터링된 사용자 목록
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // textarea 스크롤 동기화
  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // @ 위치 계산 함수
  const calculateMentionPosition = useCallback((text: string, atIndex: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeAt = text.slice(0, atIndex);

    // 줄 수 계산
    const lines = textBeforeAt.split("\n");
    const lineNumber = lines.length - 1;
    const currentLineText = lines[lines.length - 1];

    // 스타일에서 lineHeight 가져오기
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingTop = parseFloat(style.paddingTop) || 8;
    const paddingLeft = parseFloat(style.paddingLeft) || 12;

    // 대략적인 문자 너비 (14px 폰트 기준 약 8px)
    const charWidth = 8;
    const textareaWidth = textarea.offsetWidth - paddingLeft * 2;

    // 현재 줄에서 @ 위치 계산 (줄 바꿈 고려)
    const charsPerLine = Math.floor(textareaWidth / charWidth);
    const wrappedLines = Math.floor(currentLineText.length / charsPerLine);
    const charPositionInLine = currentLineText.length % charsPerLine;

    // 최종 위치 계산
    const top = paddingTop + (lineNumber + wrappedLines) * lineHeight + lineHeight - textarea.scrollTop;
    const left = Math.min(
      paddingLeft + charPositionInLine * charWidth,
      textareaWidth - 320 + paddingLeft // 드롭다운 너비 고려
    );

    setMentionPosition({
      top: Math.max(top, lineHeight + paddingTop),
      left: Math.max(left, 0)
    });
  }, []);

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

      // @ 위치 계산
      const atIndex = textBeforeCursor.lastIndexOf("@");
      calculateMentionPosition(value, atIndex);
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
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      // 새 파일들에 대한 설명 초기화
      const newDescriptions: { [key: string]: string } = {};
      newFiles.forEach(file => {
        newDescriptions[file.name] = "";
      });
      setFileDescriptions(prev => ({ ...prev, ...newDescriptions }));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 삭제
  const removeFile = (index: number) => {
    const fileToRemove = attachedFiles[index];
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setFileDescriptions(prev => {
      const newDesc = { ...prev };
      delete newDesc[fileToRemove.name];
      return newDesc;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // 파일에 설명 정보 추가 (File 객체에 직접 추가할 수 없으므로 별도 처리 필요)
    // 임시로 파일명에 설명을 포함하거나, 별도 데이터로 전달
    const filesWithDesc = attachedFiles.map(file => {
      // 설명 정보를 파일 객체의 커스텀 속성으로 추가
      const fileWithDesc = file as File & { description?: string };
      fileWithDesc.description = fileDescriptions[file.name] || "";
      return fileWithDesc;
    });

    onSubmit(
      content.trim(),
      filesWithDesc.length > 0 ? filesWithDesc : undefined,
      references.length > 0 ? references : undefined
    );
    setContent("");
    setAttachedFiles([]);
    setFileDescriptions({});
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

    // @ 위치 계산
    setTimeout(() => {
      calculateMentionPosition(newContent, pos);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos + 1, pos + 1);
      }
    }, 0);
  };

  // 멘션 하이라이트된 텍스트 렌더링
  const renderHighlightedContent = () => {
    if (!content) return null;
    const parts = content.split(/(@[^\s@]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-blue-600 font-medium">
            {part}
          </span>
        );
      }
      // 줄바꿈 처리
      return part.split("\n").map((line, lineIndex, arr) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 relative">
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {/* 입력 영역 */}
        <div className="relative" ref={containerRef}>
          {/* 하이라이트 오버레이 */}
          <div
            ref={highlightRef}
            className="absolute inset-0 px-3 py-2 text-sm pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
            style={{ color: "transparent" }}
            aria-hidden="true"
          >
            {renderHighlightedContent()}
          </div>

          {/* 실제 textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder="첫 번째 댓글을 남겨보세요! (@로 멘션 가능)"
            rows={3}
            className="w-full px-3 py-2 text-sm resize-none focus:outline-none bg-transparent relative"
            style={{
              caretColor: "black",
              color: content ? "transparent" : "inherit",
              WebkitTextFillColor: content ? "transparent" : "inherit",
            }}
          />

          {/* 멘션이 있을 때 보이는 텍스트 오버레이 */}
          {content && (
            <div
              className="absolute inset-0 px-3 py-2 text-sm pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
            >
              {renderHighlightedContent()}
            </div>
          )}

        </div>

        {/* 첨부된 파일 목록 */}
        {attachedFiles.length > 0 && (
          <div className="px-3 pb-2 space-y-2 border-t border-gray-100 pt-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 참조 연결 섹션 */}
        {showReferences && (
          <div className="px-3 pb-2 border-t border-gray-100 pt-2">
            <ReferenceSelector
              selectedReferences={references}
              onAdd={handleAddReference}
              onRemove={handleRemoveReference}
            />
          </div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-1">
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
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">파일</span>
            </label>

            {/* 멘션 버튼 */}
            <button
              type="button"
              onClick={startMention}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <AtSign className="w-4 h-4" />
              <span className="hidden sm:inline">멘션</span>
            </button>

            {/* 참조 연결 버튼 */}
            <button
              type="button"
              onClick={() => setShowReferences(!showReferences)}
              className={`flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors ${
                showReferences || references.length > 0
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">참조</span>
              {references.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {references.length}
                </span>
              )}
            </button>
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? "등록 중..." : "등록"}</span>
          </button>
        </div>
      </div>

      {/* 멘션 드롭다운 - form 기준으로 위치 (overflow-hidden 밖) */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute w-80 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
            멘션할 사용자 선택 (↑↓ 이동, Enter 선택)
          </div>
          {filteredUsers.slice(0, 10).map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user)}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-100 ${
                index === mentionIndex ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{user.name}</div>
                {user.level && (
                  <div className="text-xs text-gray-500">{user.level}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
