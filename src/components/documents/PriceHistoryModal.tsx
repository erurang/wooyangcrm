"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Minus, Loader2, Calendar, Building2 } from "lucide-react";
import dynamic from "next/dynamic";

// ApexCharts를 동적으로 로드 (SSR 비활성화)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PriceHistoryItem {
  id: string;
  product_id: string;
  company_id: string | null;
  unit_price: number;
  previous_price: number | null;
  spec: string | null;
  effective_date: string;
  price_change: number;
  price_change_percent: number;
  product?: {
    id: string;
    internal_name: string;
    internal_code: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

interface PriceStats {
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  latestPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
  companyId?: string;
  companyName?: string;
  priceType?: "purchase" | "sales";
  spec?: string;
}

export default function PriceHistoryModal({
  isOpen,
  onClose,
  productId,
  productName,
  companyId,
  companyName,
  priceType = "purchase",
  spec,
}: PriceHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      loadPriceHistory();
    }
  }, [isOpen, productId, companyId, priceType, spec]);

  const loadPriceHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (productId) params.append("product_id", productId);
      if (companyId) params.append("company_id", companyId);
      if (priceType) params.append("price_type", priceType);
      if (spec) params.append("spec", spec);
      params.append("limit", "100");

      const res = await fetch(`/api/products/price-history?${params}`);
      const data = await res.json();

      if (data.history) {
        setHistory(data.history);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load price history:", error);
    } finally {
      setLoading(false);
    }
  };

  // 차트 데이터 준비 (날짜 오름차순으로 정렬)
  const chartData = [...history].reverse();
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height: 250,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    colors: ["#6366f1"],
    xaxis: {
      categories: chartData.map((d) =>
        new Date(d.effective_date).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        })
      ),
      labels: {
        style: { fontSize: "11px", colors: "#64748b" },
        rotate: -45,
        rotateAlways: chartData.length > 10,
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#64748b" },
        formatter: (val) => val.toLocaleString() + "원",
      },
    },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString() + "원",
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
  };

  const chartSeries = [
    {
      name: "단가",
      data: chartData.map((d) => d.unit_price),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b bg-sky-50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">단가 추이</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {productName || "제품"} {companyName ? `(${companyName})` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">단가 이력이 없습니다.</p>
              <p className="text-sm text-slate-400 mt-1">
                문서 작성 시 단가가 자동으로 기록됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 통계 카드 */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">현재 단가</div>
                    <div className="text-lg font-bold text-slate-800">
                      {stats.latestPrice.toLocaleString()}원
                    </div>
                    {stats.priceChange !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          stats.priceChange > 0
                            ? "text-red-500"
                            : "text-sky-500"
                        }`}
                      >
                        {stats.priceChange > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {stats.priceChangePercent > 0 ? "+" : ""}
                        {stats.priceChangePercent}%
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">평균 단가</div>
                    <div className="text-lg font-bold text-slate-800">
                      {stats.avgPrice.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">최저</div>
                    <div className="text-lg font-bold text-sky-600">
                      {stats.minPrice.toLocaleString()}원
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">최고</div>
                    <div className="text-lg font-bold text-red-600">
                      {stats.maxPrice.toLocaleString()}원
                    </div>
                  </div>
                </div>
              )}

              {/* 차트 */}
              {chartData.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5">
                  <h3 className="text-sm font-medium text-slate-600 mb-3">
                    단가 변동 추이
                  </h3>
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height={250}
                  />
                </div>
              )}

              {/* 이력 테이블 */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b">
                  <h3 className="text-sm font-medium text-slate-600">
                    상세 이력 ({history.length}건)
                  </h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                          날짜
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">
                          단가
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">
                          변동
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                          거래처
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(item.effective_date).toLocaleDateString(
                                "ko-KR"
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-slate-800">
                            {item.unit_price.toLocaleString()}원
                          </td>
                          <td className="px-4 py-2 text-right">
                            {item.price_change === 0 ? (
                              <span className="text-slate-400 flex items-center justify-end gap-1">
                                <Minus className="h-3 w-3" />-
                              </span>
                            ) : (
                              <span
                                className={`flex items-center justify-end gap-1 ${
                                  item.price_change > 0
                                    ? "text-red-500"
                                    : "text-sky-500"
                                }`}
                              >
                                {item.price_change > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {item.price_change > 0 ? "+" : ""}
                                {item.price_change.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-400">
                            {item.company?.name ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                <span className="truncate max-w-[120px]">
                                  {item.company.name}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
