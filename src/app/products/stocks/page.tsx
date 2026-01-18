"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TableRow {
  productName: string;
  spec: string;
  quantity: number;
  lot: string;
  note: string;
  purchase: string;
  expectedSell: number;
}

export default function FakeInventoryPage() {
  const today = new Date().toISOString().split("T")[0];

  // 필터 상태 (제품 검색)
  const [searchTerm, setSearchTerm] = useState("");

  // 가짜 재고(제품) 데이터
  const fakeData: TableRow[] = [
    {
      productName: "제품 A",
      spec: "규격 1",
      quantity: 100,
      lot: "LOT001",
      note: "비고 A",
      purchase: "구매처 A",
      expectedSell: 80,
    },
    {
      productName: "제품 B",
      spec: "규격 2",
      quantity: 200,
      lot: "LOT002",
      note: "비고 B",
      purchase: "구매처 B",
      expectedSell: 150,
    },
    {
      productName: "제품 C",
      spec: "규격 3",
      quantity: 150,
      lot: "LOT003",
      note: "비고 C",
      purchase: "구매처 C",
      expectedSell: 120,
    },
  ];

  // 검색어에 따라 필터링된 데이터
  const filteredData = fakeData.filter((row) =>
    row.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-sm text-[#37352F] p-4">
      {/* 검색 및 필터 영역 */}
      <div className="bg-[#FBFBFB] rounded-md border px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            <label className="p-2 border border-gray-300 rounded-l min-w-[80px] h-full">
              제품명
            </label>
            <motion.input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제품검색"
              className="p-2 border-t border-b border-r border-gray-300 rounded-r w-full h-full"
              whileFocus={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setSearchTerm("")}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              필터리셋
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">품명</th>
              <th className="px-4 py-2 border">규격</th>
              <th className="px-4 py-2 border">수량</th>
              <th className="px-4 py-2 border">LOT</th>
              <th className="px-4 py-2 border">비고</th>
              <th className="px-4 py-2 border">구매처</th>
              <th className="px-4 py-2 border">예상판매량</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{row.productName}</td>
                <td className="px-4 py-2 border">{row.spec}</td>
                <td className="px-4 py-2 border">{row.quantity}</td>
                <td className="px-4 py-2 border">{row.lot}</td>
                <td className="px-4 py-2 border">{row.note}</td>
                <td className="px-4 py-2 border">{row.purchase}</td>
                <td className="px-4 py-2 border">{row.expectedSell}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
