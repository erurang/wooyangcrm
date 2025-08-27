"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  Building2,
  Hash,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ProductAnalytics {
  product: {
    id: string;
    code: string;
    name: string;
    specification: string;
    category: string;
    current_stock: number;
    available_stock: number;
    reserved_stock: number;
  };
  statistics: {
    totalSales: number;
    totalRevenue: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    totalCustomers: number;
    repeatCustomers: number;
    averageOrderSize: number;
    lastOrderDate: string;
    firstOrderDate: string;
    orderFrequency: number; // days between orders
  };
  priceHistory: Array<{
    date: string;
    price: number;
    quantity: number;
    company: string;
  }>;
  customerAnalysis: Array<{
    company_id: string;
    company_name: string;
    total_quantity: number;
    total_amount: number;
    order_count: number;
    last_order_date: string;
    average_price: number;
    purchase_frequency: number; // days
  }>;
  monthlyTrend: Array<{
    month: string;
    sales_quantity: number;
    revenue: number;
    order_count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    document_type: string;
    document_number: string;
    company_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

export default function ProductAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [dateRange, setDateRange] = useState("6months");
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "trends" | "transactions">("overview");

  useEffect(() => {
    fetchProductAnalytics();
  }, [productId, dateRange]);

  const fetchProductAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/analytics?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching product analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">제품 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const { product, statistics, priceHistory, customerAnalysis, monthlyTrend, recentTransactions } = analytics;

  // 가격 추세 차트
  const priceChartOptions = {
    chart: {
      type: "line" as const,
      toolbar: { show: false },
      zoom: { enabled: true }
    },
    stroke: {
      curve: "smooth" as const,
      width: 2
    },
    xaxis: {
      type: "datetime" as const,
      categories: priceHistory.map(p => p.date)
    },
    yaxis: {
      title: { text: "단가 (원)" },
      labels: {
        formatter: (val: number) => `${val.toLocaleString()}원`
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()}원`
      }
    },
    colors: ["#3b82f6"]
  };

  const priceChartSeries = [{
    name: "단가",
    data: priceHistory.map(p => p.price)
  }];

  // 월별 판매 추세 차트
  const salesChartOptions = {
    chart: {
      type: "bar" as const,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        columnWidth: "60%",
        borderRadius: 4
      }
    },
    xaxis: {
      categories: monthlyTrend.map(m => m.month),
      labels: {
        rotate: -45
      }
    },
    yaxis: [
      {
        title: { text: "판매 수량" },
        labels: {
          formatter: (val: number) => `${val.toLocaleString()}`
        }
      },
      {
        opposite: true,
        title: { text: "매출액 (백만원)" },
        labels: {
          formatter: (val: number) => `${(val / 1000000).toFixed(1)}M`
        }
      }
    ],
    colors: ["#10b981", "#f59e0b"],
    dataLabels: { enabled: false }
  };

  const salesChartSeries = [
    {
      name: "판매 수량",
      type: "column",
      data: monthlyTrend.map(m => m.sales_quantity)
    },
    {
      name: "매출액",
      type: "line",
      data: monthlyTrend.map(m => m.revenue)
    }
  ];

  // 고객별 구매 비중 차트
  const customerChartOptions = {
    chart: {
      type: "donut" as const,
      toolbar: { show: false }
    },
    labels: customerAnalysis.slice(0, 5).map(c => c.company_name),
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    legend: {
      position: "bottom" as const
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    }
  };

  const customerChartSeries = customerAnalysis.slice(0, 5).map(c => c.total_quantity);

  const getPriceChangeIndicator = () => {
    if (priceHistory.length < 2) return null;
    const latestPrice = priceHistory[priceHistory.length - 1].price;
    const previousPrice = priceHistory[priceHistory.length - 2].price;
    const change = ((latestPrice - previousPrice) / previousPrice) * 100;
    
    return (
      <div className={`flex items-center gap-1 ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
        {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push('/inventory')}
          >
            재고 목록
          </Button>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {product.name} 분석
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                {product.code}
              </span>
              {product.specification && (
                <span>{product.specification}</span>
              )}
              <Badge variant="info">{product.category || "미분류"}</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            >
              <option value="1month">최근 1개월</option>
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
              <option value="all">전체 기간</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 판매량</p>
              <p className="text-2xl font-bold">{statistics.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                평균 {statistics.averageOrderSize.toFixed(1)}개/주문
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 매출액</p>
              <p className="text-2xl font-bold">
                {(statistics.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                평균 단가: {statistics.averagePrice.toLocaleString()}원
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">구매 고객</p>
              <p className="text-2xl font-bold">{statistics.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">
                재구매율: {((statistics.repeatCustomers / statistics.totalCustomers) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">현재 단가</p>
              <p className="text-2xl font-bold">
                {priceHistory.length > 0 
                  ? priceHistory[priceHistory.length - 1].price.toLocaleString()
                  : '-'}원
              </p>
              <div className="mt-1">
                {getPriceChangeIndicator()}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`pb-2 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('customers')}
        >
          고객 분석
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'trends' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('trends')}
        >
          가격 추세
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'transactions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('transactions')}
        >
          거래 내역
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">월별 판매 추세</h3>
            {monthlyTrend.length > 0 && (
              <Chart
                options={salesChartOptions}
                series={salesChartSeries}
                type="line"
                height={350}
              />
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">주요 고객 비중</h3>
            {customerAnalysis.length > 0 && (
              <Chart
                options={customerChartOptions}
                series={customerChartSeries}
                type="donut"
                height={350}
              />
            )}
          </Card>

          <Card className="p-4 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">재고 현황</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{product.current_stock}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">현재고</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{product.available_stock}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">가용재고</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{product.reserved_stock}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">예약재고</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'customers' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>고객사</TableHead>
                <TableHead align="right">구매량</TableHead>
                <TableHead align="right">구매액</TableHead>
                <TableHead align="center">주문 횟수</TableHead>
                <TableHead align="right">평균 단가</TableHead>
                <TableHead align="center">구매 주기</TableHead>
                <TableHead>최근 구매</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerAnalysis.map((customer) => (
                <TableRow key={customer.company_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{customer.company_name}</span>
                    </div>
                  </TableCell>
                  <TableCell align="right" className="font-medium">
                    {customer.total_quantity.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {(customer.total_amount / 1000000).toFixed(2)}M
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant="info">{customer.order_count}회</Badge>
                  </TableCell>
                  <TableCell align="right">
                    {customer.average_price.toLocaleString()}원
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {customer.purchase_frequency > 0 
                          ? `${customer.purchase_frequency}일`
                          : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(customer.last_order_date).toLocaleDateString('ko-KR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">단가 변동 추이</h3>
            {priceHistory.length > 0 && (
              <Chart
                options={priceChartOptions}
                series={priceChartSeries}
                type="line"
                height={350}
              />
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">가격 통계</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">{statistics.priceRange.min.toLocaleString()}원</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">최저가</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">{statistics.priceRange.max.toLocaleString()}원</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">최고가</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">{statistics.averagePrice.toLocaleString()}원</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">평균가</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">
                  {priceHistory.length > 0 
                    ? priceHistory[priceHistory.length - 1].price.toLocaleString()
                    : '-'}원
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">현재가</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일자</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>문서번호</TableHead>
                <TableHead>거래처</TableHead>
                <TableHead align="right">수량</TableHead>
                <TableHead align="right">단가</TableHead>
                <TableHead align="right">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {new Date(transaction.date).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.type === 'IN' ? 'success' : 'info'}
                    >
                      {transaction.type === 'IN' ? '입고' : '출고'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transaction.document_number}
                  </TableCell>
                  <TableCell>{transaction.company_name}</TableCell>
                  <TableCell align="right" className="font-medium">
                    {transaction.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {transaction.unit_price.toLocaleString()}원
                  </TableCell>
                  <TableCell align="right" className="font-medium">
                    {transaction.total_amount.toLocaleString()}원
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}