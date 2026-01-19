"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Develop {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs: {
    name: string;
  };
}

interface Org {
  id: string;
  name: string;
}

interface DevelopModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  developData: Develop;
  onDevelopDataChange: (data: Partial<Develop>) => void;
  orgs: Org[];
  formatNumber: (value: string) => string;
}

export default function DevelopModal({
  mode,
  isOpen,
  onClose,
  onSave,
  isSaving,
  developData,
  onDevelopDataChange,
  orgs,
  formatNumber,
}: DevelopModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const title = mode === "add" ? "R&D 사업 추가" : "R&D 사업 수정";

  const handleNumberChange = (
    field: "total_cost" | "gov_contribution",
    value: string
  ) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    onDevelopDataChange({ [field]: numericValue });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 sm:px-2"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white w-full h-full sm:h-auto sm:rounded-md sm:w-11/12 md:w-2/3 sm:max-h-[85vh] overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
              {title}
            </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="mb-2">
              <label className="block mb-1">사업명</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={developData.name || ""}
                onChange={(e) => onDevelopDataChange({ name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">총 사업비</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={formatNumber(developData.total_cost || "")}
                onChange={(e) =>
                  handleNumberChange("total_cost", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">시작 기간</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="date"
                value={developData.start_date || ""}
                onChange={(e) =>
                  onDevelopDataChange({ start_date: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">종료 기간</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="date"
                value={developData.end_date || ""}
                onChange={(e) =>
                  onDevelopDataChange({ end_date: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">정부 출연금</label>
              <motion.input
                whileFocus={{
                  scale: 1.05,
                  boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
                }}
                type="text"
                value={formatNumber(developData.gov_contribution || "")}
                onChange={(e) =>
                  handleNumberChange("gov_contribution", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">지원 기관</label>
              <select
                value={developData.support_org || ""}
                onChange={(e) =>
                  onDevelopDataChange({ support_org: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요.</option>
                {orgs?.map((org) => (
                  <option key={org.id} value={org.name}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 비고 */}
          <div className="mb-2">
            <label className="block mb-1">비고</label>
            <textarea
              placeholder={
                mode === "edit"
                  ? "거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                  : ""
              }
              value={developData.notes || ""}
              onChange={(e) => onDevelopDataChange({ notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md min-h-52"
            />
          </div>

          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2 p-4 sm:p-6 pt-0 sm:pt-0 bg-white border-t sm:border-none shrink-0">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm active:bg-gray-600 ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              onClick={onSave}
              className={`flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm flex items-center justify-center ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSaving}
            >
              저장
              {isSaving && <CircularProgress size={18} className="ml-2" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
