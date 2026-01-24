"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit2,
  History,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRawMaterials, usePurchasedProducts, useLowStockProducts } from "@/hooks/production/useProducts";
import { useProduct } from "@/hooks/production/useProduct";
import { useDebounce } from "@/hooks/useDebounce";
import ProductFormModal from "@/components/production/products/ProductFormModal";
import StockAdjustmentModal from "@/components/production/products/StockAdjustmentModal";
import AutoOrderSuggestions from "@/components/inventory/AutoOrderSuggestions";
import type { Product, ProductCreateRequest } from "@/types/production";

type ViewMode = "raw_material" | "purchased";

export default function InventoryPage() {
  const user = useLoginUser();

  // View mode & filters
  const [viewMode, setViewMode] = useState<ViewMode>("raw_material");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data hooks
  const rawMaterials = useRawMaterials({
    search: debouncedSearch || undefined,
    is_active: true,
    low_stock: showLowStockOnly || undefined,
  });

  const purchasedProducts = usePurchasedProducts({
    search: debouncedSearch || undefined,
    is_active: true,
    low_stock: showLowStockOnly || undefined,
  });

  const { products: lowStockProducts } = useLowStockProducts();

  const currentData = viewMode === "raw_material" ? rawMaterials : purchasedProducts;
  const { products, isLoading, createProduct, refresh } = currentData;

  // Hook for stock adjustment
  const productHook = useProduct(selectedProduct?.id);

  // Stats
  const lowStockCount = lowStockProducts.length;

  const handleCreateProduct = async (data: ProductCreateRequest) => {
    setIsSubmitting(true);
    try {
      await createProduct(data);
      setIsFormModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjust = async (quantity: number, notes?: string) => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await productHook.adjustStock(quantity, notes, user?.id);
      refresh();
      setIsStockModalOpen(false);
      setSelectedProduct(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setIsStockModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">원자재 재고</h1>
                {lowStockCount > 0 && (
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    저재고 {lowStockCount}건
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 품목
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("raw_material")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "raw_material"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            원자재
          </button>
          <button
            onClick={() => setViewMode("purchased")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "purchased"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            구매품
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="품목명, 코드 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Low Stock Filter */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showLowStockOnly
                ? "bg-orange-100 text-orange-700 border-orange-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-orange-200"
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            저재고만
          </button>
        </div>
      </div>

      {/* 발주 권장 패널 */}
      <div className="px-4 pt-4">
        <AutoOrderSuggestions compact />
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {showLowStockOnly ? "저재고 품목이 없습니다" : "등록된 품목이 없습니다"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {showLowStockOnly
                ? "모든 재고가 안전 수준입니다"
                : "새 품목을 등록해보세요"}
            </p>
            {!showLowStockOnly && (
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                새 품목 등록
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">품목</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">카테고리</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">현재 재고</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">최소 재고</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">상태</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => {
                  const isLowStock =
                    product.min_stock_alert !== null &&
                    product.current_stock <= (product.min_stock_alert || 0);

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`hover:bg-slate-50 ${isLowStock ? "bg-orange-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{product.internal_name}</p>
                          <p className="text-xs text-slate-400">{product.internal_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {product.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${isLowStock ? "text-orange-600" : "text-slate-800"}`}>
                          {product.current_stock.toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-sm ml-1">{product.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {product.min_stock_alert !== null
                          ? `${product.min_stock_alert.toLocaleString()} ${product.unit}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            <AlertTriangle className="h-3 w-3" />
                            저재고
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            정상
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openStockModal(product)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="재고 조정"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        defaultType={viewMode}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateProduct}
        isLoading={isSubmitting}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        product={selectedProduct}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleStockAdjust}
        isLoading={isSubmitting}
      />
    </div>
  );
}
