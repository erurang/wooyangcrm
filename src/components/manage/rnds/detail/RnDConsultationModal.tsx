"use client";

import { motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface ConsultationData {
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: string;
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface RnDConsultationModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  consultation: ConsultationData;
  onConsultationChange: (data: Partial<ConsultationData>) => void;
  onSave: () => void;
  isSaving: boolean;
  users: User[];
  participationTypes: string[];
}

const formatNumber = (value: string) => {
  const cleanedValue = value?.replace(/[^0-9]/g, "") || "";
  return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function RnDConsultationModal({
  mode,
  isOpen,
  onClose,
  consultation,
  onConsultationChange,
  onSave,
  isSaving,
  users,
  participationTypes,
}: RnDConsultationModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const title = mode === "add" ? "R&D 내역 추가" : "R&D 내역 수정";

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-md w-1/2">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>

        {/* Date Fields */}
        <div className="mb-4 grid space-x-4 grid-cols-4">
          <div>
            <label className="block mb-2 text-sm font-medium">작성일자</label>
            <input
              type="date"
              value={consultation.date}
              readOnly={mode === "add"}
              disabled={mode === "edit"}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">수행 시작일자</label>
            <input
              type="date"
              value={consultation.start_date}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => onConsultationChange({ start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">수행 종료일자</label>
            <input
              type="date"
              value={consultation.end_date}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => onConsultationChange({ end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">작성자</label>
            <select
              value={consultation.user_id}
              disabled
              onChange={(e) => onConsultationChange({ user_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost Fields */}
        <div className="mb-4 grid space-x-4 grid-cols-4">
          <div>
            <label className="block mb-1">총 사업비</label>
            <motion.input
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
              type="text"
              value={formatNumber(consultation.total_cost || "")}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "");
                onConsultationChange({ total_cost: numericValue });
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
              value={formatNumber(consultation.gov_contribution || "")}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "");
                onConsultationChange({ gov_contribution: numericValue });
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">민간 부담금</label>
            <motion.input
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
              type="text"
              value={formatNumber(consultation.pri_contribution || "")}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "");
                onConsultationChange({ pri_contribution: numericValue });
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">참여 유형</label>
            <select
              value={consultation.participation || ""}
              onChange={(e) => onConsultationChange({ participation: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">선택하세요.</option>
              {participationTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">내용</label>
          <textarea
            value={consultation.content}
            onChange={(e) => onConsultationChange({ content: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={16}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSaving}
          >
            취소
          </button>
          <button
            onClick={onSave}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSaving}
          >
            저장
            {isSaving && <CircularProgress size={18} className="ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
}
