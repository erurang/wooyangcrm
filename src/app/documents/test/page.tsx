"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Save, Building, Loader2, CheckCircle, AlertCircle, FileText, Clock, Eye, Printer, X, Link2 } from "lucide-react";
import Link from "next/link";
import DocumentItemsGrid from "@/components/documents/DocumentItemsGrid";
import { useLoginUser } from "@/context/login";

interface Items {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
  product_id?: string;
  internal_name?: string;
  internal_spec?: string;
  original_unit_price?: number; // 선택 시점의 원래 단가 (변동 비교용)
}

interface CompanyInfo {
  id: string;
  name: string;
}

interface LinkedDocument {
  id: string;
  document_number: string;
  type: string;
  date: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count?: number;
}

interface DocumentItem {
  id: string;
  item_number: number;
  name: string;
  spec: string | null;
  internal_name: string | null;
  internal_spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
  product_id: string | null;
  products?: {
    internal_name: string;
    internal_code: string;
  };
}

interface DocumentDetail {
  document: LinkedDocument & {
    notes?: string;
    companies?: { name: string };
  };
  items: DocumentItem[];
}

export default function DocumentTestPage() {
  const router = useRouter();
  const user = useLoginUser();
  const searchParams = useSearchParams();
  const companyIdParam = searchParams.get("compId");
  const consultIdParam = searchParams.get("consultId");
  const typeParam = searchParams.get("type"); // estimate 또는 order

  const [items, setItems] = useState<Items[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [documentType, setDocumentType] = useState<"order" | "estimate">(
    typeParam === "order" ? "order" : "estimate"
  );
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // 문서 상세 보기 모달 상태
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // type이 URL 파라미터로 지정된 경우 고정 모드
  const isTypeFixed = !!typeParam;

  // 거래처 정보 로드
  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!companyIdParam) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${companyIdParam}`);
        if (res.ok) {
          const data = await res.json();
          // API 응답이 { company: {...} } 형태
          setCompanyInfo({ id: data.company.id, name: data.company.name });
        }
      } catch (error) {
        console.error("Failed to load company info:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyInfo();
  }, [companyIdParam]);

  // 재고연동 문서 목록 로드 (document_items 테이블 사용하는 문서)
  useEffect(() => {
    const loadLinkedDocuments = async () => {
      if (!consultIdParam) return;

      setLoadingDocs(true);
      try {
        const res = await fetch(`/api/documents/test/list?consultationId=${consultIdParam}`);
        if (res.ok) {
          const data = await res.json();
          setLinkedDocuments(data.documents || []);
        }
      } catch (error) {
        console.error("Failed to load linked documents:", error);
      } finally {
        setLoadingDocs(false);
      }
    };

    loadLinkedDocuments();
  }, [consultIdParam, saveResult]); // saveResult 변경 시 목록 새로고침

  // 문서 상세 로드
  const loadDocumentDetail = async (docId: string) => {
    setSelectedDocId(docId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/documents/test?id=${docId}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentDetail(data);
      }
    } catch (error) {
      console.error("Failed to load document detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 문서 상세 모달 닫기
  const closeDetailModal = () => {
    setSelectedDocId(null);
    setDocumentDetail(null);
  };

  // 프린트 기능
  const handlePrint = () => {
    window.print();
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", spec: "", quantity: "", unit_price: 0, amount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const quantity = parseFloat(value) || 0;
          return {
            ...item,
            quantity: value,
            amount: quantity * item.unit_price,
          };
        }
        return item;
      })
    );
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const quantity = parseFloat(String(item.quantity)) || 0;
          return {
            ...item,
            unit_price: numericValue,
            amount: quantity * numericValue,
          };
        }
        return item;
      })
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSave = async () => {
    // 필수 값 확인
    if (!user?.id) {
      setSaveResult({ success: false, message: "로그인이 필요합니다." });
      return;
    }

    if (!companyIdParam) {
      setSaveResult({ success: false, message: "거래처 정보가 필요합니다. (URL에 compId 파라미터)" });
      return;
    }

    if (!consultIdParam) {
      setSaveResult({ success: false, message: "상담 정보가 필요합니다. (URL에 consultId 파라미터)" });
      return;
    }

    if (items.length === 0) {
      setSaveResult({ success: false, message: "품목을 1개 이상 추가해주세요." });
      return;
    }

    // 품명이 비어있는 항목 확인
    const emptyItems = items.filter((item) => !item.name.trim());
    if (emptyItems.length > 0) {
      setSaveResult({ success: false, message: "품명이 비어있는 항목이 있습니다." });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const response = await fetch("/api/documents/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          user_id: user.id,
          consultation_id: consultIdParam,
          company_id: companyIdParam,
          type: documentType,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveResult({
          success: true,
          message: `${data.message} (문서번호: ${data.document?.document_number})`,
        });

        // 2초 후 상담 페이지로 이동
        setTimeout(() => {
          router.push(`/consultations/${companyIdParam}?consultId=${consultIdParam}`);
        }, 2000);
      } else {
        setSaveResult({
          success: false,
          message: data.error || "저장 중 오류가 발생했습니다.",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveResult({
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 프린트 스타일 */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={consultIdParam ? `/consultations/${companyIdParam}` : "/documents/review"}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Package className={`h-5 w-5 ${documentType === "order" ? "text-indigo-600" : "text-blue-600"}`} />
                  문서 작성 (실험실)
                </h1>
                <p className="text-sm text-slate-500">
                  document_items 테이블 연동 테스트
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !user?.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                saving || !user?.id
                  ? "bg-slate-400 cursor-not-allowed"
                  : documentType === "order"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "저장 중..." : documentType === "estimate" ? "견적서 저장" : "발주서 저장"}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 저장 결과 메시지 */}
        {saveResult && (
          <div
            className={`rounded-xl border p-4 flex items-center gap-3 ${
              saveResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {saveResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{saveResult.message}</span>
            {saveResult.success && (
              <span className="text-xs text-green-600 ml-auto">상담 페이지로 이동합니다...</span>
            )}
          </div>
        )}

        {/* 거래처 정보 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-slate-500" />
            <h2 className="font-medium text-slate-800">거래처 정보</h2>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">거래처 정보 로딩 중...</div>
          ) : companyInfo ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">거래처명</p>
                <p className="font-medium text-slate-800">{companyInfo.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">거래처 ID</p>
                <p className="text-xs text-slate-400 font-mono">{companyInfo.id}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              거래처 정보 없음 (URL에 compId 파라미터 필요)
            </div>
          )}
        </div>

        {/* 문서 유형 선택 - type 파라미터가 없을 때만 표시 */}
        {!isTypeFixed ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-medium text-slate-800 mb-3">문서 유형</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setDocumentType("estimate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  documentType === "estimate"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                견적서 (매출)
              </button>
              <button
                onClick={() => setDocumentType("order")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  documentType === "order"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                발주서 (매입)
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {documentType === "estimate"
                ? "견적서: 매출용 별칭(sales)을 우선 검색합니다"
                : "발주서: 매입용 별칭(purchase)을 우선 검색합니다"}
            </p>
          </div>
        ) : (
          <div className={`rounded-xl border p-4 ${
            documentType === "order"
              ? "bg-indigo-50 border-indigo-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-center gap-2">
              <Package className={`h-5 w-5 ${
                documentType === "order" ? "text-indigo-600" : "text-blue-600"
              }`} />
              <span className={`font-medium ${
                documentType === "order" ? "text-indigo-800" : "text-blue-800"
              }`}>
                {documentType === "estimate" ? "견적서 (매출)" : "발주서 (매입)"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {documentType === "estimate"
                ? "매출용 별칭(sales)을 우선 검색합니다"
                : "매입용 별칭(purchase)을 우선 검색합니다"}
            </p>
          </div>
        )}

        {/* 재고연동 문서 목록 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              <h2 className="font-medium text-slate-800">
                재고연동 문서 목록
                {isTypeFixed && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    documentType === "order"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {documentType === "estimate" ? "견적서" : "발주서"}
                  </span>
                )}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              document_items 테이블 사용
            </span>
          </div>

          {loadingDocs ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              문서 로딩 중...
            </div>
          ) : linkedDocuments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">재고연동 문서가 없습니다</p>
              <p className="text-xs mt-1">아래에서 새 문서를 작성하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedDocuments
                .filter(doc => !isTypeFixed || doc.type === documentType)
                .map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => loadDocumentDetail(doc.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      doc.type === "order"
                        ? "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50"
                        : "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        doc.type === "order" ? "bg-indigo-100" : "bg-blue-100"
                      }`}>
                        <Package className={`h-4 w-4 ${
                          doc.type === "order" ? "text-indigo-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 text-sm">
                            {doc.document_number}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            doc.type === "order"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {doc.type === "estimate" ? "견적서" : "발주서"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{doc.date}</span>
                          {doc.items_count !== undefined && (
                            <span>• {doc.items_count}개 품목</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-slate-800">
                          {doc.total_amount?.toLocaleString()}원
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                      <Eye className={`h-4 w-4 ${
                        doc.type === "order" ? "text-indigo-400" : "text-blue-400"
                      }`} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 품목 그리드 */}
        <DocumentItemsGrid
          items={items}
          setItems={setItems}
          addItem={addItem}
          removeItem={removeItem}
          handleQuantityChange={handleQuantityChange}
          handleUnitPriceChange={handleUnitPriceChange}
          accentColor={documentType === "order" ? "indigo" : "blue"}
          companyId={companyInfo?.id}
          companyName={companyInfo?.name}
          documentType={documentType}
          useProductSearch={true}
        />

        {/* 합계 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">합계 금액</span>
            <span className="text-xl font-bold text-slate-800">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 디버그 정보 */}
        <div className="bg-slate-800 rounded-xl p-4 text-white print:hidden">
          <h3 className="font-medium mb-2 text-slate-300">디버그 정보</h3>
          <div className="text-xs space-y-2 mb-3">
            <div className="flex gap-4">
              <span className="text-slate-400">user_id:</span>
              <span className="font-mono">{user?.id || "(로그인 필요)"}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400">company_id:</span>
              <span className="font-mono">{companyIdParam || "(없음)"}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400">consultation_id:</span>
              <span className="font-mono">{consultIdParam || "(없음)"}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400">document_type:</span>
              <span className="font-mono">{documentType}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-400">items_count:</span>
              <span className="font-mono">{items.length}</span>
            </div>
          </div>
          <h4 className="font-medium mb-2 text-slate-400 text-xs">items 데이터 (document_items 테이블에 저장됨)</h4>
          <pre className="text-xs overflow-auto max-h-60 bg-slate-900 rounded-lg p-3">
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>
      </div>

      {/* 문서 상세 보기 모달 */}
      {selectedDocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <FileText className={`h-5 w-5 ${
                  documentDetail?.document?.type === "order" ? "text-indigo-600" : "text-blue-600"
                }`} />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    문서 상세
                  </h2>
                  <p className="text-sm text-slate-500">
                    {documentDetail?.document?.document_number || "로딩 중..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  프린트
                </button>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="flex-1 overflow-y-auto p-6 print:overflow-visible">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                </div>
              ) : documentDetail ? (
                <div className="space-y-6">
                  {/* 문서 정보 */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-xl font-bold ${
                          documentDetail.document.type === "order" ? "text-indigo-700" : "text-blue-700"
                        }`}>
                          {documentDetail.document.type === "estimate" ? "견 적 서" : "발 주 서"}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          문서번호: {documentDetail.document.document_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">작성일</p>
                        <p className="font-medium">{documentDetail.document.date}</p>
                      </div>
                    </div>
                    {documentDetail.document.companies?.name && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">거래처</p>
                        <p className="font-medium text-slate-800">{documentDetail.document.companies.name}</p>
                      </div>
                    )}
                  </div>

                  {/* 품목 테이블 */}
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">품목 내역</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className={`text-left text-xs ${
                          documentDetail.document.type === "order"
                            ? "bg-indigo-50 text-indigo-800"
                            : "bg-blue-50 text-blue-800"
                        }`}>
                          <th className="p-2 border border-slate-200">No</th>
                          <th className="p-2 border border-slate-200">품명</th>
                          <th className="p-2 border border-slate-200">규격</th>
                          <th className="p-2 border border-slate-200 text-center">수량</th>
                          <th className="p-2 border border-slate-200 text-right">단가</th>
                          <th className="p-2 border border-slate-200 text-right">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentDetail.items.map((item, index) => {
                          const internalName = item.internal_name || item.products?.internal_name;
                          return (
                            <tr key={item.id} className="text-sm hover:bg-slate-50">
                              <td className="p-2 border border-slate-200 text-center text-slate-500">
                                {index + 1}
                              </td>
                              <td className="p-2 border border-slate-200">
                                <div className="font-medium">{item.name}</div>
                                {item.product_id && internalName && (
                                  <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                                    <Link2 className="h-3 w-3" />
                                    <span>{internalName}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 border border-slate-200 text-slate-600">
                                {item.spec || "-"}
                                {item.internal_spec && item.internal_spec !== item.spec && (
                                  <div className="text-xs text-green-600">({item.internal_spec})</div>
                                )}
                              </td>
                              <td className="p-2 border border-slate-200 text-center">
                                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                              </td>
                              <td className="p-2 border border-slate-200 text-right">
                                {item.unit_price?.toLocaleString()}원
                              </td>
                              <td className="p-2 border border-slate-200 text-right font-medium">
                                {item.amount?.toLocaleString()}원
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className={`font-bold ${
                          documentDetail.document.type === "order"
                            ? "bg-indigo-50"
                            : "bg-blue-50"
                        }`}>
                          <td colSpan={5} className="p-3 border border-slate-200 text-right">
                            합 계
                          </td>
                          <td className="p-3 border border-slate-200 text-right text-lg">
                            {documentDetail.document.total_amount?.toLocaleString()}원
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 비고 */}
                  {documentDetail.document.notes && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-600 mb-1">비고</h4>
                      <p className="text-slate-800 whitespace-pre-wrap">{documentDetail.document.notes}</p>
                    </div>
                  )}

                  {/* 프린트용 푸터 */}
                  <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-slate-400">
                    <p>이 문서는 WOOYANG CRM에서 생성되었습니다.</p>
                    <p>생성일시: {new Date().toLocaleString("ko-KR")}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  문서를 찾을 수 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
