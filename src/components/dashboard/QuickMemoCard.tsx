"use client";

import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Loader2 } from "lucide-react";

interface QuickMemoCardProps {
  memo: string;
  onSave: (content: string) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
}

export default function QuickMemoCard({
  memo,
  onSave,
  isLoading = false,
  isSaving = false,
}: QuickMemoCardProps) {
  const [localMemo, setLocalMemo] = useState(memo);
  const [hasChanges, setHasChanges] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // memo prop이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setLocalMemo(memo);
  }, [memo]);

  // 자동 저장 (3초 후)
  useEffect(() => {
    if (hasChanges && localMemo !== memo) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSave(localMemo);
        setHasChanges(false);
      }, 3000);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localMemo, memo, hasChanges, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMemo(e.target.value);
    setHasChanges(true);
  };

  const handleSaveClick = async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await onSave(localMemo);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
        <div className="flex items-center mb-3">
          <StickyNote className="h-4 w-4 text-yellow-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">빠른 메모</h2>
        </div>
        <div className="h-32 animate-pulse bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <StickyNote className="h-4 w-4 text-yellow-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">빠른 메모</h2>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={isSaving || !hasChanges}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
            ${hasChanges && !isSaving
              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              저장중
            </>
          ) : (
            <>
              <Save className="h-3 w-3" />
              {hasChanges ? "저장" : "저장됨"}
            </>
          )}
        </button>
      </div>

      <textarea
        value={localMemo}
        onChange={handleChange}
        placeholder="메모를 입력하세요... (3초 후 자동 저장)"
        className="
          flex-1 w-full p-2 text-sm text-slate-700 placeholder-slate-400
          bg-yellow-50 border border-yellow-200 rounded-lg
          resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300
          min-h-[120px]
        "
      />

      {hasChanges && (
        <p className="text-xs text-slate-400 mt-2 text-right">
          변경사항 있음 - 3초 후 자동 저장
        </p>
      )}
    </div>
  );
}
