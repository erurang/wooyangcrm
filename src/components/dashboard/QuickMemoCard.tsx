"use client";

import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Loader2, Check } from "lucide-react";

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

  useEffect(() => {
    setLocalMemo(memo);
  }, [memo]);

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
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
        <div className="flex items-center mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <StickyNote className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">빠른 메모</h2>
        </div>
        <div className="h-32 animate-pulse bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <StickyNote className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">빠른 메모</h2>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={isSaving || !hasChanges}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${hasChanges && !isSaving
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm"
              : isSaving
              ? "bg-amber-100 text-amber-600"
              : "bg-slate-50 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              저장중
            </>
          ) : hasChanges ? (
            <>
              <Save className="h-3 w-3" />
              저장
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              저장됨
            </>
          )}
        </button>
      </div>

      <textarea
        value={localMemo}
        onChange={handleChange}
        placeholder="메모를 입력하세요... (3초 후 자동 저장)"
        className="
          flex-1 w-full p-3 text-sm text-slate-700 placeholder-slate-300
          bg-amber-50/50 border border-amber-100 rounded-xl
          resize-none focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-200
          min-h-[120px] leading-relaxed
          transition-all duration-200
        "
      />

      {hasChanges && (
        <div className="flex items-center justify-end gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-[11px] text-slate-400 font-medium">
            변경사항 있음 · 3초 후 자동 저장
          </p>
        </div>
      )}
    </div>
  );
}
