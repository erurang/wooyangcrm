"use client";

import { motion } from "framer-motion";
import FormModal from "@/components/ui/FormModal";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { Building } from "lucide-react";

interface Brnds {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
}

interface Org {
  id: string;
  name: string;
}

interface BrndsModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  brndsData: Brnds;
  onBrndsDataChange: (data: Partial<Brnds>) => void;
  orgs: Org[];
  formatNumber: (value: string) => string;
}

export default function BrndsModal({
  mode,
  isOpen,
  onClose,
  onSave,
  isSaving,
  brndsData,
  onBrndsDataChange,
  orgs,
  formatNumber,
}: BrndsModalProps) {
  const handleNumberChange = (
    field: "total_cost" | "gov_contribution",
    value: string
  ) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    onBrndsDataChange({ [field]: numericValue });
  };

  return (
    <FormModal
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      title={{ add: "비R&D 사업 추가", edit: "비R&D 사업 수정" }}
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
            value={brndsData.name || ""}
            onChange={(e) => onBrndsDataChange({ name: e.target.value })}
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
            value={formatNumber(brndsData.total_cost || "")}
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
            value={brndsData.start_date || ""}
            onChange={(e) =>
              onBrndsDataChange({ start_date: e.target.value })
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
            value={brndsData.end_date || ""}
            onChange={(e) =>
              onBrndsDataChange({ end_date: e.target.value })
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
            value={formatNumber(brndsData.gov_contribution || "")}
            onChange={(e) =>
              handleNumberChange("gov_contribution", e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">지원 기관</label>
          <HeadlessSelect
            value={brndsData.support_org || ""}
            onChange={(value) =>
              onBrndsDataChange({ support_org: value })
            }
            options={orgs?.map((org) => ({
              value: org.name,
              label: org.name,
            })) || []}
            placeholder="선택하세요."
            icon={<Building className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="mb-2">
        <label className="block mb-1">비고</label>
        <textarea
          placeholder=""
          value={brndsData.notes || ""}
          onChange={(e) => onBrndsDataChange({ notes: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md min-h-52"
        />
      </div>
    </FormModal>
  );
}
