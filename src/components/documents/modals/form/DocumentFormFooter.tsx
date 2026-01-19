"use client";

import { CircularProgress } from "@mui/material";
import { Check } from "lucide-react";

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
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 p-4 sm:p-5">
      <button
        onClick={onClose}
        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        disabled={saving}
      >
        취소
      </button>
      <button
        onClick={onSubmit}
        className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 ${buttonClass} active:opacity-90 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center shadow-sm`}
        disabled={saving}
      >
        {saving ? (
          <>
            <CircularProgress size={16} className="mr-2 text-white" />
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
