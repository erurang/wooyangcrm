"use client";

interface RnDNotesCardProps {
  notes: string;
  isLoading: boolean;
}

export default function RnDNotesCard({ notes, isLoading }: RnDNotesCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 pl-4 pt-3">
        <div className="animate-pulse space-y-2 pr-4 pb-3">
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 pl-4 pt-3">
      <h2 className="font-semibold text-md mb-1">비고</h2>
      <div className="text-sm min-h-[80px] max-h-36 overflow-y-auto px-1">
        <span>
          {notes || "비고 추가/수정을 사용하여 유의사항을 작성해주세요."}
        </span>
      </div>
    </div>
  );
}
