"use client";

import { motion } from "framer-motion";
import FormModal from "@/components/ui/FormModal";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface RnDs {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs?: {
    name: string;
  };
}

interface Org {
  id: string;
  name: string;
}

interface RnDsModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  rndData: RnDs;
  onRndDataChange: (data: Partial<RnDs>) => void;
  orgs: Org[];
  formatNumber: (value: string) => string;
}

export default function RnDsModal({
  mode,
  isOpen,
  onClose,
  onSave,
  isSaving,
  rndData,
  onRndDataChange,
  orgs,
  formatNumber,
}: RnDsModalProps) {
  const handleNumberChange = (
    field: "total_cost" | "gov_contribution",
    value: string
  ) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    onRndDataChange({ [field]: numericValue });
  };

  return (
    <FormModal
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      title={{ add: "R&D 사업 추가", edit: "R&D 사업 수정" }}
      size="md"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="mb-2">
          <label className="block mb-1">사업명</label>
          <motion.input
            whileFocus={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
            }}
            type="text"
            value={rndData.name || ""}
            onChange={(e) => onRndDataChange({ name: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-md"
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
            value={formatNumber(rndData.total_cost || "")}
            onChange={(e) => handleNumberChange("total_cost", e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md"
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
            value={rndData.start_date || ""}
            onChange={(e) => onRndDataChange({ start_date: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-md"
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
            value={rndData.end_date || ""}
            onChange={(e) => onRndDataChange({ end_date: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-md"
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
            value={formatNumber(rndData.gov_contribution || "")}
            onChange={(e) =>
              handleNumberChange("gov_contribution", e.target.value)
            }
            className="w-full p-2 border border-slate-300 rounded-md"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">지원 기관</label>
          <HeadlessSelect
            value={rndData.support_org || ""}
            onChange={(val) => onRndDataChange({ support_org: val })}
            options={
              orgs?.map((org) => ({
                value: org.name,
                label: org.name,
              })) || []
            }
            placeholder="선택하세요."
          />
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
          value={rndData.notes || ""}
          onChange={(e) => onRndDataChange({ notes: e.target.value })}
          className="w-full p-2 border border-slate-300 rounded-md min-h-52"
        />
      </div>
    </FormModal>
  );
}
