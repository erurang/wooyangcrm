"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AtSign, Paperclip, X, FileText, Link2 } from "lucide-react";
import useSWR from "swr";
import ReferenceSelector from "@/components/board/ReferenceSelector";
import type { CreateReferenceData } from "@/types/post";

interface User {
  id: string;
  name: string;
  level?: string;
  position?: string;
}

interface ReplyFormProps {
  onSubmit: (content: string, files?: File[], references?: CreateReferenceData[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReplyForm({ onSubmit, onCancel, isLoading = false, placeholder = "답글을 입력하세요..." }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [references, setReferences] = useState<CreateReferenceData[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 사용자 목록 가져오기
  const { data: users = [] } = useSWR<User[]>("/api/users/list", fetcher, {
    revalidateOnFocus: false,
  });

  // 필터링된 사용자 목록
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // @ 위치 계산 함수
  const calculateMentionPosition = useCallback((text: string, atIndex: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeAt = text.slice(0, atIndex);
    const lines = textBeforeAt.split("\n");
    const lineNumber = lines.length - 1;
    const currentLineText = lines[lines.length - 1];

    const style = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || 18;
    const paddingTop = parseFloat(style.paddingTop) || 6;
    const paddingLeft = parseFloat(style.paddingLeft) || 10;
    const charWidth = 7;
    const textareaWidth = textarea.offsetWidth - paddingLeft * 2;
    const charsPerLine = Math.floor(textareaWidth / charWidth);
    const wrappedLines = Math.floor(currentLineText.length / charsPerLine);
    const charPositionInLine = currentLineText.length % charsPerLine;

    const top = paddingTop + (lineNumber + wrappedLines) * lineHeight + lineHeight - textarea.scrollTop;
    const left = Math.min(
      paddingLeft + charPositionInLine * charWidth,
      textareaWidth - 280 + paddingLeft
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

    const textBeforeCursor = value.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
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
    if (showMentions && filteredUsers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMentionIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          return;
        case "ArrowUp":
          e.preventDefault();
          setMentionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          return;
        case "Enter":
          e.preventDefault();
          selectMention(filteredUsers[mentionIndex]);
          return;
        case "Escape":
          setShowMentions(false);
          return;
      }
    }

    // ESC로 폼 닫기
    if (e.key === "Escape") {
      onCancel();
    }
  };

  // 선택된 항목 스크롤
  useEffect(() => {
    if (mentionListRef.current && showMentions) {
      const selectedItem = mentionListRef.current.children[mentionIndex] as HTMLElement;
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
      return part.split("\n").map((line, lineIndex, arr) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="relative">
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
        {/* 입력 영역 */}
        <div className="relative">
          {/* 하이라이트 오버레이 */}
          <div
            className="absolute inset-0 px-2.5 py-1.5 text-sm pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
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
            placeholder={placeholder}
            rows={2}
            className="w-full px-2.5 py-1.5 text-sm resize-none focus:outline-none bg-transparent relative"
            style={{
              caretColor: "black",
              color: content ? "transparent" : "inherit",
              WebkitTextFillColor: content ? "transparent" : "inherit",
            }}
            autoFocus
          />

          {/* 멘션이 있을 때 보이는 텍스트 오버레이 */}
          {content && (
            <div className="absolute inset-0 px-2.5 py-1.5 text-sm pointer-events-none overflow-hidden whitespace-pre-wrap break-words">
              {renderHighlightedContent()}
            </div>
          )}
        </div>

        {/* 첨부된 파일 목록 */}
        {attachedFiles.length > 0 && (
          <div className="px-2.5 pb-2 space-y-1 border-t border-gray-100 pt-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs"
              >
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate flex-1">{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
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
          <div className="px-2.5 pb-2 border-t border-gray-100 pt-2">
            <ReferenceSelector
              selectedReferences={references}
              onAdd={handleAddReference}
              onRemove={handleRemoveReference}
            />
          </div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-0.5">
            {/* 파일 첨부 버튼 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id={`reply-file-upload-${Math.random().toString(36).substr(2, 9)}`}
            />
            <label
              htmlFor={fileInputRef.current?.id || "reply-file-upload"}
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              className={`flex items-center gap-1 px-1.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                attachedFiles.length > 0
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Paperclip className="w-3 h-3" />
              파일
              {attachedFiles.length > 0 && (
                <span className="ml-0.5 px-1 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-full">
                  {attachedFiles.length}
                </span>
              )}
            </label>

            {/* 멘션 버튼 */}
            <button
              type="button"
              onClick={startMention}
              className="flex items-center gap-1 px-1.5 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <AtSign className="w-3 h-3" />
              멘션
            </button>

            {/* 참조 연결 버튼 */}
            <button
              type="button"
              onClick={() => setShowReferences(!showReferences)}
              className={`flex items-center gap-1 px-1.5 py-1 text-xs rounded transition-colors ${
                showReferences || references.length > 0
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Link2 className="w-3 h-3" />
              참조
              {references.length > 0 && (
                <span className="ml-0.5 px-1 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-full">
                  {references.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 취소 버튼 */}
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            {/* 등록 버튼 */}
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              <span>{isLoading ? "등록 중..." : "등록"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 멘션 드롭다운 */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute w-72 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
          }}
        >
          <div className="px-2 py-1.5 text-[10px] text-gray-500 border-b bg-gray-50">
            멘션할 사용자 선택 (↑↓ 이동, Enter 선택)
          </div>
          {filteredUsers.slice(0, 8).map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 ${
                index === mentionIndex ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-xs">{user.name}</div>
                {user.level && (
                  <div className="text-[10px] text-gray-500">{user.level}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
