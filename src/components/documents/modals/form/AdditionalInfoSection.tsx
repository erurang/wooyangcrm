"use client";

import { Info, Clock, MessageSquare } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface NewDocument {
  delivery_place: string;
  delivery_term: string;
  delivery_date: string;
  delivery_date_note?: string;
}

// 납기 비고 프리셋 옵션 (기본값: 빠른시일내)
const DELIVERY_NOTE_OPTIONS = [
  { value: "빠른시일내", label: "빠른시일내", days: 7 },
  { value: "", label: "날짜 표시", days: 0 },
  { value: "즉시 납품", label: "즉시 납품", days: 0 },
  { value: "1일 후", label: "1일 후", days: 1 },
  { value: "3일 이내", label: "3일 이내", days: 3 },
  { value: "1주일 이내", label: "1주일 이내", days: 7 },
  { value: "2주일 이내", label: "2주일 이내", days: 14 },
  { value: "1개월 이내", label: "1개월 이내", days: 30 },
  { value: "협의 후 결정", label: "협의 후 결정", days: 14 },
  { value: "custom", label: "직접 입력", days: 0 },
];

// KST 기준 날짜 계산 함수
const getKSTDate = (daysToAdd: number = 0): string => {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstDate = new Date(utc + (kstOffset * 60000));
  kstDate.setDate(kstDate.getDate() + daysToAdd);
  return kstDate.toISOString().split("T")[0];
};

interface AdditionalInfoSectionProps {
  newDocument: NewDocument;
  setNewDocument: (doc: NewDocument) => void;
  iconColor: string;
  focusClass: string;
  companyAddress?: string;
}

export default function AdditionalInfoSection({
  newDocument,
  setNewDocument,
  iconColor,
  focusClass,
}: AdditionalInfoSectionProps) {
  // 납기 비고 프리셋 선택 시 처리 (KST 기준)
  const handleDeliveryNoteChange = (value: string) => {
    if (value === "custom") {
      setNewDocument({ ...newDocument, delivery_date_note: "__직접입력__" });
      return;
    }

    // 선택한 옵션의 days 값으로 날짜 자동 설정 (KST 기준)
    const selectedOption = DELIVERY_NOTE_OPTIONS.find((opt) => opt.value === value);
    if (selectedOption && selectedOption.days > 0) {
      const futureDateStr = getKSTDate(selectedOption.days);
      setNewDocument({
        ...newDocument,
        delivery_date_note: value,
        delivery_date: futureDateStr,
      });
    } else {
      // 날짜 표시 또는 즉시 납품 (오늘 날짜 - KST 기준)
      const today = getKSTDate(0);
      setNewDocument({
        ...newDocument,
        delivery_date_note: value,
        delivery_date: value === "즉시 납품" ? today : newDocument.delivery_date,
      });
    }
  };

  // 현재 선택된 프리셋 또는 custom 상태 확인
  const getCurrentNotePreset = () => {
    const note = newDocument.delivery_date_note || "";
    if (!note) return "";
    const found = DELIVERY_NOTE_OPTIONS.find((opt) => opt.value === note);
    return found ? note : "custom";
  };

  const isCustomNote = getCurrentNotePreset() === "custom";

  const customInputValue = newDocument.delivery_date_note === "__직접입력__"
    ? ""
    : (newDocument.delivery_date_note || "");

  return (
    <div className="bg-gray-50 p-4 sm:p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-gray-800">
        <Info className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-base sm:text-lg font-semibold">추가 정보</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
        {/* 납품일 (내부) */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
            납품일 <span className="text-gray-400 text-xs">(내부)</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={newDocument.delivery_date}
              onChange={(e) =>
                setNewDocument({ ...newDocument, delivery_date: e.target.value })
              }
              className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
            />
          </div>
        </div>

        {/* 납기 표시 (문서) */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
            납기 표시 <span className="text-gray-400 text-xs">(문서)</span>
          </label>
          <HeadlessSelect
            value={getCurrentNotePreset()}
            onChange={handleDeliveryNoteChange}
            options={DELIVERY_NOTE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder="선택"
            icon={<MessageSquare className="h-4 w-4" />}
            focusClass={focusClass}
          />
        </div>

        {/* 직접 입력 선택 시 텍스트 입력 필드 표시 */}
        {isCustomNote && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
              직접 입력
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="예: 2월 중순경"
                value={customInputValue}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, delivery_date_note: e.target.value || "__직접입력__" })
                }
                className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
