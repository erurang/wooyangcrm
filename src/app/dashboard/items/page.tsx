"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "@/context/dashboard";
import ItemsTab from "@/components/dashboard/tabs/ItemsTab";

export default function DashboardItemsPage() {
  const {
    aggregatedData,
    chartData,
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemCategory, setSelectedItemCategory] = useState<
    "all" | "sales" | "purchase"
  >("all");

  const filteredItems = useMemo(() => {
    const allItems = [
      ...aggregatedData.salesProducts.map((item: any) => ({
        ...item,
        type: "sales" as const,
      })),
      ...aggregatedData.purchaseProducts.map((item: any) => ({
        ...item,
        type: "purchase" as const,
      })),
    ];

    return allItems.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.spec &&
          item.spec.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedItemCategory === "all" || item.type === selectedItemCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedItemCategory, aggregatedData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ItemsTab
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedItemCategory={selectedItemCategory}
        setSelectedItemCategory={setSelectedItemCategory}
        filteredItems={filteredItems}
        itemsChartData={chartData.itemsChartData}
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
      />
    </motion.div>
  );
}
