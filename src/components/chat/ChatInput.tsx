"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import type { ChatMessageWithRelations, ChatFile } from "@/types/chat";

interface ChatInputProps {
  onSend: (content: string, replyToId?: string, fileIds?: string[]) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => Promise<ChatFile | null>;
  replyTo?: ChatMessageWithRelations | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onTyping,
  onFileUpload,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ id: string; name: string; preview?: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 변경 핸들러
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      onTyping(e.target.value.length > 0);

      // 텍스트에어리어 높이 자동 조절
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
    },
    [onTyping]
  );

  // 메시지 전송
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && pendingFiles.length === 0) || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(
        trimmedMessage,
        replyTo?.id,
        pendingFiles.map((f) => f.id)
      );
      setMessage("");
      setPendingFiles([]);
      onTyping(false);
      onCancelReply?.();

      // 텍스트에어리어 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSending(false);
    }
  }, [message, pendingFiles, isSending, disabled, onSend, replyTo?.id, onTyping, onCancelReply]);

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // 파일 선택
  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          const uploadedFile = await onFileUpload(file);
          if (uploadedFile) {
            setPendingFiles((prev) => [
              ...prev,
              {
                id: uploadedFile.id,
                name: uploadedFile.file_name,
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
              },
            ]);
          }
        }
      } finally {
        setIsUploading(false);
        // 파일 인풋 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onFileUpload]
  );

  // 첨부 파일 제거
  const removeFile = useCallback((fileId: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* 답장 표시 */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
          <div className="w-1 h-8 bg-blue-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">{replyTo.sender?.name}에게 답장</p>
            <p className="text-sm text-gray-700 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 첨부 파일 미리보기 */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((file) => (
            <div
              key={file.id}
              className="relative flex items-center gap-2 p-2 bg-gray-100 rounded-lg"
            >
              {file.preview ? (
                <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <span className="text-sm text-gray-700 max-w-[100px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-end gap-2">
        {/* 파일 첨부 버튼 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
          title="파일 첨부"
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* 텍스트 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors disabled:opacity-50"
            style={{ maxHeight: "150px" }}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={
            (!message.trim() && pendingFiles.length === 0) ||
            isSending ||
            disabled
          }
          className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
