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
    <div className="flex justify-end space-x-3 mt-8">
      <button
        onClick={onClose}
        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        disabled={saving}
      >
        취소
      </button>
      <button
        onClick={onSubmit}
        className={`px-5 py-2.5 ${buttonClass} text-white rounded-lg transition-colors text-sm font-medium flex items-center shadow-sm`}
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
