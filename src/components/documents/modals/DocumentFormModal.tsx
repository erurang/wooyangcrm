"use client";

import { useEffect } from "react";
import DocumentItemsGrid from "../DocumentItemsGrid";
import {
  DocumentFormHeader,
  BasicInfoSection,
  DocumentInfoSection,
  AdditionalInfoSection,
  AmountInfoSection,
  NotesSection,
  DocumentFormFooter,
} from "./form";
import type { AppUser, NewDocument, Contact } from "@/types/document";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Items {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
}

interface DocumentFormModalProps {
  mode: "add" | "edit";
  type: string;
  user: AppUser;
  newDocument: NewDocument;
  setNewDocument: (doc: NewDocument) => void;
  koreanAmount: string;
  totalAmount: number;
  items: Items[];
  setItems: React.Dispatch<React.SetStateAction<Items[]>>;
  addItem: () => void;
  removeItem: (index: number) => void;
  handleQuantityChange: (index: number, value: string) => void;
  handleUnitPriceChange: (index: number, value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  paymentMethods: string[];
  saving: boolean;
  contacts: Contact[];
  companyAddress?: string;
}

export default function DocumentFormModal({
  mode,
  type,
  user,
  newDocument,
  setNewDocument,
  koreanAmount,
  totalAmount,
  items,
  setItems,
  addItem,
  removeItem,
  handleQuantityChange,
  handleUnitPriceChange,
  onClose,
  onSubmit,
  paymentMethods,
  saving,
  contacts,
  companyAddress,
}: DocumentFormModalProps) {
  const isAddMode = mode === "add";

  // ESC 키로 닫기
  useEscapeKey(true, onClose);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const colorConfig = isAddMode
    ? {
        gradient: "from-blue-600 to-blue-700",
        focus: "focus:ring-blue-500",
        accent: "blue" as const,
        iconColor: "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
      }
    : {
        gradient: "from-indigo-600 to-indigo-700",
        focus: "focus:ring-indigo-500",
        accent: "indigo" as const,
        iconColor: "text-indigo-600",
        button: "bg-indigo-600 hover:bg-indigo-700",
      };

  const showAmountInfo = isAddMode ? type !== "requestQuote" : true;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DocumentFormHeader
          mode={mode}
          type={type}
          gradient={colorConfig.gradient}
          onClose={onClose}
        />

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            <BasicInfoSection
              newDocument={newDocument}
              setNewDocument={setNewDocument}
              contacts={contacts}
              iconColor={colorConfig.iconColor}
              focusClass={colorConfig.focus}
            />

            <DocumentInfoSection
              mode={mode}
              type={type}
              user={user}
              newDocument={newDocument}
              setNewDocument={setNewDocument}
              paymentMethods={paymentMethods}
              iconColor={colorConfig.iconColor}
              focusClass={colorConfig.focus}
            />

            {type === "estimate" && (
              <AdditionalInfoSection
                newDocument={newDocument}
                setNewDocument={setNewDocument}
                iconColor={colorConfig.iconColor}
                focusClass={colorConfig.focus}
                companyAddress={companyAddress}
              />
            )}

            <NotesSection
              notes={newDocument.notes}
              onChange={(value) =>
                setNewDocument({ ...newDocument, notes: value })
              }
              iconColor={colorConfig.iconColor}
              focusClass={colorConfig.focus}
              userId={user?.id}
            />

            {showAmountInfo && (
              <AmountInfoSection
                mode={mode}
                koreanAmount={koreanAmount}
                totalAmount={totalAmount}
                iconColor={colorConfig.iconColor}
              />
            )}

            <DocumentItemsGrid
              items={items}
              setItems={setItems}
              addItem={addItem}
              removeItem={removeItem}
              handleQuantityChange={handleQuantityChange}
              handleUnitPriceChange={handleUnitPriceChange}
              accentColor={colorConfig.accent}
            />
          </div>
        </div>

        {/* 고정 푸터 */}
        <div className="shrink-0 border-t border-slate-200 bg-white">
          <DocumentFormFooter
            saving={saving}
            buttonClass={colorConfig.button}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
