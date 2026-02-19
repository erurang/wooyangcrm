"use client";

import { FileText, Calendar, Clock, User, CreditCard, MessageSquare, MapPin } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import type { NewDocument, AppUser, Contact } from "@/types/document";

interface UserItem {
  id: string;
  name: string;
  level: string;
}

// 납기 비고 프리셋 옵션 (기본값: 빠른시일내)
const DELIVERY_NOTE_OPTIONS = [
  { value: "빠른시일내", label: "빠른시일내", days: 7 },
  { value: "", label: "날짜 표시", days: 0 },
  { value: "즉시 납품", label: "즉시 납품", days: 0 },
  { value: "발주 후 1일 이내", label: "발주 후 1일 이내", days: 1 },
  { value: "발주 후 3일 이내", label: "발주 후 3일 이내", days: 3 },
  { value: "발주 후 1주일 이내", label: "발주 후 1주일 이내", days: 7 },
  { value: "발주 후 2주일 이내", label: "발주 후 2주일 이내", days: 14 },
  { value: "발주 후 1개월 이내", label: "발주 후 1개월 이내", days: 30 },
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
  // toISOString()은 UTC로 변환하므로 직접 포맷팅
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface DocumentInfoSectionProps {
  mode: "add" | "edit";
  type: string;
  user: AppUser;
  users?: UserItem[];
  newDocument: NewDocument;
  setNewDocument: (doc: NewDocument) => void;
  paymentMethods: string[];
  iconColor: string;
  focusClass: string;
  contacts?: Contact[];
  companyAddress?: string;
}

export default function DocumentInfoSection({
  mode,
  type,
  user,
  users = [],
  newDocument,
  setNewDocument,
  paymentMethods,
  iconColor,
  focusClass,
  contacts = [],
  companyAddress,
}: DocumentInfoSectionProps) {
  const isAddMode = mode === "add";

  // 납기 비고 프리셋 선택 시 처리 (KST 기준)
  const handleDeliveryNoteChange = (value: string) => {
    if (value === "custom") {
      // 직접 입력 선택 시 - 프리셋이 아닌 마커 값 설정
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

  // 커스텀 입력 필드에 표시할 값 (마커는 빈 문자열로 표시)
  const customInputValue = newDocument.delivery_date_note === "__직접입력__"
    ? ""
    : (newDocument.delivery_date_note || "");

  const getUserLabel = () => {
    switch (type) {
      case "estimate":
        return "견적자";
      case "order":
        return "발주자";
      case "requestQuote":
        return "의뢰자";
      default:
        return "";
    }
  };

  // 발주서 전용 레이아웃
  if (type === "order") {
    return (
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-slate-700">
          <FileText className={`h-5 w-5 ${iconColor}`} />
          <h4 className="text-base sm:text-lg font-semibold">문서 정보</h4>
        </div>

        {/* 1행: 담당자명 | 발주자 | 결제조건 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* 담당자명 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              담당자명 <span className="text-red-500">*</span>
            </label>
            <HeadlessSelect
              value={newDocument.contact}
              onChange={(value) =>
                setNewDocument({ ...newDocument, contact: value })
              }
              options={contacts
                .filter((c) => !c.resign)
                .map((contact) => ({
                  value: contact.contact_name,
                  label: contact.contact_name,
                  sublabel: contact.level,
                }))}
              placeholder="선택"
              icon={<User className="h-4 w-4" />}
              focusClass={focusClass}
            />
          </div>

          {/* 발주자 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              발주자
            </label>
            {isAddMode ? (
              <HeadlessSelect
                value={user?.name || ""}
                onChange={() => {
                  // 발주자 선택 시 처리 (추후 user_id 저장 로직 필요)
                }}
                options={users.map((u) => ({
                  value: u.name,
                  label: u.name,
                  sublabel: u.level,
                }))}
                placeholder="선택"
                icon={<User className="h-4 w-4" />}
                focusClass={focusClass}
              />
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  disabled
                  type="text"
                  value={user?.name}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>

          {/* 결제조건 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              결제조건 <span className="text-red-500">*</span>
            </label>
            <HeadlessSelect
              value={newDocument.payment_method}
              onChange={(value) =>
                setNewDocument({ ...newDocument, payment_method: value })
              }
              options={paymentMethods.map((method) => ({
                value: method,
                label: method,
              }))}
              placeholder="선택"
              icon={<CreditCard className="h-4 w-4" />}
              focusClass={focusClass}
            />
          </div>
        </div>

        {/* 2행: 납기일 | 납기표시 | 직접입력(조건부) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* 납기일 */}
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              납기일 <span className="text-slate-400 text-xs">(내부)</span> <span className="text-red-500">*</span>
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
              <input
                type="date"
                value={newDocument.delivery_date}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, delivery_date: e.target.value })
                }
                className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>

          {/* 납기 표시 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              납기 표시 <span className="text-slate-400 text-xs">(문서)</span>
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
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
                직접 입력
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="예: 2월 중순경"
                  value={customInputValue}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, delivery_date_note: e.target.value || "__직접입력__" })
                  }
                  className={`w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 견적서 전용 레이아웃
  if (type === "estimate") {
    return (
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-slate-700">
          <FileText className={`h-5 w-5 ${iconColor}`} />
          <h4 className="text-base sm:text-lg font-semibold">문서 정보</h4>
        </div>

        {/* 1행: 담당자명 | 견적자 | 결제조건 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* 담당자명 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              담당자명 <span className="text-red-500">*</span>
            </label>
            <HeadlessSelect
              value={newDocument.contact}
              onChange={(value) =>
                setNewDocument({ ...newDocument, contact: value })
              }
              options={contacts
                .filter((c) => !c.resign)
                .map((contact) => ({
                  value: contact.contact_name,
                  label: contact.contact_name,
                  sublabel: contact.level,
                }))}
              placeholder="선택"
              icon={<User className="h-4 w-4" />}
              focusClass={focusClass}
            />
          </div>

          {/* 견적자 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              견적자
            </label>
            {isAddMode ? (
              <HeadlessSelect
                value={user?.name || ""}
                onChange={() => {
                  // 견적자 선택 시 처리 (추후 user_id 저장 로직 필요)
                }}
                options={users.map((u) => ({
                  value: u.name,
                  label: u.name,
                  sublabel: u.level,
                }))}
                placeholder="선택"
                icon={<User className="h-4 w-4" />}
                focusClass={focusClass}
              />
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  disabled
                  type="text"
                  value={user?.name}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>

          {/* 결제조건 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              결제조건 <span className="text-red-500">*</span>
            </label>
            <HeadlessSelect
              value={newDocument.payment_method}
              onChange={(value) =>
                setNewDocument({ ...newDocument, payment_method: value })
              }
              options={paymentMethods.map((method) => ({
                value: method,
                label: method,
              }))}
              placeholder="선택"
              icon={<CreditCard className="h-4 w-4" />}
              focusClass={focusClass}
            />
          </div>
        </div>

        {/* 2행: 견적유효기간(1칸) | 납품장소(2칸) */}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-5">
          {/* 견적유효기간 - 1칸 */}
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              견적유효기간 <span className="text-red-500">*</span>
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
              <input
                type="date"
                value={newDocument.valid_until}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, valid_until: e.target.value })
                }
                className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>

          {/* 납품장소 - 2칸 */}
          <div className="col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              납품장소{" "}
              {companyAddress && (
                <button
                  type="button"
                  onClick={() =>
                    setNewDocument({ ...newDocument, delivery_place: companyAddress })
                  }
                  className="text-sky-500 hover:text-sky-700 hover:underline cursor-pointer text-xs font-normal transition-colors"
                >
                  (주소 불러오기)
                </button>
              )}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={newDocument.delivery_place || ""}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, delivery_place: e.target.value })
                }
                className={`w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {/* 3행: 납품일(내부) | 납기표시(문서) | 직접입력(조건부) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* 납품일 (내부) */}
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              납품일 <span className="text-slate-400 text-xs">(내부)</span> <span className="text-red-500">*</span>
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
              <input
                type="date"
                value={newDocument.delivery_date}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, delivery_date: e.target.value })
                }
                className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${focusClass} focus:border-transparent`}
              />
            </div>
          </div>

          {/* 납기 표시 (문서) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              납기 표시 <span className="text-slate-400 text-xs">(문서)</span>
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
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
                직접 입력
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="예: 2월 중순경"
                  value={customInputValue}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, delivery_date_note: e.target.value || "__직접입력__" })
                  }
                  className={`w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 견적의뢰서 레이아웃
  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-slate-700">
        <FileText className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-base sm:text-lg font-semibold">문서 정보</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* 결제조건 */}
        {!isAddMode && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
              결제조건 <span className="text-red-500">*</span>
            </label>
            <HeadlessSelect
              value={newDocument.payment_method}
              onChange={(value) =>
                setNewDocument({ ...newDocument, payment_method: value })
              }
              options={paymentMethods.map((method) => ({
                value: method,
                label: method,
              }))}
              placeholder="선택"
              icon={<CreditCard className="h-4 w-4" />}
              focusClass={focusClass}
            />
          </div>
        )}

        {/* 의뢰일 */}
        <div className="min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            의뢰일
          </label>
          <div className="relative overflow-hidden rounded-lg">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
            <input
              type="date"
              disabled
              value={isAddMode ? newDocument.date : newDocument.created_at}
              className="w-full max-w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm box-border"
            />
          </div>
        </div>

        {/* 희망견적일 */}
        <div className="min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            희망견적일 <span className="text-red-500">*</span>
          </label>
          <div className="relative overflow-hidden rounded-lg">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
            <input
              type="date"
              value={newDocument.delivery_date}
              onChange={(e) =>
                setNewDocument({ ...newDocument, delivery_date: e.target.value })
              }
              className={`w-full max-w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm box-border ${focusClass} focus:border-transparent`}
            />
          </div>
        </div>

        {/* 의뢰자 */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5">
            의뢰자
          </label>
          {isAddMode ? (
            <HeadlessSelect
              value={user?.name || ""}
              onChange={() => {
                // 의뢰자 선택 시 처리 (추후 user_id 저장 로직 필요)
              }}
              options={users.map((u) => ({
                value: u.name,
                label: u.name,
                sublabel: u.level,
              }))}
              placeholder="선택"
              icon={<User className="h-4 w-4" />}
              focusClass={focusClass}
            />
          ) : (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                disabled
                type="text"
                value={user?.name}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
