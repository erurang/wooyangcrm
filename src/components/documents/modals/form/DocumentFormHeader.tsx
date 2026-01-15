"use client";

import { FileText, Edit, X, Package, Clipboard } from "lucide-react";

interface DocumentFormHeaderProps {
  mode: "add" | "edit";
  type: string;
  gradient: string;
  onClose: () => void;
}

export default function DocumentFormHeader({
  mode,
  type,
  gradient,
  onClose,
}: DocumentFormHeaderProps) {
  const isAddMode = mode === "add";

  const getDocTypeTitle = () => {
    switch (type) {
      case "estimate":
        return "견적서";
      case "order":
        return "발주서";
      case "requestQuote":
        return "의뢰서";
      default:
        return "";
    }
  };

  const getDocTypeIcon = () => {
    switch (type) {
      case "estimate":
        return <FileText className="h-6 w-6" />;
      case "order":
        return <Package className="h-6 w-6" />;
      case "requestQuote":
        return <Clipboard className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            {isAddMode ? getDocTypeIcon() : <Edit className="h-6 w-6" />}
          </div>
          <h3 className="text-xl font-bold">
            {getDocTypeTitle()} {isAddMode ? "추가" : "수정"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1.5 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
