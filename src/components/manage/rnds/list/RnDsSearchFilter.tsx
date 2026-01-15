"use client";

import { motion } from "framer-motion";

interface RnDsSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export default function RnDsSearchFilter({
  searchTerm,
  onSearchChange,
  onReset,
}: RnDsSearchFilterProps) {
  return (
    <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="flex items-center justify-center">
        <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
          사업명
        </label>
        <motion.input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="사업명"
          className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>

      <div className="flex items-center justify-center">
        <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
          수행날짜
        </label>
        <motion.input
          type="date"
          className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md mr-2"
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
        />
        ~
        <motion.input
          type="date"
          className="w-3/4 p-2 border-[1px] border-gray-300 rounded-md ml-2"
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-md"
        >
          필터리셋
        </button>
      </div>
    </div>
  );
}
