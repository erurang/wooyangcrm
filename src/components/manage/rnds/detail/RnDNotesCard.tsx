"use client";

import { Skeleton } from "@mui/material";

interface RnDNotesCardProps {
  notes: string;
  isLoading: boolean;
}

export default function RnDNotesCard({ notes, isLoading }: RnDNotesCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3">
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    );
  }

  return (
    <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3">
      <h2 className="font-semibold text-md mb-1">비고</h2>
      <div className="text-sm min-h-[80px] max-h-36 overflow-y-auto px-1">
        <span>
          {notes || "비고 추가/수정을 사용하여 유의사항을 작성해주세요."}
        </span>
      </div>
    </div>
  );
}
