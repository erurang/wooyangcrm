"use client";

import { Loader2, Check } from "lucide-react";

interface DocumentFormFooterProps {
  saving: boolean;
  buttonClass: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export default function DocumentFormFooter({
  saving,
  buttonClass,
  onClose,
  onSubmit,
}: DocumentFormFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5 p-4 sm:p-5">
      <button
        onClick={onClose}
        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-all"
        disabled={saving}
      >
        취소
      </button>
      <button
        onClick={onSubmit}
        className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 ${buttonClass} active:opacity-90 text-white rounded-xl transition-all text-sm font-bold flex items-center justify-center shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-200 disabled:opacity-50`}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            저장 중...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-1.5" />
            저장
          </>
        )}
      </button>
    </div>
  );
}
