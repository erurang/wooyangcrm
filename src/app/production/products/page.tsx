"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Package,
  Layers,
  Edit2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useFinishedProducts, useRawMaterials, usePurchasedProducts } from "@/hooks/production/useProducts";
import { useProduct } from "@/hooks/production/useProduct";
import { useDebounce } from "@/hooks/useDebounce";
import ProductFormModal from "@/components/production/products/ProductFormModal";
import type { Product, ProductCreateRequest } from "@/types/production";

export default function ProductsPage() {
  const user = useLoginUser();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data hooks
  const { products: finishedProducts, isLoading, createProduct, refresh } = useFinishedProducts({
    search: debouncedSearch || undefined,
    is_active: true,
  });

  // For BOM display
  const { products: rawMaterials } = useRawMaterials({ is_active: true });
  const { products: purchasedProducts } = usePurchasedProducts({ is_active: true });
  const allMaterials = [...rawMaterials, ...purchasedProducts];

  const handleCreateProduct = async (data: ProductCreateRequest) => {
    setIsSubmitting(true);
    try {
      await createProduct({ ...data, type: "finished" });
      setIsFormModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Package className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">제품 관리</h1>
                <p className="text-xs text-slate-500">완제품 목록 및 BOM 관리</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 제품
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="제품명, 코드 검색..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
          </div>
        ) : finishedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              등록된 완제품이 없습니다
            </h3>
            <p className="text-sm text-slate-400 mb-4">새 제품을 등록해보세요</p>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              새 제품 등록
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {finishedProducts.map((product, index) => {
              const isExpanded = expandedProduct === product.id;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Product Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(product.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-lg">
                          <Package className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{product.internal_name}</h3>
                          <p className="text-sm text-slate-500">{product.internal_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {product.category && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            {product.category}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                            setIsFormModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - BOM */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-4 bg-slate-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="h-4 w-4 text-slate-500" />
                          <h4 className="text-sm font-medium text-slate-700">BOM (원자재 구성)</h4>
                        </div>

                        {product.materials && product.materials.length > 0 ? (
                          <div className="space-y-2">
                            {product.materials.map((material) => {
                              const materialInfo = allMaterials.find(
                                (m) => m.id === material.material_id
                              );
                              return (
                                <div
                                  key={material.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                >
                                  <div>
                                    <p className="font-medium text-slate-800">
                                      {materialInfo?.internal_name || material.material_id}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {materialInfo?.internal_code}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-slate-800">
                                      {material.quantity_required} {materialInfo?.unit || "개"}
                                    </p>
                                    {material.notes && (
                                      <p className="text-xs text-slate-400">{material.notes}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-4">
                            등록된 원자재 구성이 없습니다
                          </p>
                        )}

                        {/* Product Details */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">규격: </span>
                              <span className="text-slate-800">{product.spec || "-"}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">단위: </span>
                              <span className="text-slate-800">{product.unit}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">기본 단가: </span>
                              <span className="text-slate-800">
                                {product.unit_price ? `${product.unit_price.toLocaleString()}원` : "-"}
                              </span>
                            </div>
                          </div>
                          {product.description && (
                            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        product={editingProduct}
        defaultType="finished"
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateProduct}
        isLoading={isSubmitting}
      />
    </div>
  );
}
