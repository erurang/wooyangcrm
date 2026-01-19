"use client";

import { Info, MapPin, Truck, ClipboardPaste } from "lucide-react";

interface NewDocument {
  delivery_place: string;
  delivery_term: string;
}

interface AdditionalInfoSectionProps {
  newDocument: NewDocument;
  setNewDocument: (doc: any) => void;
  iconColor: string;
  focusClass: string;
  companyAddress?: string;
}

export default function AdditionalInfoSection({
  newDocument,
  setNewDocument,
  iconColor,
  focusClass,
  companyAddress,
}: AdditionalInfoSectionProps) {
  const handlePasteAddress = () => {
    if (companyAddress) {
      setNewDocument({ ...newDocument, delivery_place: companyAddress });
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <Info className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-lg font-semibold">추가 정보</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            납품장소
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={newDocument.delivery_place}
              onChange={(e) =>
                setNewDocument({ ...newDocument, delivery_place: e.target.value })
              }
              className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
            />
          </div>
          {companyAddress && (
            <button
              type="button"
              onClick={handlePasteAddress}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ClipboardPaste size={14} />
              주소 붙여넣기
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            납품일
          </label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={newDocument.delivery_term}
              onChange={(e) =>
                setNewDocument({ ...newDocument, delivery_term: e.target.value })
              }
              className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
